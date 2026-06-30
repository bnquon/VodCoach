package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"os/exec"
	"strconv"
)

type MediaService struct{}

type VideoMetadata struct {
	DurationSeconds int
	Width           int
	Height          int
}

// FFprobeData only models the ffprobe JSON fields we care about.
// json.Unmarshal will ignore all the extra fields ffprobe returns.
type FFprobeData struct {
	Streams []FFprobeStream `json:"streams"`
	Format  FFprobeFormat   `json:"format"`
}

type FFprobeStream struct {
	CodecType string `json:"codec_type"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Duration  string `json:"duration"`
}

type FFprobeFormat struct {
	Duration string `json:"duration"`
}

func NewMediaService() *MediaService {
	return &MediaService{}
}

// TODO: Make sure worker has access to ffprobe in it's own docker container when eventually deployed

func (s *MediaService) ProbeVideo(ctx context.Context, filePath string) (*VideoMetadata, error) {
	output, err := exec.CommandContext(
		ctx,
		"ffprobe",
		"-v", "quiet",
		"-print_format", "json",
		"-show_format",
		"-show_streams",
		filePath,
	).Output()
	if err != nil {
		return nil, fmt.Errorf("probe video: %w", err)
	}

	var data FFprobeData
	if err := json.Unmarshal(output, &data); err != nil {
		return nil, fmt.Errorf("parse ffprobe output: %w", err)
	}

	var videoStream *FFprobeStream
	for i := range data.Streams {
		if data.Streams[i].CodecType == "video" {
			videoStream = &data.Streams[i]
			break
		}
	}

	if videoStream == nil {
		return nil, fmt.Errorf("probe video: no video stream found")
	}

	duration := data.Format.Duration
	if duration == "" {
		duration = videoStream.Duration
	}

	durationSeconds, err := strconv.ParseFloat(duration, 64)
	if err != nil {
		return nil, fmt.Errorf("parse video duration: %w", err)
	}

	return &VideoMetadata{
		DurationSeconds: int(math.Ceil(durationSeconds)),
		Width:           videoStream.Width,
		Height:          videoStream.Height,
	}, nil
}

func (s *MediaService) GenerateThumbnail(ctx context.Context, filePath string) (string, error) {
	thumbnailFile, err := os.CreateTemp("", "vodcoach-thumbnail-*.jpg")
	if err != nil {
		return "", fmt.Errorf("create thumbnail temp file: %w", err)
	}
	thumbnailPath := thumbnailFile.Name()
	if err := thumbnailFile.Close(); err != nil {
		return "", fmt.Errorf("close thumbnail temp file: %w", err)
	}

	output, err := exec.CommandContext(
		ctx,
		"ffmpeg",
		"-y",
		"-ss", "00:00:03",
		"-i", filePath,
		"-vf", "scale=1280:-1",
		"-vframes", "1",
		thumbnailPath,
	).CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("generate thumbnail: %w: %s", err, string(output))
	}

	return thumbnailPath, nil
}
