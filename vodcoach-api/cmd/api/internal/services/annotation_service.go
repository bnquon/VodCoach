package services

import (
	"context"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
)

type AnnotationService struct {
	noteRepository    *repository.NoteRepository
	drawingRepository *repository.DrawingRepository
}

type Annotations struct {
	Notes    []repository.Note
	Drawings []repository.Drawing
}

func NewAnnotationService(noteRepository *repository.NoteRepository, drawingRepository *repository.DrawingRepository) *AnnotationService {
	return &AnnotationService{
		noteRepository:    noteRepository,
		drawingRepository: drawingRepository,
	}
}

func (s *AnnotationService) GetAnnotations(ctx context.Context, vodID string) (*Annotations, error) {
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
