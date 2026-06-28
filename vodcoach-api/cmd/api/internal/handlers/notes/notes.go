package notes

import (
	"net/http"

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

	notes, err := h.noteService.GetNotes(c.Request.Context(), vodID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get notes"})
		return
	}

	c.JSON(http.StatusOK, toNoteResponses(notes))
}

func toNoteResponses(notes []repository.Note) []NoteResponse {
	responses := make([]NoteResponse, 0, len(notes))

	for _, note := range notes {
		responses = append(responses, toNoteResponse(note))
	}

	return responses
}
