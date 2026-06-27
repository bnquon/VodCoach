import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useState } from "react";
import type { GeneralNote } from "../types";

type GeneralNotesProps = {
  notes: GeneralNote[];
};

export function GeneralNotes({ notes }: GeneralNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [draftNoteText, setDraftNoteText] = useState("");
  const [draftTags, setDraftTags] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);

  function handleCancelAddNote() {
    setIsAddingNote(false);
    setDraftNoteText("");
    setDraftTags("");
  }

  function handleSaveNote() {
    if (!draftNoteText.trim()) {
      return;
    }

    setLocalNotes((currentNotes) => [
      ...currentNotes,
      {
        id: crypto.randomUUID(),
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
          General notes
        </Title>
        <Button
          size="compact-xs"
          variant={isAddingNote ? "default" : "light"}
          onClick={
            isAddingNote ? handleCancelAddNote : () => setIsAddingNote(true)
          }
        >
          {isAddingNote ? "Cancel" : "+ Add note"}
        </Button>
      </Group>

      <Box flex={1} mih={0} style={{ overflowY: "auto" }}>
        {isAddingNote ? (
          <Stack gap="xs">
            <Textarea
              autosize
              minRows={5}
              label="Note"
              placeholder="What is the broader coaching takeaway?"
              size="xs"
              value={draftNoteText}
              onChange={(event) => setDraftNoteText(event.currentTarget.value)}
            />
            <TextInput
              label="Tags"
              placeholder="tempo, mechanics"
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
                  <Group gap={4}>
                    {note.tags.map((tag) => (
                      <Badge key={tag} size="sm" variant="light">
                        {tag}
                      </Badge>
                    ))}
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
