package services

import (
	"context"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

type AnnotationService struct {
	noteRepository    *repository.NoteRepository
	drawingRepository *repository.DrawingRepository
	vodRepository     *repository.VodRepository
}

type Annotations struct {
	Notes    []repository.Note
	Drawings []repository.Drawing
}

func NewAnnotationService(noteRepository *repository.NoteRepository, drawingRepository *repository.DrawingRepository, vodRepository *repository.VodRepository) *AnnotationService {
	return &AnnotationService{
		noteRepository:    noteRepository,
		drawingRepository: drawingRepository,
		vodRepository:     vodRepository,
	}
}

func (s *AnnotationService) GetAnnotations(ctx context.Context, vodID string, userID string) (*Annotations, error) {
	if err := s.requireVodOwner(ctx, vodID, userID); err != nil {
		return nil, err
	}

	notes, err := s.noteRepository.GetNotesByVodID(ctx, vodID)
	if err != nil {
		return nil, err
	}

	drawings, err := s.drawingRepository.GetDrawingsByVodID(ctx, vodID)
	if err != nil {
		return nil, err
	}

	return &Annotations{
		Notes:    notes,
		Drawings: drawings,
	}, nil
}

func (s *AnnotationService) CreateDrawing(ctx context.Context, params repository.CreateDrawingParams) (*repository.Drawing, error) {
	if err := s.requireVodOwner(ctx, params.VodID, params.UserID); err != nil {
		return nil, err
	}

	return s.drawingRepository.CreateDrawing(ctx, params)
}

func (s *AnnotationService) CreateDrawings(ctx context.Context, params []repository.CreateDrawingParams) ([]repository.Drawing, error) {
	if len(params) == 0 {
		return []repository.Drawing{}, nil
	}

	if err := s.requireVodOwner(ctx, params[0].VodID, params[0].UserID); err != nil {
		return nil, err
	}

	return s.drawingRepository.CreateDrawings(ctx, params)
}

func (s *AnnotationService) requireVodOwner(ctx context.Context, vodID string, userID string) error {
	ownsVod, err := s.vodRepository.UserOwnsVod(ctx, vodID, userID)
	if err != nil {
		return err
	}
	if !ownsVod {
		return ErrVodAccessDenied
	}

	return nil
}
