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

Completed: June 28 ✅

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

Completed: June 29 ✅

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

Completed: June 29 ✅

## Phase 6: Private VOD Playback

Make uploaded videos playable through short-lived private URLs.

Build:

* backend adds `GET /vods/:vodID/playback-url`
* backend verifies the JWT user owns the VOD
* backend creates a presigned GET URL for `original_storage_key`
* frontend fetches the playback URL when opening the review page
* frontend uses the returned URL as the video source
* keep generated thumbnails publicly readable from the thumbnail bucket

Done when:

* owned VODs play in the review workspace without hardcoded `/TestVod.mp4`
* unauthorized users cannot get playback URLs for VODs they do not own
* original videos stay private in the VOD bucket

## Phase 7: Full Review Workspace

Connect the real processed VOD to the review UI.

Build:

* VOD dashboard
* review page by VOD id
* load private playback URL
* load annotations
* create/update/delete notes
* save drawing JSON
* restore annotations on refresh
* tag notes

Done when:

* user can review a processed VOD end to end
* notes and drawings persist correctly

## Phase 8: Polish

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

Done when:

* someone can understand the project in under 2 minutes
* deployed demo works with a small sample VOD
