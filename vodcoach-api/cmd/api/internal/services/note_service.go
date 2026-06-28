package services

import (
	"context"
	"errors"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

var ErrVodAccessDenied = errors.New("vod access denied")

type NoteService struct {
	noteRepository *repository.NoteRepository
	vodRepository  *repository.VodRepository
}

func NewNoteService(noteRepository *repository.NoteRepository, vodRepository *repository.VodRepository) *NoteService {
	return &NoteService{
		noteRepository,
		vodRepository,
	}
}

func (s *NoteService) GetNotes(ctx context.Context, vodID string, userID string) ([]repository.Note, error) {
	if err := s.requireVodOwner(ctx, vodID, userID); err != nil {
		return nil, err
	}

	return s.noteRepository.GetNotesByVodID(ctx, vodID)
}

func (s *NoteService) CreateNote(ctx context.Context, params repository.CreateNoteParams) (*repository.Note, error) {
	if err := s.requireVodOwner(ctx, params.VodID, params.UserID); err != nil {
		return nil, err
	}

	return s.noteRepository.CreateNote(ctx, params)
}

func (s *NoteService) requireVodOwner(ctx context.Context, vodID string, userID string) error {
	ownsVod, err := s.vodRepository.UserOwnsVod(ctx, vodID, userID)
	if err != nil {
		return err
	}
	if !ownsVod {
		return ErrVodAccessDenied
	}

	return nil
}
