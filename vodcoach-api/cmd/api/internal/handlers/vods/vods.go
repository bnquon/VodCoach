package vods

import (
	"errors"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type VodHandler struct {
	vodService *services.VodService
}

type CreateVodUploadRequestBody struct {
	Title         string `json:"title" binding:"required"`
	Game          string `json:"game" binding:"required"`
	FileName      string `json:"file_name" binding:"required"`
	ContentType   string `json:"content_type" binding:"required"`
	FileSizeBytes int64  `json:"file_size_bytes" binding:"required,min=1"`
}

type VodResponse struct {
	ID                  string  `json:"id"`
	Title               string  `json:"title"`
	Game                string  `json:"game"`
	OriginalStorageKey  string  `json:"original_storage_key"`
	ThumbnailStorageKey *string `json:"thumbnail_storage_key"`
	OriginalFilename    *string `json:"original_filename"`
	ContentType         *string `json:"content_type"`
	DurationSeconds     *int    `json:"duration_seconds"`
	Width               *int    `json:"width"`
	Height              *int    `json:"height"`
	Status              string  `json:"status"`
	ProcessingProgress  int     `json:"processing_progress"`
	ErrorMessage        *string `json:"error_message"`
}

type CreateVodUploadResponse struct {
	Vod                 VodResponse `json:"vod"`
	UploadURL 					string 			`json:"upload_url"`
	OriginalStorageKey  string      `json:"original_storage_key"`
	ThumbnailStorageKey string      `json:"thumbnail_storage_key"`
}

func NewVodHandler(vodService *services.VodService) *VodHandler {
	return &VodHandler{
		vodService: vodService,
	}
}

func (h *VodHandler) CreateUpload(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)

	var body CreateVodUploadRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid VOD upload request body"})
		return
	}

	result, err := h.vodService.CreateVodUpload(c.Request.Context(), services.CreateVodUploadParams{
		UserID:        userID,
		Title:         body.Title,
		Game:          body.Game,
		FileName:      body.FileName,
		ContentType:   body.ContentType,
		FileSizeBytes: body.FileSizeBytes,
	})
	if err != nil {
		if errors.Is(err, services.ErrInvalidVodUploadContentType) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Only MP4 uploads are supported"})
			return
		}
		if errors.Is(err, services.ErrVodUploadTooLarge) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VOD upload is too large"})
			return
		}
		if errors.Is(err, services.ErrInvalidVodUploadMetadata) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid VOD upload metadata"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create VOD upload"})
		return
	}

	c.JSON(http.StatusCreated, CreateVodUploadResponse{
		Vod:                 toVodResponse(*result.Vod),
		UploadURL: 					 result.UploadURL,
		OriginalStorageKey:  result.OriginalStorageKey,
		ThumbnailStorageKey: result.ThumbnailStorageKey,
	})
}

func toVodResponse(vod repository.Vod) VodResponse {
	return VodResponse{
		ID:                  vod.ID,
		Title:               vod.Title,
		Game:                vod.Game,
		OriginalStorageKey:  vod.OriginalStorageKey,
		ThumbnailStorageKey: vod.ThumbnailStorageKey,
		OriginalFilename:    vod.OriginalFilename,
		ContentType:         vod.ContentType,
		DurationSeconds:     vod.DurationSeconds,
		Width:               vod.Width,
		Height:              vod.Height,
		Status:              vod.Status,
		ProcessingProgress:  vod.ProcessingProgress,
		ErrorMessage:        vod.ErrorMessage,
	}
}
