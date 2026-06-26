import {
  Badge,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import type { TimestampedNote } from "../types";

type TimeStampedNotesProps = {
  notes: TimestampedNote[];
  onTimestampClick: (timestampSeconds: number) => void;
};

function formatTimestamp(timestampSeconds: number) {
  const minutes = Math.floor(timestampSeconds / 60);
  const seconds = Math.floor(timestampSeconds % 60);

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TimeStampedNotes({
  notes,
  onTimestampClick,
}: TimeStampedNotesProps) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Title order={2} size="sm" mb={6}>
        Timestamped notes
      </Title>

      <Box flex={1} mih={0} style={{ overflowY: "auto" }}>
        <Stack gap={6}>
          {notes.map((note) => (
            <Paper key={note.id} withBorder p="xs" radius="sm">
              <Stack gap={4}>
                <Group justify="space-between" align="flex-start">
                  <Button
                    size="compact-sm"
                    variant="light"
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
      </Box>
    </Paper>
  );
}
