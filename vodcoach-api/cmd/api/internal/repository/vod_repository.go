package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type VodRepository struct {
	pool *pgxpool.Pool
}

type Vod struct {
	ID                  string
	UserID              string
	Title               string
	Game                string
	OriginalStorageKey  string
	PreviewStorageKey   *string
	ThumbnailStorageKey *string
	OriginalFilename    *string
	ContentType         *string
	DurationSeconds     *int
	Width               *int
	Height              *int
	Status              string
	ProcessingProgress  int
	ErrorMessage        *string
	CreatedAt           time.Time
	UpdatedAt           time.Time
}

type CreateVodParams struct {
	ID                  string
	UserID              string
	Title               string
	Game                string
	OriginalStorageKey  string
	ThumbnailStorageKey string
	OriginalFilename    string
	ContentType         string
}

type CompleteVodProcessingParams struct {
	VodID           string
	DurationSeconds int
	Width           int
	Height          int
}

func NewVodRepository(pool *pgxpool.Pool) *VodRepository {
	return &VodRepository{
		pool,
	}
}

func (r *VodRepository) Create(ctx context.Context, createVod CreateVodParams) (*Vod, error) {
	var vod Vod

	err := r.pool.QueryRow(
		ctx,
		`INSERT INTO vods (id, user_id, title, game, original_storage_key, thumbnail_storage_key, original_filename, content_type)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, user_id, title, game, original_storage_key, preview_storage_key, thumbnail_storage_key,
			original_filename, content_type, duration_seconds, width, height, status, processing_progress,
			error_message, created_at, updated_at
		`,
		createVod.ID,
		createVod.UserID,
		createVod.Title,
		createVod.Game,
		createVod.OriginalStorageKey,
		createVod.ThumbnailStorageKey,
		createVod.OriginalFilename,
		createVod.ContentType,
	).Scan(
		&vod.ID,
		&vod.UserID,
		&vod.Title,
		&vod.Game,
		&vod.OriginalStorageKey,
		&vod.PreviewStorageKey,
		&vod.ThumbnailStorageKey,
		&vod.OriginalFilename,
		&vod.ContentType,
		&vod.DurationSeconds,
		&vod.Width,
		&vod.Height,
		&vod.Status,
		&vod.ProcessingProgress,
		&vod.ErrorMessage,
		&vod.CreatedAt,
		&vod.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &vod, nil
}

func (r *VodRepository) GetByUserID(ctx context.Context, userID string) ([]Vod, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, user_id, title, game, original_storage_key, preview_storage_key, thumbnail_storage_key,
			original_filename, content_type, duration_seconds, width, height, status, processing_progress,
			error_message, created_at, updated_at
		FROM vods
		WHERE user_id = $1
		ORDER BY updated_at DESC
		`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	vods := make([]Vod, 0)
	for rows.Next() {
		var vod Vod

		if err := rows.Scan(
			&vod.ID,
			&vod.UserID,
			&vod.Title,
			&vod.Game,
			&vod.OriginalStorageKey,
			&vod.PreviewStorageKey,
			&vod.ThumbnailStorageKey,
			&vod.OriginalFilename,
			&vod.ContentType,
			&vod.DurationSeconds,
			&vod.Width,
			&vod.Height,
			&vod.Status,
			&vod.ProcessingProgress,
			&vod.ErrorMessage,
			&vod.CreatedAt,
			&vod.UpdatedAt,
		); err != nil {
			return nil, err
		}

		vods = append(vods, vod)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return vods, nil
}

func (r *VodRepository) GetByIDAndUserID(ctx context.Context, vodID string, userID string) (*Vod, error) {
	var vod Vod

	err := r.pool.QueryRow(
		ctx,
		`SELECT id, user_id, title, game, original_storage_key, preview_storage_key, thumbnail_storage_key,
			original_filename, content_type, duration_seconds, width, height, status, processing_progress,
			error_message, created_at, updated_at
		FROM vods
		WHERE id = $1
			AND user_id = $2
		`,
		vodID,
		userID,
	).Scan(
		&vod.ID,
		&vod.UserID,
		&vod.Title,
		&vod.Game,
		&vod.OriginalStorageKey,
		&vod.PreviewStorageKey,
		&vod.ThumbnailStorageKey,
		&vod.OriginalFilename,
		&vod.ContentType,
		&vod.DurationSeconds,
		&vod.Width,
		&vod.Height,
		&vod.Status,
		&vod.ProcessingProgress,
		&vod.ErrorMessage,
		&vod.CreatedAt,
		&vod.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &vod, nil
}

func (r *VodRepository) MarkUploadComplete(ctx context.Context, vodID string, userID string) (*Vod, error) {
	var vod Vod

	err := r.pool.QueryRow(
		ctx,
		`UPDATE vods
		SET status = 'uploaded',
			processing_progress = 100,
			updated_at = now()
		WHERE id = $1
			AND user_id = $2
		RETURNING id, user_id, title, game, original_storage_key, preview_storage_key, thumbnail_storage_key,
			original_filename, content_type, duration_seconds, width, height, status, processing_progress,
			error_message, created_at, updated_at
		`,
		vodID,
		userID,
	).Scan(
		&vod.ID,
		&vod.UserID,
		&vod.Title,
		&vod.Game,
		&vod.OriginalStorageKey,
		&vod.PreviewStorageKey,
		&vod.ThumbnailStorageKey,
		&vod.OriginalFilename,
		&vod.ContentType,
		&vod.DurationSeconds,
		&vod.Width,
		&vod.Height,
		&vod.Status,
		&vod.ProcessingProgress,
		&vod.ErrorMessage,
		&vod.CreatedAt,
		&vod.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &vod, nil
}

func (r *VodRepository) UpdateStatus(ctx context.Context, vodID string, status string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE vods
		SET status = $2,
			updated_at = now()
		WHERE id = $1`,
		vodID,
		status,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *VodRepository) CompleteProcessing(ctx context.Context, params CompleteVodProcessingParams) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE vods
		SET status = 'ready',
			duration_seconds = $2,
			width = $3,
			height = $4,
			processing_progress = 100,
			error_message = NULL,
			updated_at = now()
		WHERE id = $1`,
		params.VodID,
		params.DurationSeconds,
		params.Width,
		params.Height,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *VodRepository) UserOwnsVod(ctx context.Context, vodID string, userID string) (bool, error) {
	var ownsVod bool

	err := r.pool.QueryRow(
		ctx,
		`SELECT EXISTS (
			SELECT 1
			FROM vods
			WHERE id = $1
				AND user_id = $2
		)`,
		vodID,
		userID,
	).Scan(&ownsVod)
	if err != nil {
		return false, err
	}

	return ownsVod, nil
}
