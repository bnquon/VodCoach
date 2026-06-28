package notes

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
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
	DurationSeconds  int             `json:"duration_seconds"`
	Color            string          `json:"color"`
	DrawingJSON      json.RawMessage `json:"drawing_json"`
}

type AnnotationsResponse struct {
	Notes    []NoteResponse    `json:"notes"`
	Drawings []DrawingResponse `json:"drawings"`
}

type CreateDrawingRequestBody struct {
	TimestampSeconds *int            `json:"timestamp_seconds" binding:"required,min=0"`
	DurationSeconds  *int            `json:"duration_seconds" binding:"required,min=1"`
	Color            string          `json:"color" binding:"required,hexcolor"`
	DrawingJSON      json.RawMessage `json:"drawing_json" binding:"required"`
}

func NewAnnotationHandler(annotationService *services.AnnotationService) *AnnotationHandler {
	return &AnnotationHandler{
		annotationService: annotationService,
	}
}

func (h *AnnotationHandler) GetAnnotations(c *gin.Context) {
	vodID := c.Param("vodID")
	userID := c.GetString(auth.UserIDContextKey)

	annotations, err := h.annotationService.GetAnnotations(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get annotations"})
		return
	}

	c.JSON(http.StatusOK, AnnotationsResponse{
		Notes:    toNoteResponses(annotations.Notes),
		Drawings: toDrawingResponses(annotations.Drawings),
	})
}

func (h *AnnotationHandler) CreateAnnotation(c *gin.Context) {
	vodID := c.Param("vodID")
	userID := c.GetString(auth.UserIDContextKey)

	var body CreateDrawingRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid annotation request body"})
		return
	}
	if !isJSONArray(body.DrawingJSON) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "drawing_json must be an array"})
		return
	}

	drawing, err := h.annotationService.CreateDrawing(c.Request.Context(), repository.CreateDrawingParams{
		VodID:            vodID,
		UserID:           userID,
		TimestampSeconds: *body.TimestampSeconds,
		DurationSeconds:  *body.DurationSeconds,
		Color:            body.Color,
		DrawingJSON:      body.DrawingJSON,
	})
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create annotation"})
		return
	}

	c.JSON(http.StatusCreated, toDrawingResponse(*drawing))
}

func toDrawingResponse(drawing repository.Drawing) DrawingResponse {
	return DrawingResponse{
		ID:               drawing.ID,
		VodID:            drawing.VodID,
		TimestampSeconds: drawing.TimestampSeconds,
		DurationSeconds:  drawing.DurationSeconds,
		Color:            drawing.Color,
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

func isJSONArray(rawMessage json.RawMessage) bool {
	var value []json.RawMessage
	return json.Unmarshal(rawMessage, &value) == nil
}
