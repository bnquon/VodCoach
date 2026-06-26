# VODCoach Studio

VODCoach Studio is a gameplay VOD review app for players and coaches. The MVP focuses on uploading gameplay footage, adding timestamped notes, drawing annotations on paused frames, and turning those notes into a structured coaching report.

The product does not attempt raw video understanding in the first version. AI is used to organize user-created notes, tags, and drawing summaries into clear feedback.

## Core Flow

1. Upload a gameplay VOD.
2. Process the video for playback, metadata, and thumbnail generation.
3. Review the VOD with timestamped notes and frame annotations.
4. Generate an AI coaching report.
5. Export the report as Markdown.

## Planned Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Konva.js
- State and data: Zustand, TanStack Query
- Backend: Go, Gin, sqlc, JWT auth
- Database: Supabase Postgres
- Storage: Cloudflare R2
- Events: Redpanda
- Worker: Go, FFmpeg, ffprobe
- AI: OpenAI or Gemini
- Hosting: Vercel and Railway

## Repository Layout

```text
vodcoach-fe/  Next.js frontend
PRD.md        Product requirements
roadmap.md    Phased build plan
```

Backend, worker, database migrations, and infrastructure files will be added as the project moves beyond the frontend prototype.

## Local Development

Install frontend dependencies and run the app:

```sh
cd vodcoach-fe
npm install
npm run dev
```

Useful checks:

```sh
npm run lint
npm run build
```

Environment variables will be introduced as backend, storage, event, and AI integrations are added. Do not commit secrets or local media files.

## Build Plan

The project is being built in phases:

1. Drawing prototype with local video upload and timestamped notes.
2. Backend, database, auth, and annotation persistence.
3. Cloudflare R2 uploads and dashboard.
4. Redpanda event publishing and worker skeleton.
5. FFprobe metadata extraction and thumbnail generation.
6. Preview video generation for reliable playback.
7. Full review workspace connected to processed VODs.
8. AI report generation and Markdown export.
9. Polish, cleanup flows, documentation, and demo.

The core loop is upload, process, review, and generate feedback.
