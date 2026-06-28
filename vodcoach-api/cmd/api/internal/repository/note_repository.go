package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type NoteRepository struct {
	pool *pgxpool.Pool
}

type Note struct {
	ID               string
	VodID            string
	UserID           string
	NoteKind         string
	TimestampSeconds *int
	NoteText         string
	Tags             []string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type CreateNoteParams struct {
	VodID            string
	UserID           string
	NoteKind         string
	TimestampSeconds *int
	NoteText         string
	Tags             []string
}

func NewNoteRepository(pool *pgxpool.Pool) *NoteRepository {
	return &NoteRepository{
		pool,
	}
}

func (r *NoteRepository) GetNotesByVodID(ctx context.Context, vodID string) ([]Note, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, user_id, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		FROM notes
		WHERE vod_id = $1
		ORDER BY
			CASE note_kind
				WHEN 'general' THEN 0
				WHEN 'timestamped' THEN 1
			END ASC,
			CASE WHEN note_kind = 'general' THEN created_at END ASC,
			CASE WHEN note_kind = 'timestamped' THEN timestamp_seconds END ASC,
			created_at ASC
		`,
		vodID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notes := []Note{}
	for rows.Next() {
		var note Note

		err := rows.Scan(
			&note.ID,
			&note.VodID,
			&note.UserID,
			&note.NoteKind,
			&note.TimestampSeconds,
			&note.NoteText,
			&note.Tags,
			&note.CreatedAt,
			&note.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		notes = append(notes, note)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notes, nil
}

func (r *NoteRepository) CreateNote(ctx context.Context, params CreateNoteParams) (*Note, error) {
	var note Note

	err := r.pool.QueryRow(
		ctx,
		`INSERT INTO notes (vod_id, user_id, note_kind, timestamp_seconds, note_text, tags)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, vod_id, user_id, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		`,
		params.VodID,
		params.UserID,
		params.NoteKind,
		params.TimestampSeconds,
		params.NoteText,
		params.Tags,
	).Scan(
		&note.ID,
		&note.VodID,
		&note.UserID,
		&note.NoteKind,
		&note.TimestampSeconds,
		&note.NoteText,
		&note.Tags,
		&note.CreatedAt,
		&note.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &note, nil
}
