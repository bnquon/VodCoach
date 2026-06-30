import { api } from "@/lib/api";
import { toApiResult } from "@/lib/api-result";
import type { DrawingShape } from "./drawing/types";

export const vodNotesQueryKey = (vodID: string) =>
  ["vod-notes", vodID] as const;
export const vodAnnotationsQueryKey = (vodID: string) =>
  ["vod-annotations", vodID] as const;

export const NOTE_KIND = {
  general: "general",
  timestamped: "timestamped",
} as const;

export type NoteKind = (typeof NOTE_KIND)[keyof typeof NOTE_KIND];

export type NoteDTO = {
  id: string;
  vod_id: string;
  note_kind: NoteKind;
  timestamp_seconds: number | null;
  note_text: string;
  tags: string[];
};

export type DrawingDTO = {
  id: string;
  vod_id: string;
  timestamp_seconds: number;
  duration_seconds: number;
  color: string;
  drawing_json: DrawingShape[];
};

export type AnnotationsDTO = {
  notes: NoteDTO[];
  drawings: DrawingDTO[];
};

export type CreateNoteRequestBody = {
  note_kind: NoteKind;
  timestamp_seconds: number | null;
  note_text: string;
  tags: string[];
};

export type UpdateNoteRequestBody = {
  timestamp_seconds: number | null;
  note_text: string;
  tags: string[];
};

export type CreateDrawingRequestBody = {
  timestamp_seconds: number;
  duration_seconds: number;
  color: string;
  drawing_json: DrawingShape[];
};

export type CreateDrawingsRequestBody = {
  drawings: CreateDrawingRequestBody[];
};

export async function getVodNotes(vodID: string) {
  return toApiResult(
    api
      .get<NoteDTO[]>(`/vods/${vodID}/notes`)
      .then((response) => response.data),
  );
}

export async function createVodNote(
  vodID: string,
  body: CreateNoteRequestBody,
) {
  return api
    .post<NoteDTO>(`/vods/${vodID}/notes`, body)
    .then((response) => response.data);
}

export async function updateVodNote(
  vodID: string,
  noteID: string,
  body: UpdateNoteRequestBody,
) {
  return api
    .patch<NoteDTO>(`/vods/${vodID}/notes/${noteID}`, body)
    .then((response) => response.data);
}

export async function deleteVodNote(vodID: string, noteID: string) {
  return api.delete(`/vods/${vodID}/notes/${noteID}`);
}

export async function getVodAnnotations(vodID: string) {
  return toApiResult(
    api
      .get<AnnotationsDTO>(`/vods/${vodID}/annotations`)
      .then((response) => response.data),
  );
}

export async function createVodDrawingsBatch(
  vodID: string,
  body: CreateDrawingsRequestBody,
) {
  return api
    .post<DrawingDTO[]>(`/vods/${vodID}/annotations/batch`, body)
    .then((response) => response.data);
}
