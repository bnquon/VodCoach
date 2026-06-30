package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/events"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/jackc/pgx/v5"
)

const maxVodUploadBytes int64 = 2 * 1024 * 1024 * 1024 // 2GB

var (
	ErrInvalidVodUploadContentType = errors.New("invalid vod upload content type")
	ErrVodUploadTooLarge           = errors.New("vod upload is too large")
	ErrInvalidVodUploadMetadata    = errors.New("invalid vod upload metadata")
	ErrInvalidVodMetadataUpdate    = errors.New("invalid vod metadata update")
	ErrVodNotDeletable             = errors.New("vod is not deletable")
)

type VodService struct {
	vodRepository           *repository.VodRepository
	storageService          *StorageService
	thumbnailStorageService *StorageService
	eventPublisher          events.Publisher
}

type CreateVodUploadParams struct {
	UserID        string
	Title         string
	Game          string
	FileName      string
	ContentType   string
	FileSizeBytes int64
}

type CreateVodUploadResult struct {
	Vod                 *repository.Vod
	UploadURL           string
	OriginalStorageKey  string
	ThumbnailStorageKey string
}

type UpdateVodMetadataParams struct {
	UserID string
	Title  *string
	Game   *string
}

func NewVodService(vodRepository *repository.VodRepository, storageService *StorageService, thumbnailStorageService *StorageService, eventPublisher events.Publisher) *VodService {
	return &VodService{
		vodRepository,
		storageService,
		thumbnailStorageService,
		eventPublisher,
	}
}

func (s *VodService) GetVods(ctx context.Context, userID string) ([]repository.Vod, error) {
	return s.vodRepository.GetByUserID(ctx, userID)
}

func (s *VodService) GetVod(ctx context.Context, vodID string, userID string) (*repository.Vod, error) {
	vod, err := s.vodRepository.GetByIDAndUserID(ctx, vodID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVodAccessDenied
		}

		return nil, err
	}

	return vod, nil
}

func (s *VodService) UpdateVodMetadata(ctx context.Context, vodID string, params UpdateVodMetadataParams) (*repository.Vod, error) {
	title := trimOptionalString(params.Title)
	game := trimOptionalString(params.Game)

	if title == nil && game == nil {
		return nil, ErrInvalidVodMetadataUpdate
	}

	if (title != nil && *title == "") || (game != nil && *game == "") {
		return nil, ErrInvalidVodMetadataUpdate
	}

	vod, err := s.vodRepository.UpdateMetadataByIDAndUserID(ctx, repository.UpdateVodMetadataParams{
		VodID:  vodID,
		UserID: params.UserID,
		Title:  title,
		Game:   game,
	})
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrVodAccessDenied
		}

		return nil, err
	}

	return vod, nil
}

func (s *VodService) CreateVodPlaybackURL(ctx context.Context, vodID string, userID string) (string, error) {
	vod, err := s.vodRepository.GetByIDAndUserID(ctx, vodID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", ErrVodAccessDenied
		}

		return "", err
	}

	playbackURL, err := s.storageService.CreatePresignedGetURL(ctx, vod.OriginalStorageKey, time.Hour)
	if err != nil {
		return "", err
	}

	return playbackURL, nil
}

func (s *VodService) CreateVodUpload(ctx context.Context, params CreateVodUploadParams) (*CreateVodUploadResult, error) {
	title := strings.TrimSpace(params.Title)
	game := strings.TrimSpace(params.Game)
	fileName := strings.TrimSpace(params.FileName)

	if title == "" || game == "" || fileName == "" || params.FileSizeBytes <= 0 {
		return nil, ErrInvalidVodUploadMetadata
	}
	if params.ContentType != "video/mp4" {
		return nil, ErrInvalidVodUploadContentType
	}
	if params.FileSizeBytes > maxVodUploadBytes {
		return nil, ErrVodUploadTooLarge
	}

	vodID, err := newUUID()
	if err != nil {
		return nil, err
	}

	originalStorageKey := buildOriginalStorageKey(params.UserID, vodID, fileName)
	thumbnailStorageKey := buildThumbnailStorageKey(params.UserID, vodID)

	vod, err := s.vodRepository.Create(ctx, repository.CreateVodParams{
		ID:                  vodID,
		UserID:              params.UserID,
		Title:               title,
		Game:                game,
		OriginalStorageKey:  originalStorageKey,
		ThumbnailStorageKey: thumbnailStorageKey,
		OriginalFilename:    fileName,
		ContentType:         params.ContentType,
	})
	if err != nil {
		return nil, err
	}

	uploadURL, err := s.storageService.CreatePresignedUploadURL(ctx, originalStorageKey, params.ContentType)

	if err != nil {
		return nil, err
	}

	return &CreateVodUploadResult{
		Vod:                 vod,
		UploadURL:           uploadURL,
		OriginalStorageKey:  originalStorageKey,
		ThumbnailStorageKey: thumbnailStorageKey,
	}, nil
}

func (s *VodService) CompleteVodUpload(ctx context.Context, vodID string, userID string) (*repository.Vod, error) {
	ownsVod, err := s.vodRepository.UserOwnsVod(ctx, vodID, userID)
	if err != nil {
		return nil, err
	}
	if !ownsVod {
		return nil, ErrVodAccessDenied
	}

	vod, err := s.vodRepository.MarkUploadComplete(ctx, vodID, userID)
	if err != nil {
		return nil, err
	}

	// This hands the slow post-upload work to the worker. The worker consumes
	// vod.uploaded and updates this same VOD row through Postgres.
	if err := s.eventPublisher.PublishVodUploaded(ctx, events.VodUploadedEvent{
		VodID:              vod.ID,
		UserID:             vod.UserID,
		OriginalStorageKey: vod.OriginalStorageKey,
		UploadedAt:         vod.UpdatedAt,
	}); err != nil {
		return nil, err
	}

	return vod, nil
}

func (s *VodService) DeleteVod(ctx context.Context, vodID string, userID string) error {
	vod, err := s.vodRepository.GetByIDAndUserID(ctx, vodID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrVodAccessDenied
		}

		return err
	}

	if vod.Status != "ready" && vod.Status != "failed" {
		return ErrVodNotDeletable
	}

	if err := s.storageService.DeleteObject(ctx, vod.OriginalStorageKey); err != nil {
		return err
	}

	if vod.ThumbnailStorageKey != nil && strings.TrimSpace(*vod.ThumbnailStorageKey) != "" {
		if err := s.thumbnailStorageService.DeleteObject(ctx, *vod.ThumbnailStorageKey); err != nil {
			return err
		}
	}

	deleted, err := s.vodRepository.DeleteByIDAndUserID(ctx, vodID, userID)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrVodAccessDenied
	}

	return nil
}

func buildOriginalStorageKey(userID string, vodID string, fileName string) string {
	extension := strings.ToLower(filepath.Ext(fileName))
	if extension == "" {
		extension = ".mp4"
	}

	return fmt.Sprintf("users/%s/vods/%s/original%s", userID, vodID, extension)
}

func buildThumbnailStorageKey(userID string, vodID string) string {
	return fmt.Sprintf("users/%s/vods/%s/thumbnail.jpg", userID, vodID)
}

func trimOptionalString(value *string) *string {
	if value == nil {
		return nil
	}

	trimmedValue := strings.TrimSpace(*value)
	return &trimmedValue
}

func newUUID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80

	return fmt.Sprintf(
		"%x-%x-%x-%x-%x",
		bytes[0:4],
		bytes[4:6],
		bytes[6:8],
		bytes[8:10],
		bytes[10:16],
	), nil
}
