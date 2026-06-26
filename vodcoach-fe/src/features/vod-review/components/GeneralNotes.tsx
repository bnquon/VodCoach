import { Badge, Box, Group, Paper, Stack, Text, Title } from "@mantine/core";
import type { GeneralNote } from "../types";

type GeneralNotesProps = {
  notes: GeneralNote[];
};

export function GeneralNotes({ notes }: GeneralNotesProps) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <Title order={2} size="sm" mb={6}>
        General notes
      </Title>

      <Box flex={1} mih={0} style={{ overflowY: "auto" }}>
        <Stack gap={6}>
          {notes.map((note) => (
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
      </Box>
    </Paper>
  );
}
