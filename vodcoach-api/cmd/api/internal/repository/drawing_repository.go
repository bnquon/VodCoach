package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type DrawingRepository struct {
	pool *pgxpool.Pool
}

type Drawing struct {
	ID               string
	VodID            string
	UserID           *string
	GuestName        *string
	TimestampSeconds int
	DurationSeconds  int
	Color            string
	DrawingJSON      []byte
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type CreateDrawingParams struct {
	VodID            string
	UserID           *string
	GuestName        *string
	TimestampSeconds int
	DurationSeconds  int
	Color            string
	DrawingJSON      []byte
}

func NewDrawingRepository(pool *pgxpool.Pool) *DrawingRepository {
	return &DrawingRepository{
		pool,
	}
}

func (r *DrawingRepository) GetDrawingsByVodID(ctx context.Context, vodID string) ([]Drawing, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, user_id, guest_name, timestamp_seconds, duration_seconds, color, drawing_json, created_at, updated_at
		FROM drawings
		WHERE vod_id = $1
		ORDER BY timestamp_seconds ASC, created_at ASC
		`,
		vodID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	drawings := []Drawing{}
	for rows.Next() {
		var drawing Drawing

		err := rows.Scan(
			&drawing.ID,
			&drawing.VodID,
			&drawing.UserID,
			&drawing.GuestName,
			&drawing.TimestampSeconds,
			&drawing.DurationSeconds,
			&drawing.Color,
			&drawing.DrawingJSON,
			&drawing.CreatedAt,
			&drawing.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		drawings = append(drawings, drawing)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return drawings, nil
}

func (r *DrawingRepository) CreateDrawing(ctx context.Context, params CreateDrawingParams) (*Drawing, error) {
	var drawing Drawing

	err := r.pool.QueryRow(
		ctx,
		`INSERT INTO drawings (vod_id, user_id, guest_name, timestamp_seconds, duration_seconds, color, drawing_json)
		VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
		RETURNING id, vod_id, user_id, guest_name, timestamp_seconds, duration_seconds, color, drawing_json, created_at, updated_at
		`,
		params.VodID,
		params.UserID,
		params.GuestName,
		params.TimestampSeconds,
		params.DurationSeconds,
		params.Color,
		string(params.DrawingJSON),
	).Scan(
		&drawing.ID,
		&drawing.VodID,
		&drawing.UserID,
		&drawing.GuestName,
		&drawing.TimestampSeconds,
		&drawing.DurationSeconds,
		&drawing.Color,
		&drawing.DrawingJSON,
		&drawing.CreatedAt,
		&drawing.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &drawing, nil
}

func (r *DrawingRepository) CreateDrawings(ctx context.Context, params []CreateDrawingParams) ([]Drawing, error) {
	if len(params) == 0 {
		return []Drawing{}, nil
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	drawings := make([]Drawing, 0, len(params))
	for _, drawingParams := range params {
		var drawing Drawing

		err := tx.QueryRow(
			ctx,
			`INSERT INTO drawings (vod_id, user_id, guest_name, timestamp_seconds, duration_seconds, color, drawing_json)
			VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
			RETURNING id, vod_id, user_id, guest_name, timestamp_seconds, duration_seconds, color, drawing_json, created_at, updated_at
			`,
			drawingParams.VodID,
			drawingParams.UserID,
			drawingParams.GuestName,
			drawingParams.TimestampSeconds,
			drawingParams.DurationSeconds,
			drawingParams.Color,
			string(drawingParams.DrawingJSON),
		).Scan(
			&drawing.ID,
			&drawing.VodID,
			&drawing.UserID,
			&drawing.GuestName,
			&drawing.TimestampSeconds,
			&drawing.DurationSeconds,
			&drawing.Color,
			&drawing.DrawingJSON,
			&drawing.CreatedAt,
			&drawing.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		drawings = append(drawings, drawing)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return drawings, nil
}
