package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NoteRepository struct {
	pool *pgxpool.Pool
}

type Note struct {
	ID               string
	VodID            string
	UserID           *string
	GuestName        *string
	NoteKind         string
	TimestampSeconds *int
	NoteText         string
	Tags             []string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type CreateNoteParams struct {
	VodID            string
	UserID           *string
	GuestName        *string
	NoteKind         string
	TimestampSeconds *int
	NoteText         string
	Tags             []string
}

type UpdateNoteParams struct {
	ID               string
	VodID            string
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
		`SELECT id, vod_id, user_id, guest_name, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
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
			&note.GuestName,
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
		`INSERT INTO notes (vod_id, user_id, guest_name, note_kind, timestamp_seconds, note_text, tags)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, vod_id, user_id, guest_name, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		`,
		params.VodID,
		params.UserID,
		params.GuestName,
		params.NoteKind,
		params.TimestampSeconds,
		params.NoteText,
		params.Tags,
	).Scan(
		&note.ID,
		&note.VodID,
		&note.UserID,
		&note.GuestName,
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

func (r *NoteRepository) UpdateNote(ctx context.Context, params UpdateNoteParams) (*Note, error) {
	var note Note

	err := r.pool.QueryRow(
		ctx,
		`UPDATE notes
		SET timestamp_seconds = $3, note_text = $4, tags = $5, updated_at = NOW()
		WHERE id = $1 AND vod_id = $2
		RETURNING id, vod_id, user_id, guest_name, note_kind, timestamp_seconds, note_text, tags, created_at, updated_at
		`,
		params.ID,
		params.VodID,
		params.TimestampSeconds,
		params.NoteText,
		params.Tags,
	).Scan(
		&note.ID,
		&note.VodID,
		&note.UserID,
		&note.GuestName,
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

func (r *NoteRepository) DeleteNote(ctx context.Context, vodID string, noteID string) (bool, error) {
	commandTag, err := r.pool.Exec(
		ctx,
		`DELETE FROM notes
		WHERE id = $1 AND vod_id = $2
		`,
		noteID,
		vodID,
	)
	if err != nil {
		return false, err
	}

	return commandTag.RowsAffected() > 0, nil
}

func IsNoteNotFound(err error) bool {
	return err == pgx.ErrNoRows
}
