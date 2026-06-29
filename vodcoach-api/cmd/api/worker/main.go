package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/events"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
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

			if err := processVodUploaded(ctx, vodRepository, event); err != nil {
				log.Printf("failed to process vod uploaded event for vod %s: %v", event.VodID, err)
				continue
			}
		}
	}
}

func processVodUploaded(ctx context.Context, vodRepository *repository.VodRepository, event events.VodUploadedEvent) error {
	if err := vodRepository.UpdateStatus(ctx, event.VodID, "processing"); err != nil {
		return err
	}

	// Phase 4 only proves that background processing works. Later phases replace
	// this sleep with ffprobe, thumbnail generation, and preview video creation.
	time.Sleep(3 * time.Second)

	return vodRepository.UpdateStatus(ctx, event.VodID, "ready")
}
