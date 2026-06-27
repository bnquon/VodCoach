import {
  Badge,
  Box,
  Button,
  NumberInput,
  Group,
  Paper,
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

export function TimeStampedNotes({
  currentTimeSeconds,
  durationSeconds,
  notes,
  onAddNoteStart,
  onTimestampClick,
}: TimeStampedNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [draftNoteText, setDraftNoteText] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [draftTimestampSeconds, setDraftTimestampSeconds] = useState<
    number | string
  >(0);
  const [localNotes, setLocalNotes] = useState(notes);

  function handleStartAddNote() {
    const timestampSeconds = clampTimestamp(
      Math.floor(currentTimeSeconds),
      durationSeconds,
    );

    onAddNoteStart();
    setDraftTimestampSeconds(timestampSeconds);
    setIsAddingNote(true);
  }

  function handleCancelAddNote() {
    setIsAddingNote(false);
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

    setLocalNotes((currentNotes) => [
      ...currentNotes,
      {
        id: crypto.randomUUID(),
        timestampSeconds,
        noteText: draftNoteText.trim(),
        tags: draftTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      },
    ]);
    handleCancelAddNote();
  }

  return (
    <Paper
      withBorder
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
              onChange={(event) => setDraftNoteText(event.currentTarget.value)}
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
                Save note
              </Button>
            </Group>
          </Stack>
        ) : (
          <Stack gap={6}>
            {localNotes.map((note) => (
              <Paper key={note.id} withBorder p="xs" radius="sm">
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
                  </Group>

                  <Text size="xs">{note.noteText}</Text>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
