import {
  Badge,
  Box,
  Button,
  NumberInput,
  Group,
  Modal,
  Paper,
  Popover,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import type { TimestampedNote } from "../types";

type TimeStampedNotesProps = {
  currentTimeSeconds: number;
  durationSeconds: number;
  notes: TimestampedNote[];
  onAddNoteStart: () => void;
  onCreateNote: (note: {
    noteText: string;
    tags: string[];
    timestampSeconds: number;
  }) => void;
  onDeleteNote: (noteID: string) => void;
  onUpdateNote: (note: {
    id: string;
    noteText: string;
    tags: string[];
    timestampSeconds: number;
  }) => void;
  onTimestampClick: (timestampSeconds: number) => void;
};

function formatTimestamp(timestampSeconds: number) {
  const minutes = Math.floor(timestampSeconds / 60);
  const seconds = Math.floor(timestampSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function clampTimestamp(timestampSeconds: number, durationSeconds: number) {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return Math.max(0, timestampSeconds);
  }

  return Math.min(Math.max(0, timestampSeconds), Math.floor(durationSeconds));
}

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function TimeStampedNotes({
  currentTimeSeconds,
  durationSeconds,
  notes,
  onAddNoteStart,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
  onTimestampClick,
}: TimeStampedNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteID, setEditingNoteID] = useState<string | null>(null);
  const [notePendingDelete, setNotePendingDelete] =
    useState<TimestampedNote | null>(null);
  const [draftNoteText, setDraftNoteText] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftTimestampSeconds, setDraftTimestampSeconds] = useState<
    number | string
  >(0);
  const sortedNotes = [...notes].sort(
    (a, b) => a.timestampSeconds - b.timestampSeconds,
  );

  function handleStartAddNote() {
    const timestampSeconds = clampTimestamp(
      Math.floor(currentTimeSeconds),
      durationSeconds,
    );

    onAddNoteStart();
    setEditingNoteID(null);
    setDraftNoteText("");
    setDraftTags("");
    setDraftTimestampSeconds(timestampSeconds);
    setIsAddingNote(true);
  }

  function handleStartEditNote(note: TimestampedNote) {
    setEditingNoteID(note.id);
    setDraftNoteText(note.noteText);
    setDraftTags(note.tags.join(", "));
    setDraftTimestampSeconds(note.timestampSeconds);
    setIsAddingNote(true);
  }

  function handleCancelAddNote() {
    setIsAddingNote(false);
    setEditingNoteID(null);
    setDraftNoteText("");
    setDraftTags("");
    setDraftTimestampSeconds(0);
  }

  function handleSaveNote() {
    const rawTimestampSeconds = Number(draftTimestampSeconds);

    if (!draftNoteText.trim() || Number.isNaN(rawTimestampSeconds)) {
      return;
    }

    const timestampSeconds = clampTimestamp(
      rawTimestampSeconds,
      durationSeconds,
    );

    const notePayload = {
      timestampSeconds,
      noteText: draftNoteText.trim(),
      tags: parseTags(draftTags),
    };

    if (editingNoteID) {
      onUpdateNote({
        id: editingNoteID,
        ...notePayload,
      });
    } else {
      onCreateNote(notePayload);
    }

    handleCancelAddNote();
  }

  function handleConfirmDeleteNote() {
    if (!notePendingDelete) {
      return;
    }

    onDeleteNote(notePendingDelete.id);
    setNotePendingDelete(null);
  }

  return (
    <>
      <Paper
        className="vc-card"
        p="xs"
        radius="md"
        h="100%"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <Group justify="space-between" align="center" mb={6}>
          <Title order={2} size="sm">
            Timestamped notes
          </Title>
          <Button
            size="compact-xs"
            variant={isAddingNote ? "default" : "light"}
            onClick={isAddingNote ? handleCancelAddNote : handleStartAddNote}
          >
            {isAddingNote ? "Cancel" : "+ Add note"}
          </Button>
        </Group>

        <Box flex={1} mih={0} style={{ overflowY: "auto" }}>
          {isAddingNote ? (
            <Stack gap="xs">
              <NumberInput
                label="Timestamp"
                max={
                  durationSeconds > 0 ? Math.floor(durationSeconds) : undefined
                }
                min={0}
                size="xs"
                suffix=" sec"
                value={draftTimestampSeconds}
                onChange={setDraftTimestampSeconds}
              />
              <Textarea
                autosize
                minRows={4}
                label="Note"
                placeholder="What happened at this moment?"
                size="xs"
                value={draftNoteText}
                onChange={(event) =>
                  setDraftNoteText(event.currentTarget.value)
                }
              />
              <TextInput
                label="Tags"
                placeholder="positioning, timing"
                size="xs"
                value={draftTags}
                onChange={(event) => setDraftTags(event.currentTarget.value)}
              />
              <Group justify="flex-end" gap="xs">
                <Button size="compact-xs" onClick={handleSaveNote}>
                  {editingNoteID ? "Save changes" : "Save note"}
                </Button>
              </Group>
            </Stack>
          ) : (
            <Stack gap={6}>
              {sortedNotes.map((note) => (
                <Paper
                  key={note.id}
                  className="vc-elevated-card"
                  p="xs"
                  radius="sm"
                >
                  <Stack gap={4}>
                    <Group justify="space-between" align="flex-start">
                      <Button
                        size="compact-sm"
                        variant="outline"
                        color="red"
                        onClick={() => onTimestampClick(note.timestampSeconds)}
                      >
                        {formatTimestamp(note.timestampSeconds)}
                      </Button>
                      <Group gap={4}>
                        {note.tags.map((tag) => (
                          <Badge key={tag} size="sm" variant="light">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                      <Popover position="bottom-end" shadow="md">
                        <Popover.Target>
                          <Button size="compact-xs" variant="subtle">
                            ...
                          </Button>
                        </Popover.Target>
                        <Popover.Dropdown p={4}>
                          <Stack gap={4}>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              onClick={() => handleStartEditNote(note)}
                            >
                              Edit
                            </Button>
                            <Button
                              color="red"
                              size="compact-xs"
                              variant="subtle"
                              onClick={() => setNotePendingDelete(note)}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </Popover.Dropdown>
                      </Popover>
                    </Group>

                    <Text size="xs">{note.noteText}</Text>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

      <Modal
        opened={notePendingDelete !== null}
        title="Delete note?"
        centered
        onClose={() => setNotePendingDelete(null)}
      >
        <Stack gap="md">
          <Text size="sm">
            This will permanently delete this note from the VOD.
          </Text>
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => setNotePendingDelete(null)}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmDeleteNote}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
