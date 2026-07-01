package shares

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type ShareHandler struct {
	shareService *services.ShareService
}

type CreateShareRequestBody struct {
	Permission string `json:"permission" binding:"required,oneof=view comment"`
}

type CreateShareSessionRequestBody struct {
	GuestName string `json:"guest_name" binding:"required"`
}

type CreateNoteRequestBody struct {
	NoteKind         string   `json:"note_kind" binding:"required,oneof=general timestamped"`
	TimestampSeconds *int     `json:"timestamp_seconds"`
	NoteText         string   `json:"note_text" binding:"required"`
	Tags             []string `json:"tags"`
}

type CreateDrawingRequestBody struct {
	TimestampSeconds *int            `json:"timestamp_seconds" binding:"required,min=0"`
	DurationSeconds  *int            `json:"duration_seconds" binding:"required,min=1"`
	Color            string          `json:"color" binding:"required,hexcolor"`
	DrawingJSON      json.RawMessage `json:"drawing_json" binding:"required"`
}

type CreateDrawingsRequestBody struct {
	Drawings []CreateDrawingRequestBody `json:"drawings" binding:"required,min=1,dive"`
}

type ShareResponse struct {
	ID         string     `json:"id"`
	VodID      string     `json:"vod_id"`
	Permission string     `json:"permission"`
	ExpiresAt  *time.Time `json:"expires_at"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateShareResponse struct {
	ShareResponse
	Token string `json:"token"`
}

type ShareSessionResponse struct {
	Token      string        `json:"token"`
	Share      ShareResponse `json:"share"`
	GuestName  string        `json:"guest_name"`
	Permission string        `json:"permission"`
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

type PlaybackURLResponse struct {
	PlaybackURL string `json:"playback_url"`
}

type NoteResponse struct {
	ID               string   `json:"id"`
	VodID            string   `json:"vod_id"`
	GuestName        *string  `json:"guest_name"`
	NoteKind         string   `json:"note_kind"`
	TimestampSeconds *int     `json:"timestamp_seconds"`
	NoteText         string   `json:"note_text"`
	Tags             []string `json:"tags"`
}

type DrawingResponse struct {
	ID               string          `json:"id"`
	VodID            string          `json:"vod_id"`
	GuestName        *string         `json:"guest_name"`
	TimestampSeconds int             `json:"timestamp_seconds"`
	DurationSeconds  int             `json:"duration_seconds"`
	Color            string          `json:"color"`
	DrawingJSON      json.RawMessage `json:"drawing_json"`
}

type AnnotationsResponse struct {
	Notes    []NoteResponse    `json:"notes"`
	Drawings []DrawingResponse `json:"drawings"`
}

func NewShareHandler(shareService *services.ShareService) *ShareHandler {
	return &ShareHandler{
		shareService: shareService,
	}
}

func (h *ShareHandler) CreateShare(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	var body CreateShareRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid share request body"})
		return
	}

	result, err := h.shareService.CreateShare(c.Request.Context(), vodID, userID, body.Permission)
	if err != nil {
		respondShareError(c, err)
		return
	}

	response := toShareResponse(*result.Share)
	c.JSON(http.StatusCreated, CreateShareResponse{
		ShareResponse: response,
		Token:         result.Token,
	})
}

func (h *ShareHandler) GetShares(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	vodID := c.Param("vodID")

	shares, err := h.shareService.GetShares(c.Request.Context(), vodID, userID)
	if err != nil {
		respondShareError(c, err)
		return
	}

	response := make([]ShareResponse, 0, len(shares))
	for _, share := range shares {
		response = append(response, toShareResponse(share))
	}

	c.JSON(http.StatusOK, response)
}

func (h *ShareHandler) RevokeShare(c *gin.Context) {
	userID := c.GetString(auth.UserIDContextKey)
	shareID := c.Param("shareID")

	if err := h.shareService.RevokeShare(c.Request.Context(), shareID, userID); err != nil {
		respondShareError(c, err)
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *ShareHandler) CreateShareSession(c *gin.Context) {
	shareToken := c.Param("shareToken")

	var body CreateShareSessionRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid share session request body"})
		return
	}

	result, err := h.shareService.CreateShareSession(c.Request.Context(), shareToken, body.GuestName)
	if err != nil {
		respondShareError(c, err)
		return
	}

	c.JSON(http.StatusOK, ShareSessionResponse{
		Token:      result.Token,
		Share:      toShareResponse(*result.Share),
		GuestName:  result.GuestName,
		Permission: result.Share.Permission,
	})
}

func (h *ShareHandler) GetSharedVod(c *gin.Context) {
	claims, ok := auth.GetShareClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing share session"})
		return
	}

	vod, err := h.shareService.GetSharedVod(c.Request.Context(), claims)
	if err != nil {
		respondShareError(c, err)
		return
	}

	c.JSON(http.StatusOK, toVodResponse(*vod))
}

func (h *ShareHandler) GetSharedPlaybackURL(c *gin.Context) {
	claims, ok := auth.GetShareClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing share session"})
		return
	}

	playbackURL, err := h.shareService.CreateSharedPlaybackURL(c.Request.Context(), claims)
	if err != nil {
		respondShareError(c, err)
		return
	}

	c.JSON(http.StatusOK, PlaybackURLResponse{PlaybackURL: playbackURL})
}

func (h *ShareHandler) GetSharedNotes(c *gin.Context) {
	annotations, ok := h.getSharedAnnotations(c)
	if !ok {
		return
	}

	c.JSON(http.StatusOK, toNoteResponses(annotations.Notes))
}

func (h *ShareHandler) GetSharedAnnotations(c *gin.Context) {
	annotations, ok := h.getSharedAnnotations(c)
	if !ok {
		return
	}

	c.JSON(http.StatusOK, AnnotationsResponse{
		Notes:    toNoteResponses(annotations.Notes),
		Drawings: toDrawingResponses(annotations.Drawings),
	})
}

func (h *ShareHandler) CreateSharedNote(c *gin.Context) {
	claims, ok := auth.GetShareClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing share session"})
		return
	}

	var body CreateNoteRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note request body"})
		return
	}

	note, err := h.shareService.CreateSharedNote(c.Request.Context(), claims, repository.CreateNoteParams{
		NoteKind:         body.NoteKind,
		TimestampSeconds: body.TimestampSeconds,
		NoteText:         body.NoteText,
		Tags:             body.Tags,
	})
	if err != nil {
		respondShareError(c, err)
		return
	}

	c.JSON(http.StatusCreated, toNoteResponse(*note))
}

func (h *ShareHandler) CreateSharedAnnotationsBatch(c *gin.Context) {
	claims, ok := auth.GetShareClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing share session"})
		return
	}

	var body CreateDrawingsRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid annotations request body"})
		return
	}

	params := make([]repository.CreateDrawingParams, 0, len(body.Drawings))
	for _, drawing := range body.Drawings {
		if !isJSONArray(drawing.DrawingJSON) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "drawing_json must be an array"})
			return
		}

		params = append(params, repository.CreateDrawingParams{
			TimestampSeconds: *drawing.TimestampSeconds,
			DurationSeconds:  *drawing.DurationSeconds,
			Color:            drawing.Color,
			DrawingJSON:      drawing.DrawingJSON,
		})
	}

	drawings, err := h.shareService.CreateSharedDrawings(c.Request.Context(), claims, params)
	if err != nil {
		log.Printf("failed to create shared annotations batch: share_id=%s vod_id=%s drawings=%d error=%v", claims.ShareID, claims.VodID, len(params), err)
		respondShareError(c, err)
		return
	}

	c.JSON(http.StatusCreated, toDrawingResponses(drawings))
}

func (h *ShareHandler) getSharedAnnotations(c *gin.Context) (*services.Annotations, bool) {
	claims, ok := auth.GetShareClaims(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing share session"})
		return nil, false
	}

	annotations, err := h.shareService.GetSharedAnnotations(c.Request.Context(), claims)
	if err != nil {
		respondShareError(c, err)
		return nil, false
	}

	return annotations, true
}

func respondShareError(c *gin.Context, err error) {
	if errors.Is(err, services.ErrVodAccessDenied) || errors.Is(err, services.ErrShareAccessDenied) {
		c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
		return
	}
	if errors.Is(err, services.ErrInvalidSharePermission) || errors.Is(err, services.ErrInvalidGuestName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid share request"})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{"error": "Share request failed"})
}

func toShareResponse(share repository.VodShare) ShareResponse {
	return ShareResponse{
		ID:         share.ID,
		VodID:      share.VodID,
		Permission: share.Permission,
		ExpiresAt:  share.ExpiresAt,
		CreatedAt:  share.CreatedAt,
	}
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
		UpdatedAt:           vod.UpdatedAt,
	}
}

func toNoteResponse(note repository.Note) NoteResponse {
	return NoteResponse{
		ID:               note.ID,
		VodID:            note.VodID,
		GuestName:        note.GuestName,
		NoteKind:         note.NoteKind,
		TimestampSeconds: note.TimestampSeconds,
		NoteText:         note.NoteText,
		Tags:             note.Tags,
	}
}

func toNoteResponses(notes []repository.Note) []NoteResponse {
	responses := make([]NoteResponse, 0, len(notes))
	for _, note := range notes {
		responses = append(responses, toNoteResponse(note))
	}
	return responses
}

func toDrawingResponse(drawing repository.Drawing) DrawingResponse {
	return DrawingResponse{
		ID:               drawing.ID,
		VodID:            drawing.VodID,
		GuestName:        drawing.GuestName,
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
