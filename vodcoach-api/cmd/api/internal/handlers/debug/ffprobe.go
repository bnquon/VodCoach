package debug

import (
	"bytes"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type FFprobeHandler struct{}

func NewFFprobeHandler() *FFprobeHandler {
	return &FFprobeHandler{}
}

func (h *FFprobeHandler) Probe(c *gin.Context) {
	file, err := c.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Expected multipart file field named video"})
		return
	}

	tempDir, err := os.MkdirTemp("", "vodcoach-ffprobe-*")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp directory"})
		return
	}
	defer os.RemoveAll(tempDir)

	extension := filepath.Ext(file.Filename)
	if extension == "" {
		extension = ".mp4"
	}

	localPath := filepath.Join(tempDir, "input"+extension)
	if err := c.SaveUploadedFile(file, localPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded file"})
		return
	}

	var stderr bytes.Buffer
	command := exec.CommandContext(
		c.Request.Context(),
		"ffprobe",
		"-v",
		"error",
		"-print_format",
		"json",
		"-show_format",
		"-show_streams",
		localPath,
	)
	command.Stderr = &stderr

	output, err := command.Output()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "ffprobe failed",
			"detail": stderr.String(),
		})
		return
	}

	log.Printf("ffprobe output for %s:\n%s", file.Filename, string(output))
	c.Data(http.StatusOK, "application/json", output)
}
