"use client";

import { Group, Stack, Text } from "@mantine/core";
import {
  Dropzone,
  MIME_TYPES,
  type FileRejection,
  type FileWithPath,
} from "@mantine/dropzone";

type VideoUploadDropzoneProps = {
  selectedFile?: File | null;
  disabled?: boolean;
  onFileSelect: (file: FileWithPath) => void;
  onReject?: (rejections: FileRejection[]) => void;
};

export function VideoUploadDropzone({
  selectedFile,
  disabled = false,
  onFileSelect,
  onReject,
}: VideoUploadDropzoneProps) {
  return (
    <Dropzone
      accept={[MIME_TYPES.mp4]}
      disabled={disabled}
      maxFiles={1}
      multiple={false}
      // maxSize={500 * 1024 ** 2}
      onDrop={(files) => {
        const [file] = files;

        if (file) {
          onFileSelect(file);
        }
      }}
      onReject={onReject}
      radius="md"
    >
      <Group justify="center" mih={180} p="xl">
        <Stack gap={6} align="center" ta="center">
          <Dropzone.Accept>
            <Text fw={600}>Drop the MP4 file here</Text>
          </Dropzone.Accept>
          <Dropzone.Reject>
            <Text fw={600} c="red">
              Only one MP4 file is supported
            </Text>
          </Dropzone.Reject>
          <Dropzone.Idle>
            <Text fw={600}>Upload gameplay VOD</Text>
          </Dropzone.Idle>

          <Text size="sm" c="dimmed">
            Drag one MP4 file here, or click to browse.
          </Text>

          {selectedFile ? (
            <Text size="sm" fw={500}>
              Selected: {selectedFile.name}
            </Text>
          ) : null}
        </Stack>
      </Group>
    </Dropzone>
  );
}
