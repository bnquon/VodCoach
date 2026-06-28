package notes

import (
	"encoding/json"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type AnnotationHandler struct {
	annotationService *services.AnnotationService
}

type DrawingResponse struct {
	ID               string          `json:"id"`
	VodID            string          `json:"vod_id"`
	TimestampSeconds int             `json:"timestamp_seconds"`
	DrawingJSON      json.RawMessage `json:"drawing_json"`
}

type AnnotationsResponse struct {
	Notes    []NoteResponse    `json:"notes"`
	Drawings []DrawingResponse `json:"drawings"`
}

func NewAnnotationHandler(annotationService *services.AnnotationService) *AnnotationHandler {
	return &AnnotationHandler{
		annotationService: annotationService,
	}
}

func (h *AnnotationHandler) GetAnnotations(c *gin.Context) {
	vodID := c.Param("vodID")

	annotations, err := h.annotationService.GetAnnotations(c.Request.Context(), vodID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get annotations"})
		return
	}

	c.JSON(http.StatusOK, AnnotationsResponse{
		Notes:    toNoteResponses(annotations.Notes),
		Drawings: toDrawingResponses(annotations.Drawings),
	})
}

func toDrawingResponse(drawing repository.Drawing) DrawingResponse {
	return DrawingResponse{
		ID:               drawing.ID,
		VodID:            drawing.VodID,
		TimestampSeconds: drawing.TimestampSeconds,
		DrawingJSON:      json.RawMessage(drawing.DrawingJSON),
	}
}

func toDrawingResponses(drawings []repository.Drawing) []DrawingResponse {
	responses := make([]DrawingResponse, 0, len(drawings))

	for _, drawing := range drawings {
		responses = append(responses, toDrawingResponse(drawing))
	}

	return responses
}
