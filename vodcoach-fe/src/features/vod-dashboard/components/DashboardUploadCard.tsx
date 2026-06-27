"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Dropzone, MIME_TYPES, type FileWithPath } from "@mantine/dropzone";

export function DashboardUploadCard() {
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");

  return (
    <Paper withBorder p="lg" radius="md">
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={2} size="h3">
            Upload new VOD
          </Title>
          <Text size="sm" c="dimmed">
            Drop one MP4 here or click to browse.
          </Text>
        </Stack>

        <Dropzone
          accept={[MIME_TYPES.mp4]}
          maxFiles={1}
          multiple={false}
          radius="md"
          onDrop={(files) => setSelectedFile(files[0] ?? null)}
        >
          <Group justify="center" mih={96} p="md">
            <Stack gap={4} align="center">
              <Text fw={600}>
                {selectedFile ? selectedFile.name : "Select an MP4 file"}
              </Text>
              <Text size="xs" c="dimmed">
                Upload processing will connect to the backend later.
              </Text>
            </Stack>
          </Group>
        </Dropzone>

        <Group align="end" grow>
          <TextInput
            label="Title"
            placeholder="Match vs Rivals"
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <TextInput
            label="Game"
            placeholder="Valorant"
            value={game}
            onChange={(event) => setGame(event.currentTarget.value)}
          />
          <Button disabled={!selectedFile || !title.trim() || !game.trim()}>
            Upload
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
