package notes

import (
	"errors"
	"net/http"

	"github.com/bnquon/vodcoach-api/cmd/api/internal/auth"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/repository"
	"github.com/bnquon/vodcoach-api/cmd/api/internal/services"
	"github.com/gin-gonic/gin"
)

type NoteResponse struct {
	ID               string   `json:"id"`
	VodID            string   `json:"vod_id"`
	NoteKind         string   `json:"note_kind"`
	TimestampSeconds *int     `json:"timestamp_seconds"`
	NoteText         string   `json:"note_text"`
	Tags             []string `json:"tags"`
}

type NoteHandler struct {
	noteService *services.NoteService
}

type CreateNoteRequestBody struct {
	NoteKind         string   `json:"note_kind" binding:"required,oneof=general timestamped"`
	TimestampSeconds *int     `json:"timestamp_seconds"`
	NoteText         string   `json:"note_text" binding:"required"`
	Tags             []string `json:"tags"`
}

type UpdateNoteRequestBody struct {
	TimestampSeconds *int     `json:"timestamp_seconds"`
	NoteText         string   `json:"note_text" binding:"required"`
	Tags             []string `json:"tags"`
}

func NewNoteHandler(noteService *services.NoteService) *NoteHandler {
	return &NoteHandler{
		noteService: noteService,
	}
}

func toNoteResponse(note repository.Note) NoteResponse {
	return NoteResponse{
		ID:               note.ID,
		VodID:            note.VodID,
		NoteKind:         note.NoteKind,
		TimestampSeconds: note.TimestampSeconds,
		NoteText:         note.NoteText,
		Tags:             note.Tags,
	}
}

func (h *NoteHandler) GetNotes(c *gin.Context) {
	vodID := c.Param("vodID")
	userID := c.GetString(auth.UserIDContextKey)

	notes, err := h.noteService.GetNotes(c.Request.Context(), vodID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notes"})
		return
	}

	c.JSON(http.StatusOK, toNoteResponses(notes))
}

func (h *NoteHandler) CreateNote(c *gin.Context) {
	vodID := c.Param("vodID")
	userID := c.GetString(auth.UserIDContextKey)

	var body CreateNoteRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note request body"})
		return
	}

	note, err := h.noteService.CreateNote(c.Request.Context(), repository.CreateNoteParams{
		VodID:            vodID,
		UserID:           userID,
		NoteKind:         body.NoteKind,
		TimestampSeconds: body.TimestampSeconds,
		NoteText:         body.NoteText,
		Tags:             body.Tags,
	})
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create note"})
		return
	}

	c.JSON(http.StatusCreated, toNoteResponse(*note))
}

func (h *NoteHandler) UpdateNote(c *gin.Context) {
	vodID := c.Param("vodID")
	noteID := c.Param("noteID")
	userID := c.GetString(auth.UserIDContextKey)

	var body UpdateNoteRequestBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid note request body"})
		return
	}

	note, err := h.noteService.UpdateNote(c.Request.Context(), userID, repository.UpdateNoteParams{
		ID:               noteID,
		VodID:            vodID,
		TimestampSeconds: body.TimestampSeconds,
		NoteText:         body.NoteText,
		Tags:             body.Tags,
	})
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}
		if errors.Is(err, services.ErrNoteNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update note"})
		return
	}

	c.JSON(http.StatusOK, toNoteResponse(*note))
}

func (h *NoteHandler) DeleteNote(c *gin.Context) {
	vodID := c.Param("vodID")
	noteID := c.Param("noteID")
	userID := c.GetString(auth.UserIDContextKey)

	err := h.noteService.DeleteNote(c.Request.Context(), vodID, noteID, userID)
	if err != nil {
		if errors.Is(err, services.ErrVodAccessDenied) {
			c.JSON(http.StatusForbidden, gin.H{"error": "You do not have access to this VOD"})
			return
		}
		if errors.Is(err, services.ErrNoteNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Note not found"})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete note"})
		return
	}

	c.Status(http.StatusNoContent)
}

func toNoteResponses(notes []repository.Note) []NoteResponse {
	responses := make([]NoteResponse, 0, len(notes))

	for _, note := range notes {
		responses = append(responses, toNoteResponse(note))
	}

	return responses
}
