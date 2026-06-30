package services

import (
	"context"
	"errors"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

var ErrVodAccessDenied = errors.New("vod access denied")
var ErrNoteNotFound = errors.New("note not found")

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
	if params.UserID == nil {
		return nil, ErrVodAccessDenied
	}
	if err := s.requireVodOwner(ctx, params.VodID, *params.UserID); err != nil {
		return nil, err
	}

	return s.noteRepository.CreateNote(ctx, params)
}

func (s *NoteService) UpdateNote(ctx context.Context, userID string, params repository.UpdateNoteParams) (*repository.Note, error) {
	if err := s.requireVodOwner(ctx, params.VodID, userID); err != nil {
		return nil, err
	}

	note, err := s.noteRepository.UpdateNote(ctx, params)
	if err != nil {
		if repository.IsNoteNotFound(err) {
			return nil, ErrNoteNotFound
		}

		return nil, err
	}

	return note, nil
}

func (s *NoteService) DeleteNote(ctx context.Context, vodID string, noteID string, userID string) error {
	if err := s.requireVodOwner(ctx, vodID, userID); err != nil {
		return err
	}

	deleted, err := s.noteRepository.DeleteNote(ctx, vodID, noteID)
	if err != nil {
		return err
	}
	if !deleted {
		return ErrNoteNotFound
	}

	return nil
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
