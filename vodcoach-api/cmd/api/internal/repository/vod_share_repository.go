package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type VodShareRepository struct {
	pool *pgxpool.Pool
}

type VodShare struct {
	ID          string
	VodID       string
	OwnerUserID string
	TokenHash   string
	Permission  string
	RevokedAt   *time.Time
	ExpiresAt   *time.Time
	CreatedAt   time.Time
}

type CreateVodShareParams struct {
	VodID       string
	OwnerUserID string
	TokenHash   string
	Permission  string
}

func NewVodShareRepository(pool *pgxpool.Pool) *VodShareRepository {
	return &VodShareRepository{
		pool: pool,
	}
}

func (r *VodShareRepository) Create(ctx context.Context, params CreateVodShareParams) (*VodShare, error) {
	var share VodShare

	err := r.pool.QueryRow(
		ctx,
		`INSERT INTO vod_shares (vod_id, owner_user_id, token_hash, permission)
		VALUES ($1, $2, $3, $4)
		RETURNING id, vod_id, owner_user_id, token_hash, permission, revoked_at, expires_at, created_at`,
		params.VodID,
		params.OwnerUserID,
		params.TokenHash,
		params.Permission,
	).Scan(
		&share.ID,
		&share.VodID,
		&share.OwnerUserID,
		&share.TokenHash,
		&share.Permission,
		&share.RevokedAt,
		&share.ExpiresAt,
		&share.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &share, nil
}

func (r *VodShareRepository) RevokeActiveByVodOwnerAndPermission(ctx context.Context, vodID string, ownerUserID string, permission string) error {
	_, err := r.pool.Exec(
		ctx,
		`UPDATE vod_shares
		SET revoked_at = now()
		WHERE vod_id = $1
			AND owner_user_id = $2
			AND permission = $3
			AND revoked_at IS NULL`,
		vodID,
		ownerUserID,
		permission,
	)
	return err
}

func (r *VodShareRepository) GetActiveByTokenHash(ctx context.Context, tokenHash string) (*VodShare, error) {
	var share VodShare

	err := r.pool.QueryRow(
		ctx,
		`SELECT id, vod_id, owner_user_id, token_hash, permission, revoked_at, expires_at, created_at
		FROM vod_shares
		WHERE token_hash = $1
			AND revoked_at IS NULL
			AND (expires_at IS NULL OR expires_at > now())`,
		tokenHash,
	).Scan(
		&share.ID,
		&share.VodID,
		&share.OwnerUserID,
		&share.TokenHash,
		&share.Permission,
		&share.RevokedAt,
		&share.ExpiresAt,
		&share.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &share, nil
}

func (r *VodShareRepository) GetActiveByID(ctx context.Context, shareID string) (*VodShare, error) {
	var share VodShare

	err := r.pool.QueryRow(
		ctx,
		`SELECT id, vod_id, owner_user_id, token_hash, permission, revoked_at, expires_at, created_at
		FROM vod_shares
		WHERE id = $1
			AND revoked_at IS NULL
			AND (expires_at IS NULL OR expires_at > now())`,
		shareID,
	).Scan(
		&share.ID,
		&share.VodID,
		&share.OwnerUserID,
		&share.TokenHash,
		&share.Permission,
		&share.RevokedAt,
		&share.ExpiresAt,
		&share.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &share, nil
}

func (r *VodShareRepository) GetByVodIDAndOwnerUserID(ctx context.Context, vodID string, ownerUserID string) ([]VodShare, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, owner_user_id, token_hash, permission, revoked_at, expires_at, created_at
		FROM vod_shares
		WHERE vod_id = $1
			AND owner_user_id = $2
			AND revoked_at IS NULL
		ORDER BY created_at DESC`,
		vodID,
		ownerUserID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	shares := []VodShare{}
	for rows.Next() {
		var share VodShare

		if err := rows.Scan(
			&share.ID,
			&share.VodID,
			&share.OwnerUserID,
			&share.TokenHash,
			&share.Permission,
			&share.RevokedAt,
			&share.ExpiresAt,
			&share.CreatedAt,
		); err != nil {
			return nil, err
		}

		shares = append(shares, share)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return shares, nil
}

func (r *VodShareRepository) Revoke(ctx context.Context, shareID string, ownerUserID string) (bool, error) {
	result, err := r.pool.Exec(
		ctx,
		`UPDATE vod_shares
		SET revoked_at = now()
		WHERE id = $1
			AND owner_user_id = $2
			AND revoked_at IS NULL`,
		shareID,
		ownerUserID,
	)
	if err != nil {
		return false, err
	}

	return result.RowsAffected() > 0, nil
}

func IsVodShareNotFound(err error) bool {
	return err == pgx.ErrNoRows
}
