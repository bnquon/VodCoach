package services

import (
	"context"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

type NoteService struct {
	noteRepository *repository.NoteRepository
}

func NewNoteService(noteRepository *repository.NoteRepository) *NoteService {
	return &NoteService{
		noteRepository,
	}
}

func (s *NoteService) GetNotes(ctx context.Context, vodID string) ([]repository.Note, error) {
	generalNotes, err := s.GetGeneralNotes(ctx, vodID)
	if err != nil {
		return nil, err
	}

	timestampNotes, err := s.GetTimestampNotes(ctx, vodID)
	if err != nil {
		return nil, err
	}

	return append(generalNotes, timestampNotes...), nil
}

func (s *NoteService) GetGeneralNotes(ctx context.Context, vodID string) ([]repository.Note, error) {
	return s.noteRepository.GetGeneralNotesByVodID(ctx, vodID)
}

func (s *NoteService) GetTimestampNotes(ctx context.Context, vodID string) ([]repository.Note, error) {
	return s.noteRepository.GetTimestampNotesByVodID(ctx, vodID)
}
