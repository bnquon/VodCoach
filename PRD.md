# VODCoach Studio — PRD

## Overview

VODCoach Studio is a gameplay VOD review platform where users upload gameplay footage, create coaching notes, draw annotations over paused video frames, and generate AI-structured review reports.

The product does not try to automatically understand raw video in the MVP. AI is used to organize user-created notes into useful coaching feedback.

## Core User Flow

1. User signs up or logs in.
2. User uploads a gameplay VOD.
3. The video is stored in Cloudflare R2.
4. The API creates a VOD record in Supabase Postgres.
5. The API publishes a `vod.uploaded` event to Redpanda.
6. A Go worker processes the uploaded video.
7. The worker generates metadata, thumbnail, and preview video.
8. User opens the review workspace.
9. User watches the VOD, pauses, writes timestamped notes, writes general notes, and draws annotations.
10. User generates an AI coaching report from notes and tags.
11. User exports the report as Markdown.

## Tech Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* Konva.js
* TanStack Query
* Zustand
* Vercel

Backend:

* Go
* Gin
* sqlc
* JWT auth
* Railway

Database:

* Supabase Postgres

Object storage:

* Cloudflare R2

Event broker:

* Redpanda

Worker:

* Separate Go worker service
* FFmpeg
* ffprobe

AI:

* OpenAI or Gemini

## MVP Features

### Authentication

Users can register, log in, and access only their own VODs.

### VOD Upload

Users can upload one VOD at a time.

Limits:

* max file size: 500 MB
* max duration: 30 minutes
* accepted formats: MP4, MOV, MKV, WEBM

### Video Preparation Worker

The Go worker consumes `vod.uploaded` events and prepares videos for review.

Responsibilities:

* download original video from Cloudflare R2
* run `ffprobe` for metadata
* generate thumbnail with FFmpeg
* generate 720p MP4 preview if needed
* upload thumbnail and preview to R2
* update VOD status in Postgres
* delete original video after successful processing
* delete local temp files

Statuses:

* `uploaded`
* `processing`
* `ready`
* `failed`

### Dashboard

Users can view uploaded VODs with:

* title
* game
* thumbnail
* status
* processing progress
* upload date

### Review Workspace

Users can:

* play/pause video
* see current timestamp
* create timestamped notes
* create general notes that apply to the full VOD
* tag notes
* draw on paused frames
* click timestamped notes to jump to timestamps

Notes can be either:

* timestamped notes tied to a specific moment in the VOD
* general notes that summarize broader coaching feedback without a timestamp

### Drawing Annotations

Supported tools:

* freehand pen
* arrow
* circle
* text label

Drawings are stored as JSON with normalized coordinates from 0 to 1.

Example:

```json
[
  {
    "id": "draw_1",
    "type": "arrow",
    "color": "#ff3333",
    "strokeWidth": 4,
    "from": { "x": 0.42, "y": 0.55 },
    "to": { "x": 0.63, "y": 0.46 }
  }
]
```

### AI Coaching Report

AI receives:

* VOD title
* game
* timestamped notes
* general notes
* tags
* drawing summaries

AI outputs:

* review summary
* recurring mistakes
* timestamped examples
* strengths
* practice recommendations
* next-session goals

## Database Tables

### users

* id
* email
* password_hash
* created_at

### vods

* id
* user_id
* title
* game
* original_storage_key
* preview_storage_key
* thumbnail_storage_key
* duration_seconds
* width
* height
* container
* video_codec
* audio_codec
* bitrate
* status
* processing_progress
* error_message
* created_at
* updated_at

### annotations

* id
* vod_id
* user_id
* note_kind
* timestamp_seconds
* note_text
* drawing_json
* tags
* created_at
* updated_at

`note_kind` is either `timestamped` or `general`. For general notes, `timestamp_seconds` and `drawing_json` are null. For timestamped notes, `timestamp_seconds` is required. Drawing JSON is optional and only applies when the note is tied to a video frame.

### reports

* id
* vod_id
* user_id
* status
* content_markdown
* created_at
* updated_at

## API Endpoints

Auth:

* `POST /auth/register`
* `POST /auth/login`

VODs:

* `POST /vods`
* `GET /vods`
* `GET /vods/:id`
* `DELETE /vods/:id`

Annotations:

* `POST /vods/:id/annotations`
* `GET /vods/:id/annotations`
* `PATCH /annotations/:id`
* `DELETE /annotations/:id`

Reports:

* `POST /vods/:id/reports`
* `GET /vods/:id/reports/latest`

## Events

### `vod.uploaded`

```json
{
  "eventType": "vod.uploaded",
  "vodId": "vod_123",
  "userId": "user_456",
  "originalStorageKey": "uploads/vod_123/original.mp4"
}
```

### `vod.processed`

```json
{
  "eventType": "vod.processed",
  "vodId": "vod_123",
  "thumbnailStorageKey": "processed/vod_123/thumbnail.jpg",
  "previewStorageKey": "processed/vod_123/preview.mp4"
}
```

### `vod.failed`

```json
{
  "eventType": "vod.failed",
  "vodId": "vod_123",
  "error": "Unsupported video codec"
}
```

## MVP Scope Rule

The MVP loop is:

Upload VOD → process video → review with notes/drawings → generate AI report.

Do not include multiplayer, Discord integration, transcription, semantic search, or raw AI video analysis in the MVP.
