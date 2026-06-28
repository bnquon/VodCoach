import { NOTE_KIND, type DrawingDTO, type NoteDTO } from "./api";
import type { DrawingAnnotation } from "./drawing/types";
import type { GeneralNote, TimestampedNote } from "./types";

export function toTimestampedNotes(notes: NoteDTO[]): TimestampedNote[] {
  return notes
    .filter(
      (note): note is typeof note & { timestamp_seconds: number } =>
        note.note_kind === NOTE_KIND.timestamped &&
        note.timestamp_seconds !== null,
    )
    .map((note) => ({
      id: note.id,
      noteText: note.note_text,
      tags: note.tags,
      timestampSeconds: note.timestamp_seconds,
    }));
}

export function toGeneralNotes(notes: NoteDTO[]): GeneralNote[] {
  return notes
    .filter((note) => note.note_kind === NOTE_KIND.general)
    .map((note) => ({
      id: note.id,
      noteText: note.note_text,
      tags: note.tags,
    }));
}

export function toDrawingAnnotations(
  drawings: DrawingDTO[],
): DrawingAnnotation[] {
  return drawings.map((drawing) => ({
    id: drawing.id,
    timestampSeconds: drawing.timestamp_seconds,
    durationSeconds: drawing.duration_seconds,
    drawingJson: drawing.drawing_json,
  }));
}
