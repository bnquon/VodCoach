"use client";

import { useRef, useState } from "react";
import { Box, Flex, Paper, Stack } from "@mantine/core";
import type { FileWithPath } from "@mantine/dropzone";
import testGeneralNotes from "../data/testGeneralNotes.json";
import testTimestampedNotes from "../data/testTimestampedNotes.json";
import type { GeneralNote, TimestampedNote } from "../types";
import { GeneralNotes } from "./GeneralNotes";
import { TimeStampedNotes } from "./TimeStampedNotes";
import { UploadedVideoPlayer } from "./UploadedVideoPlayer";
import { VideoUploadDropzone } from "./VideoUploadDropzone";

interface VodReviewWorkspaceProps {
  videoId?: string;
}

export function VodReviewWorkspace({ videoId }: VodReviewWorkspaceProps) {
  // TODO: React query to fetch notes from the backend if videoId is provided meaning it's a processed VOD
  void videoId;

  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [notes] = useState<TimestampedNote[]>(
    testTimestampedNotes as TimestampedNote[],
  );
  const [generalNotes] = useState<GeneralNote[]>(
    testGeneralNotes as GeneralNote[],
  );
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  function handleTimestampClick(timestampSeconds: number) {
    const video = videoPlayerRef.current;

    if (!video) {
      return;
    }

    video.currentTime = timestampSeconds;
    video.play();
  }

  function handleTimestampNoteAddStart() {
    videoPlayerRef.current?.pause();
  }

  return (
    <Stack gap="xl">
      <Paper withBorder p="md" radius="md">
        <VideoUploadDropzone
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </Paper>

      {selectedFile && (
        <Flex
          direction={{ base: "column", md: "row" }}
          gap="xl"
          align="stretch"
        >
          <Box flex={{ base: "1 1 auto", md: "0 0 60%" }} w="100%">
            <UploadedVideoPlayer
              file={selectedFile}
              videoRef={videoPlayerRef}
              onDurationChange={setDurationSeconds}
              onTimeChange={setCurrentTimeSeconds}
            />
          </Box>

          <Stack flex="1 1 0" gap="md" mih={0} w="100%">
            <Box flex="1 1 0" mih={0}>
              <TimeStampedNotes
                currentTimeSeconds={currentTimeSeconds}
                durationSeconds={durationSeconds}
                notes={notes}
                onAddNoteStart={handleTimestampNoteAddStart}
                onTimestampClick={handleTimestampClick}
              />
            </Box>
            <Box flex="1 1 0" mih={0}>
              <GeneralNotes notes={generalNotes} />
            </Box>
          </Stack>
        </Flex>
      )}
    </Stack>
  );
}
