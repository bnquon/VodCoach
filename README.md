# VODCoach Studio

VODCoach Studio is a VOD review platform for uploading gameplay videos, reviewing them in the browser, and attaching coaching feedback. It supports timestamped notes, general notes, canvas-based drawing annotations, and shareable guest review links for collaborative feedback.

## Motivation

The project was motivated by how fragmented TFT coaching sessions can be. Reviews often happen through Discord screen sharing while notes live in a separate app, leaving coaches without a centralized way to interact with the VOD, mark specific moments, or leave visual feedback directly on the gameplay.

## Demo

> Live app: [vod-coach.vercel.app](https://vod-coach.vercel.app)  
> Note: The app is deployed on free-tier services, so the backend or worker may be asleep on first load. If something feels slow, wait a few seconds and retry.

> This demo was recorded on the live web app. The backend and worker were pre-woken for a smoother walkthrough.

<video src="https://github.com/user-attachments/assets/b72df776-590a-4c67-bffa-78e11a05d5c1" controls width="100%"></video>

### Walkthrough

| Time | What happens |
|---:|---|
| `0:03` | Upload a personal VOD. |
| `0:23` | Upload finishes and the worker processes the VOD thumbnail. |
| `0:34` | Add a timestamped note linked to the current video time. |
| `0:54` | Create a shareable link with `Commenter` permissions. |
| `1:03` | Open the share link in an incognito tab as a guest user. |
| `1:23` | Enable drawing mode and add a circle annotation on the video. |
| `1:37` | Add a general note. |
| `1:50` | Return to the logged-in user view and confirm the guest note/drawing were added. |
| `2:00` | Revoke the share link and show that the guest link is no longer valid. |

## Features

- VOD upload and review dashboard
- Video player review workspace with presigned playback URLs
- Timestamped notes tied to video time
- General notes for non-timestamped feedback
- Canvas-based drawing annotations over the video
- Shareable guest review links with viewer/commenter permissions
- JWT auth for registered users and short-lived share-session JWTs for guests
- Cloudflare R2 storage for original videos and generated thumbnails
- Event-driven processing with a Kafka-compatible broker through Redpanda locally or Aiven in deployment
- Go worker for video metadata extraction and thumbnail generation with `ffprobe`/`ffmpeg`
- Retry and failed-state handling for VOD processing

## Tech Stack

- Frontend: Next.js, React, TypeScript, Mantine, Tailwind CSS, TanStack Query, Axios, Konva/react-konva
- Backend: Go, Gin, pgx, JWT auth
- Database: PostgreSQL, Supabase-compatible migrations
- Storage: Cloudflare R2 via the AWS S3 SDK
- Event streaming: Redpanda locally, Aiven Kafka-compatible broker in deployment, franz-go client
- Deployment/infra: Vercel frontend, Render API and worker services, Docker worker image, Docker Compose for local Redpanda

## Learning Outcomes

- Implemented presigned R2 uploads and playback URLs after previously only working with private bucket access patterns.
- Built accountless share links using hashed share tokens, guest names, and short-lived share-session JWTs.
- Learned the basics of video processing with `ffprobe` for metadata and `ffmpeg` for thumbnail generation.
- Split long-running video work into an event-driven API and worker flow using a Kafka-compatible broker.
- Deployed a multi-service app with a frontend, API, worker, managed Postgres, R2 storage, and a managed broker.

## Architecture Overview

The frontend talks to the Go API for authentication, VOD metadata, notes, annotations, sharing, and presigned upload/playback URLs. Original videos and thumbnails live in Cloudflare R2. Slow video processing is handled outside request handlers by publishing upload events to a Kafka-compatible broker and consuming them in a Go worker.

```text
Next.js frontend
  -> Go API
    -> PostgreSQL
    -> Cloudflare R2 presigned upload/playback URLs
    -> Kafka-compatible broker

Kafka-compatible broker
  -> Go worker
    -> downloads original video from R2
    -> runs ffprobe/ffmpeg
    -> uploads thumbnail to R2
    -> updates VOD status/metadata in PostgreSQL
```

## Project Structure

```text
vodcoach-fe/                  Next.js frontend app
vodcoach-fe/src/app/          App Router pages and layout
vodcoach-fe/src/features/     Dashboard, review workspace, drawing, and sharing features
vodcoach-api/                 Go API and worker code
vodcoach-api/cmd/api/main.go  HTTP API entrypoint
vodcoach-api/cmd/api/worker/  Kafka consumer and video processing worker
vodcoach-api/cmd/api/internal Backend handlers, services, repositories, auth, and events
vodcoach-api/migrations/      SQL migrations
docker-compose.yml            Local Redpanda broker and console
DEPLOYMENT.md                 Deployment notes
PRD.md                        Product requirements
roadmap.md                    Build roadmap
```

## Local Development

Prerequisites:

- Go 1.25+
- Node.js and npm
- Docker, for local Redpanda
- PostgreSQL or Supabase database
- Cloudflare R2 buckets and credentials
- `ffmpeg` and `ffprobe` available locally for the worker
- `golang-migrate` CLI for database migrations

Install frontend dependencies:

```sh
cd vodcoach-fe
npm install
```

Copy and fill environment files:

```sh
cp vodcoach-api/.env.example vodcoach-api/.env
cp vodcoach-fe/.env.example vodcoach-fe/.env.local
```

Start local Redpanda:

```sh
docker compose up
```

Run database migrations:

```sh
cd vodcoach-api
migrate -path migrations -database "$DB_URL" up
```

Run the frontend:

```sh
cd vodcoach-fe
npm run dev
```

Run the API:

```sh
cd vodcoach-api
go run ./cmd/api
```

Run the worker:

```sh
cd vodcoach-api
go run ./cmd/api/worker
```

Useful checks:

```sh
cd vodcoach-fe
npm run lint
npx tsc --noEmit

cd ../vodcoach-api
go test ./...
```

## API Overview

- Auth: `POST /register`, `POST /login`
- Health: `GET /health`, `GET /health/db`
- VODs: upload creation, upload completion, list/get/update/delete, playback URL creation, retry processing
- Notes: get/create/update/delete notes for a VOD
- Annotations: get/create batch drawing annotations for a VOD
- Sharing: create/list/revoke share links, create guest share sessions, shared VOD playback/notes/annotations routes
- Debug: local ffprobe probing endpoint

## Development Notes

- Uploads are MP4-only for MVP simplicity.
- Browser uploads go directly to R2 using presigned PUT URLs.
- Playback uses presigned GET URLs instead of making original videos public.
- Drawings are stored as JSONB with normalized coordinates so they can scale with the video player size.
- Share links allow accountless guest access with viewer or commenter permissions.
- Long-running video processing is handled by a worker instead of the API request cycle.
- The worker stores processing failures on the VOD row so the dashboard can show retry actions.
- Render free-tier worker deployment uses a small `/health` endpoint and `WORKER_HEALTH_URL` wake-up ping.

## Future Improvements

- AI-generated coaching summaries
- Transcription and searchable spoken commentary
- Realtime drawing and note updates through WebSockets, SSE, or a managed realtime service instead of polling
- Authored notes and annotations with clearer ownership, guest attribution, and author filtering
- Richer annotation tools
- Semantic search over notes
- More robust upload progress, resume, and retry handling
- Preview/transcoded playback formats for broader browser compatibility

## Limitations

- Video storage, bandwidth, and worker runtime are constrained by third-party service pricing and free-tier limits.
- The deployed worker setup is optimized for an MVP and may have cold-start delays on free hosting.
- Review data currently refreshes through polling rather than true realtime collaboration.
- Large videos and long processing jobs may need stronger queueing, retry, and observability before production use.
