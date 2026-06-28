package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UsersRepository struct {
	pool *pgxpool.Pool
}

type User struct {
	ID           string
	Email        string
	PasswordHash string
}

func NewUsersRepository(pool *pgxpool.Pool) *UsersRepository {
	return &UsersRepository{pool: pool}
}

func (r *UsersRepository) CreateUser(ctx context.Context, email string, hashedPassword string) (string, error) {
	var id string

	err := r.pool.QueryRow(
		ctx,
		`
		INSERT INTO users (email, password_hash)
		VALUES ($1, $2)
		RETURNING id
		`,
		email,
		hashedPassword,
	).Scan(&id)

	if err != nil {
		return "", err
	}

	return id, nil
}

func (r *UsersRepository) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User

	err := r.pool.QueryRow(
		ctx,
		`
		SELECT id, email, password_hash
		FROM users
		WHERE email = $1
		`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
