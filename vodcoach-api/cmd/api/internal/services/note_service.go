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
	return s.noteRepository.GetNotesByVodID(ctx, vodID)
}
