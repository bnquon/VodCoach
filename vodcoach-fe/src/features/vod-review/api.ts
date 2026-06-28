import { api } from "@/lib/api";
import { toApiResult } from "@/lib/api-result";
import type { DrawingShape } from "./drawing/types";

export const TEST_VOD_ID = "c6e40d43-a331-4f2b-a68f-07a13089ac15";

export const vodNotesQueryKey = (vodID: string) =>
  ["vod-notes", vodID] as const;

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

export async function getVodAnnotations(vodID: string) {
  return toApiResult(
    api
      .get<AnnotationsDTO>(`/vods/${vodID}/annotations`)
      .then((response) => response.data),
  );
}
