# VODCoach Studio — Build Guide

## Goal

Build the MVP in small phases. Each phase should leave the app in a working state.

## Phase 1: Drawing Prototype

Start with the unique frontend interaction before building infrastructure.

Build:

* Next.js app
* local video file upload in browser
* video player
* Konva.js or canvas overlay
* freehand drawing
* arrow drawing
* circle drawing
* timestamped notes in frontend state
* click note to jump back to timestamp
* restore drawing for selected note

Done when:

* a local video can be loaded
* user can pause, draw, save a note, and jump back to it

Do not add backend yet.

Completed: June 26 ✅

## Phase 2: Backend + Database

Add persistence.

Build:

* Go API with Gin
* Supabase Postgres connection
* sqlc setup
* migrations
* users table
* vods table
* annotations table
* reports table ❌ SKIPPED FOR NOW
* basic JWT auth
* annotation CRUD endpoints

Done when:

* user can sign up/log in
* frontend can save and load annotations from Postgres
* drawing JSON persists after refresh

Use a sample video URL for this phase.

Completed: June 28 ✅

## Phase 3: Cloudflare R2 Uploads

Add real video upload.

Build:

* Cloudflare R2 bucket
* R2 credentials in env vars
* backend storage client
* upload endpoint
* VOD creation endpoint
* file size/type validation
* frontend upload progress
* dashboard showing uploaded VODs

* user can upload a video to R2
* VOD row stores the R2 key
* dashboard shows the uploaded VOD

At this point, playing the original uploaded video directly is acceptable.

## Phase 4: Redpanda + Worker Skeleton

Add event-driven background processing without FFmpeg yet.

Build:

* Redpanda setup
* API publishes `vod.uploaded`
* separate Go worker process
* worker consumes `vod.uploaded`
* worker updates VOD status:

  * `uploaded`
  * `processing`
  * `ready`

Done when:

* uploading a VOD triggers an event
* worker receives the event
* frontend sees status change

Do not add video processing yet.

## Phase 5: FFprobe + Thumbnail

Make the worker useful.

Build:

* worker downloads original video from R2
* worker stores it in local temp folder
* worker runs `ffprobe`
* worker saves metadata to Postgres
* worker runs FFmpeg to generate thumbnail
* worker uploads thumbnail to R2
* worker deletes local temp files
* worker marks failed jobs as `failed`

Done when:

* dashboard shows real metadata
* dashboard shows generated thumbnail
* failed videos show an error

## Phase 6: Preview Video

Make videos reliably playable.

Build:

* worker checks if video is browser-playable
* if needed, worker creates 720p MP4 preview
* worker uploads preview to R2
* worker saves preview key to Postgres
* worker deletes original file from R2 after success
* frontend plays preview video

Done when:

* uploaded VOD becomes a playable processed preview
* original video is deleted after processing
* only preview and thumbnail remain in R2

## Phase 7: Full Review Workspace

Connect the real processed VOD to the review UI.

Build:

* VOD dashboard
* review page by VOD id
* load preview video
* load annotations
* create/update/delete notes
* save drawing JSON
* restore annotations on refresh
* tag notes

Done when:

* user can review a processed VOD end to end
* notes and drawings persist correctly

## Phase 8: AI Report

Add useful AI.

Build:

* report generation endpoint
* prompt from notes/tags/drawing summaries
* save Markdown report to Postgres
* display report in frontend
* export/copy Markdown

Done when:

* user can generate a structured coaching report
* report includes recurring mistakes, examples, strengths, and practice goals

## Phase 9: Polish

Make it portfolio-ready.

Build:

* loading states
* error states
* empty states
* delete VOD flow
* cleanup R2 files on delete
* README
* architecture diagram
* demo video
* resume bullet

Done when:

* someone can understand the project in under 2 minutes
* deployed demo works with a small sample VOD

## Suggested 1-Month Timeline

Week 1:

* drawing prototype
* basic Go API
* database schema
* save/load annotations

Week 2:

* R2 uploads
* VOD dashboard
* auth
* basic review page connected to backend

Week 3:

* Redpanda
* Go worker
* ffprobe
* thumbnail generation
* preview video generation

Week 4:

* AI report
* Markdown export
* cleanup flow
* UI polish
* README and demo

## Scope Control

Avoid until after MVP:

* multiplayer review
* Discord bot
* transcription
* raw AI video analysis
* semantic search
* multiple preview qualities
* mobile app
* advanced sharing
* Kubernetes
* overcomplicated deployment

Always return to the core loop:

Upload VOD → process video → review with notes/drawings → generate AI report.
