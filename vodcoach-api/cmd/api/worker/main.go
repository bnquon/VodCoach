package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/events"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
	"github.com/twmb/franz-go/pkg/kgo"
)

const workerConsumerGroup = "vodcoach-worker"

func main() {
	ctx := context.Background()

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("Database URL is empty from .env file")
	}

	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	brokers := strings.Split(os.Getenv("REDPANDA_BROKERS"), ",")
	if len(brokers) == 0 || strings.TrimSpace(brokers[0]) == "" {
		log.Fatal("REDPANDA_BROKERS environment variable is required")
	}

	client, err := kgo.NewClient(
		kgo.SeedBrokers(brokers...),
		kgo.ConsumerGroup(workerConsumerGroup),
		kgo.ConsumeTopics(events.VodUploadedTopic),
		kgo.ConsumeResetOffset(kgo.NewOffset().AtStart()),
	)
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	vodRepository := repository.NewVodRepository(pool)
	r2Client := newR2Client(ctx)
	originalBucketName := requiredEnv("R2_BUCKET_NAME")
	thumbnailBucketName := requiredEnv("R2_THUMBNAIL_BUCKET_NAME")
	originalStorageService := services.NewStorageService(originalBucketName, r2Client)
	thumbnailStorageService := services.NewStorageService(thumbnailBucketName, r2Client)
	mediaService := services.NewMediaService()

	log.Printf(
		"worker started: brokers=%s group=%s topic=%s original_bucket=%s thumbnail_bucket=%s",
		strings.Join(brokers, ","),
		workerConsumerGroup,
		events.VodUploadedTopic,
		originalBucketName,
		thumbnailBucketName,
	)

	for {
		fetches := client.PollFetches(ctx)
		if errs := fetches.Errors(); len(errs) > 0 {
			for _, err := range errs {
				log.Printf("redpanda fetch error: %v", err)
			}
			continue
		}

		iter := fetches.RecordIter()
		for !iter.Done() {
			record := iter.Next()

			// Redpanda tells this worker that a VOD was uploaded, but Redpanda is
			// not the source of truth for VOD status. Postgres is. That is why the
			// worker needs a DB connection: it consumes the event, then updates the
			// VOD row so the API/dashboard can read the new status.
			event, err := events.DecodeVodUploadedEvent(record.Value)
			if err != nil {
				log.Printf("failed to decode vod uploaded event: %v", err)
				continue
			}
			log.Printf("received vod.uploaded: vod_id=%s user_id=%s", event.VodID, event.UserID)

			if err := processVodUploaded(
				ctx,
				vodRepository,
				originalStorageService,
				thumbnailStorageService,
				mediaService,
				event,
			); err != nil {
				log.Printf("failed to process vod uploaded event for vod %s: %v", event.VodID, err)
				if markErr := vodRepository.MarkProcessingFailed(ctx, repository.MarkVodProcessingFailedParams{
					VodID:        event.VodID,
					ErrorMessage: compactErrorMessage(err),
				}); markErr != nil {
					log.Printf("failed to mark vod failed: vod_id=%s error=%v", event.VodID, markErr)
				}
				continue
			}
		}
	}
}

func processVodUploaded(
	ctx context.Context,
	vodRepository *repository.VodRepository,
	originalStorageService *services.StorageService,
	thumbnailStorageService *services.StorageService,
	mediaService *services.MediaService,
	event events.VodUploadedEvent,
) error {
	log.Printf("marking vod processing: vod_id=%s", event.VodID)
	if err := vodRepository.UpdateStatus(ctx, event.VodID, "processing"); err != nil {
		return err
	}

	vod, err := vodRepository.GetByIDAndUserID(ctx, event.VodID, event.UserID)
	if err != nil {
		return err
	}
	if vod.ThumbnailStorageKey == nil || *vod.ThumbnailStorageKey == "" {
		return fmt.Errorf("vod %s is missing thumbnail storage key", event.VodID)
	}

	videoFile, err := os.CreateTemp("", "vodcoach-original-*.mp4")
	if err != nil {
		return err
	}
	videoPath := videoFile.Name()
	if err := videoFile.Close(); err != nil {
		return err
	}
	defer os.Remove(videoPath)

	log.Printf("downloading original vod: vod_id=%s key=%s", event.VodID, event.OriginalStorageKey)
	if err := originalStorageService.DownloadObject(ctx, event.OriginalStorageKey, videoPath); err != nil {
		return err
	}

	log.Printf("probing vod metadata: vod_id=%s", event.VodID)
	metadata, err := mediaService.ProbeVideo(ctx, videoPath)
	if err != nil {
		return err
	}

	log.Printf("generating thumbnail: vod_id=%s", event.VodID)
	thumbnailPath, err := mediaService.GenerateThumbnail(ctx, videoPath)
	if err != nil {
		return err
	}
	defer os.Remove(thumbnailPath)

	log.Printf("uploading thumbnail: vod_id=%s key=%s", event.VodID, *vod.ThumbnailStorageKey)
	if err := thumbnailStorageService.UploadObject(ctx, *vod.ThumbnailStorageKey, thumbnailPath, "image/jpeg"); err != nil {
		return err
	}

	log.Printf(
		"marking vod ready: vod_id=%s duration_seconds=%d width=%d height=%d",
		event.VodID,
		metadata.DurationSeconds,
		metadata.Width,
		metadata.Height,
	)
	if err := vodRepository.CompleteProcessing(ctx, repository.CompleteVodProcessingParams{
		VodID:           event.VodID,
		DurationSeconds: metadata.DurationSeconds,
		Width:           metadata.Width,
		Height:          metadata.Height,
	}); err != nil {
		return err
	}

	log.Printf("finished vod.uploaded: vod_id=%s", event.VodID)
	return nil
}

func newR2Client(ctx context.Context) *s3.Client {
	accountID := requiredEnv("R2_ACCOUNT_ID")
	accessKeyID := requiredEnv("R2_AK_ID")
	accessKeySecret := requiredEnv("R2_SAK")

	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKeyID, accessKeySecret, "")),
		config.WithRegion("auto"),
	)
	if err != nil {
		log.Fatal(err)
	}

	return s3.NewFromConfig(cfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(fmt.Sprintf("https://%s.r2.cloudflarestorage.com", accountID))
	})
}

func requiredEnv(key string) string {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		log.Fatalf("%s environment variable is required", key)
	}

	return value
}

func compactErrorMessage(err error) string {
	const maxErrorMessageLength = 240

	message := strings.TrimSpace(err.Error())
	if len(message) <= maxErrorMessageLength {
		return message
	}

	return message[:maxErrorMessageLength] + "..."
}
