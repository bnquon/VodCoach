package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type VodRepository struct {
	pool *pgxpool.Pool
}

func NewVodRepository(pool *pgxpool.Pool) *VodRepository {
	return &VodRepository{
		pool,
	}
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
