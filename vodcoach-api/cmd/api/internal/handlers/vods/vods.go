package vods

import (
	"errors"
	"net/http"
	"time"

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

type UpdateVodMetadataRequestBody struct {
	Title *string `json:"title"`
	Game  *string `json:"game"`
}

type VodResponse struct {
	ID                  string    `json:"id"`
	Title               string    `json:"title"`
	Game                string    `json:"game"`
	OriginalStorageKey  string    `json:"original_storage_key"`
	ThumbnailStorageKey *string   `json:"thumbnail_storage_key"`
	OriginalFilename    *string   `json:"original_filename"`
	ContentType         *string   `json:"content_type"`
	DurationSeconds     *int      `json:"duration_seconds"`
	Width               *int      `json:"width"`
	Height              *int      `json:"height"`
	Status              string    `json:"status"`
	ProcessingProgress  int       `json:"processing_progress"`
	ErrorMessage        *string   `json:"error_message"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type CreateVodUploadResponse struct {
	Vod                 VodResponse `json:"vod"`
	UploadURL           string      `json:"upload_url"`
	OriginalStorageKey  string      `json:"original_storage_key"`
	ThumbnailStorageKey string      `json:"thumbnail_storage_key"`
}

type VodPlaybackURLResponse struct {
	PlaybackURL string `json:"playback_url"`
}

func NewVodHandler(vodService *services.VodService) *VodHandler {
	return &VodHandler{
		vodService: vodService,
	}
}

func (h *VodHandler) GetVods(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)

	vods, err := h.vodService.GetVods(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get VODs"})
		return
	}

	response := make([]VodResponse, 0, len(vods))
	for _, vod := range vods {
		response = append(response, h.toVodResponse(vod))
	}

	c.JSON(http.StatusOK, response)
}

func (h *VodHandler) GetVod(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	vod, err := h.vodService.GetVod(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusNotFound, gin.H{"error": "VOD not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get VOD"})
		return
	}

	c.JSON(http.StatusOK, h.toVodResponse(*vod))
}

func (h *VodHandler) UpdateVod(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	var body UpdateVodMetadataRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid VOD update request body"})
		return
	}

	vod, err := h.vodService.UpdateVodMetadata(c.Request.Context(), vodID, services.UpdateVodMetadataParams{
		UserID: userID,
		Title:  body.Title,
		Game:   body.Game,
	})
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusNotFound, gin.H{"error": "VOD not found"})
			return
		}
		if errors.Is(err, services.ErrInvalidVodMetadataUpdate) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid VOD metadata"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update VOD"})
		return
	}

	c.JSON(http.StatusOK, h.toVodResponse(*vod))
}

func (h *VodHandler) CreateVodPlaybackURL(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	playbackURL, err := h.vodService.CreateVodPlaybackURL(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusNotFound, gin.H{"error": "VOD not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get presigned playback VOD URL"})
		return
	}

	c.JSON(http.StatusOK, VodPlaybackURLResponse{
		PlaybackURL: playbackURL,
	})
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
		Vod:                 h.toVodResponse(*result.Vod),
		UploadURL:           result.UploadURL,
		OriginalStorageKey:  result.OriginalStorageKey,
		ThumbnailStorageKey: result.ThumbnailStorageKey,
	})
}

func (h *VodHandler) CompleteUpload(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	vod, err := h.vodService.CompleteVodUpload(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusNotFound, gin.H{"error": "VOD not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete VOD upload"})
		return
	}

	c.JSON(http.StatusOK, h.toVodResponse(*vod))
}

func (h *VodHandler) DeleteVod(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	err := h.vodService.DeleteVod(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusNotFound, gin.H{"error": "VOD not found"})
			return
		}
		if errors.Is(err, services.ErrVodNotDeletable) {
			c.JSON(http.StatusConflict, gin.H{"error": "VOD cannot be deleted while it is processing"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete VOD"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *VodHandler) toVodResponse(vod repository.Vod) VodResponse {
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
		UpdatedAt:           vod.UpdatedAt,
	}
}
