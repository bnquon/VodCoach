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

func NewNoteRepository(pool *pgxpool.Pool) *NoteRepository {
	return &NoteRepository{
		pool,
	}
}

func (r *NoteRepository) GetGeneralNotesByVodID(ctx context.Context, vodID string) ([]Note, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, user_id, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		FROM notes
		WHERE vod_id = $1
			AND note_kind = 'general'
		ORDER BY created_at ASC
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

func (r *NoteRepository) GetTimestampNotesByVodID(ctx context.Context, vodID string) ([]Note, error) {
	rows, err := r.pool.Query(
		ctx,
		`SELECT id, vod_id, user_id, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		FROM notes
		WHERE vod_id = $1
			AND note_kind = 'timestamped'
		ORDER BY timestamp_seconds ASC
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
