package events

import (
	"encoding/json"
	"time"
)

const VodUploadedTopic = "vod.uploaded"

type VodUploadedEvent struct {
	VodID              string    `json:"vod_id"`
	UserID             string    `json:"user_id"`
	OriginalStorageKey string    `json:"original_storage_key"`
	UploadedAt         time.Time `json:"uploaded_at"`
}

func DecodeVodUploadedEvent(value []byte) (VodUploadedEvent, error) {
	var event VodUploadedEvent
	err := json.Unmarshal(value, &event)

	return event, err
}
