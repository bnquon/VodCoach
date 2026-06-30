"use client";

import { useState } from "react";
import {
  Button,
  Group,
  Paper,
  Progress,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { Dropzone, MIME_TYPES, type FileWithPath } from "@mantine/dropzone";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  completeVodUpload,
  createVodUpload,
  uploadVodFile,
  type VodDTO,
} from "@/features/vod-dashboard/api";

type DashboardUploadCardProps = {
  onUploadComplete?: (vod: VodDTO) => void;
};

const UPLOAD_STAGE = {
  idle: "idle",
  creating: "creating",
  uploading: "uploading",
  completing: "completing",
} as const;

type UploadStage = (typeof UPLOAD_STAGE)[keyof typeof UPLOAD_STAGE];

const DEFAULT_VIDEO_CONTENT_TYPE = "video/mp4";

function getUploadStatusText(
  uploadStage: UploadStage,
  uploadProgress: number,
  selectedFile: FileWithPath | null,
) {
  switch (uploadStage) {
    case UPLOAD_STAGE.creating:
      return "Creating upload...";
    case UPLOAD_STAGE.uploading:
      return `Uploading ${uploadProgress}%`;
    case UPLOAD_STAGE.completing:
      return "Finalizing upload...";
    case UPLOAD_STAGE.idle:
      return selectedFile ? `${selectedFile.name} ready` : "Select an MP4 file";
  }
}

function getUploadProgressValue(
  uploadStage: UploadStage,
  uploadProgress: number,
) {
  switch (uploadStage) {
    case UPLOAD_STAGE.creating:
      return 10;
    case UPLOAD_STAGE.completing:
      return 100;
    case UPLOAD_STAGE.uploading:
    case UPLOAD_STAGE.idle:
      return uploadProgress;
  }
}

export function DashboardUploadCard({
  onUploadComplete,
}: DashboardUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<UploadStage>(
    UPLOAD_STAGE.idle,
  );

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Select an MP4 file before uploading");
      }

      const contentType = selectedFile.type || DEFAULT_VIDEO_CONTENT_TYPE;

      setUploadProgress(0);
      setUploadStage(UPLOAD_STAGE.creating);

      const upload = await createVodUpload({
        title: title.trim(),
        game: game.trim(),
        fileName: selectedFile.name,
        contentType,
        fileSizeBytes: selectedFile.size,
      });

      setUploadStage(UPLOAD_STAGE.uploading);

      await uploadVodFile({
        uploadURL: upload.upload_url,
        file: selectedFile,
        contentType,
        onProgress: setUploadProgress,
      });

      setUploadStage(UPLOAD_STAGE.completing);

      return completeVodUpload(upload.vod.id);
    },
    onSuccess: (vod) => {
      toast.success("VOD uploaded");
      onUploadComplete?.(vod);
      setSelectedFile(null);
      setTitle("");
      setGame("");
      setUploadProgress(0);
      setUploadStage(UPLOAD_STAGE.idle);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setUploadStage(UPLOAD_STAGE.idle);
    },
  });

  const canUpload = Boolean(selectedFile && title.trim() && game.trim());
  const isUploading = uploadMutation.isPending;
  const uploadStatusText = getUploadStatusText(
    uploadStage,
    uploadProgress,
    selectedFile,
  );

  function handleFileDrop(files: FileWithPath[]) {
    setSelectedFile(files[0] ?? null);
    setUploadProgress(0);
    setUploadStage(UPLOAD_STAGE.idle);
  }

  return (
    <Paper className="vc-elevated-card vc-upload-card" p="lg" radius="md">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start">
          <Stack gap={4}>
            <Title order={2} size="h3">
              Upload VOD
            </Title>
            <Text size="sm" c="dimmed">
              Drop one MP4 here or click to browse.
            </Text>
          </Stack>
          <Text size="xs" fw={700} c="dimmed">
            MP4 only
          </Text>
        </Group>

        <Dropzone
          accept={[MIME_TYPES.mp4]}
          maxFiles={1}
          multiple={false}
          radius="md"
          disabled={isUploading}
          onDrop={handleFileDrop}
        >
          <Group justify="center" mih={112} p="md">
            <Stack gap={4} align="center">
              <Text fw={600}>
                {selectedFile ? selectedFile.name : "Select an MP4 file"}
              </Text>
              <Text size="xs" c="dimmed">
                {uploadStatusText}
              </Text>
            </Stack>
          </Group>
        </Dropzone>

        {isUploading ? (
          <Progress
            animated={uploadStage === UPLOAD_STAGE.uploading}
            value={getUploadProgressValue(uploadStage, uploadProgress)}
          />
        ) : null}

        <Stack gap="sm">
          <TextInput
            label="Title*"
            placeholder="Scrim #1"
            disabled={isUploading}
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
          />
          <TextInput
            label="Game*"
            placeholder="League of Legends"
            disabled={isUploading}
            value={game}
            onChange={(event) => setGame(event.currentTarget.value)}
          />
        </Stack>

        <Button
          disabled={!canUpload}
          fullWidth
          loading={isUploading}
          mt="auto"
          onClick={() => uploadMutation.mutate()}
        >
          Upload
        </Button>
      </Stack>
    </Paper>
  );
}
