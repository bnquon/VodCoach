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
	UserID           string
	TimestampSeconds int
	DrawingJSON      []byte
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

func NewDrawingRepository(pool *pgxpool.Pool) *DrawingRepository {
	return &DrawingRepository{
		pool,
	}
}

func (r *DrawingRepository) GetDrawingsByVodID(ctx context.Context, vodID string) ([]Drawing, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, user_id, timestamp_seconds, drawing_json, created_at, updated_at
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
			&drawing.TimestampSeconds,
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
