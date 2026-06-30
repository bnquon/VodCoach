import {
  Badge,
  Box,
  Button,
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
import type { GeneralNote } from "../types";
import { NotesEmptyState } from "./NotesEmptyState";

type GeneralNotesProps = {
  notes: GeneralNote[];
  onCreateNote: (note: { noteText: string; tags: string[] }) => void;
  onDeleteNote: (noteID: string) => void;
  onUpdateNote: (note: {
    id: string;
    noteText: string;
    tags: string[];
  }) => void;
};

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function GeneralNotes({
  notes,
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
}: GeneralNotesProps) {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteID, setEditingNoteID] = useState<string | null>(null);
  const [notePendingDelete, setNotePendingDelete] =
    useState<GeneralNote | null>(null);
  const [draftNoteText, setDraftNoteText] = useState("");
  const [draftTags, setDraftTags] = useState("");

  function handleCancelAddNote() {
    setIsAddingNote(false);
    setEditingNoteID(null);
    setDraftNoteText("");
    setDraftTags("");
  }

  function handleStartAddNote() {
    setEditingNoteID(null);
    setDraftNoteText("");
    setDraftTags("");
    setIsAddingNote(true);
  }

  function handleStartEditNote(note: GeneralNote) {
    setEditingNoteID(note.id);
    setDraftNoteText(note.noteText);
    setDraftTags(note.tags.join(", "));
    setIsAddingNote(true);
  }

  function handleSaveNote() {
    if (!draftNoteText.trim()) {
      return;
    }

    const notePayload = {
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
            General notes
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
              <Textarea
                autosize
                minRows={5}
                label="Note"
                placeholder="What is the broader coaching takeaway?"
                size="xs"
                value={draftNoteText}
                onChange={(event) =>
                  setDraftNoteText(event.currentTarget.value)
                }
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
                  {editingNoteID ? "Save changes" : "Save note"}
                </Button>
              </Group>
            </Stack>
          ) : notes.length === 0 ? (
            <NotesEmptyState message="No general notes yet." />
          ) : (
            <Stack gap={6}>
              {notes.map((note) => (
                <Paper
                  key={note.id}
                  className="vc-elevated-card"
                  p="xs"
                  radius="sm"
                >
                  <Stack gap={4}>
                    <Group justify="space-between" align="flex-start">
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
