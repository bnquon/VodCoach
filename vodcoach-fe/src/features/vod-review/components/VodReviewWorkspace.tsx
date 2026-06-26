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
  const [isTheatreMode, setIsTheatreMode] = useState(false);
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
          direction={{ base: "column", md: isTheatreMode ? "column" : "row" }}
          gap="xl"
          align="stretch"
        >
          <Box
            flex={{
              base: "1 1 auto",
              md: isTheatreMode ? "1 1 auto" : "0 0 60%",
            }}
            w="100%"
          >
            <UploadedVideoPlayer
              file={selectedFile}
              isTheatreMode={isTheatreMode}
              videoRef={videoPlayerRef}
              onDurationChange={setDurationSeconds}
              onTheatreModeChange={setIsTheatreMode}
              onTimeChange={setCurrentTimeSeconds}
            />
          </Box>

          <Flex
            direction={{ base: "column", md: isTheatreMode ? "row" : "column" }}
            flex="1 1 0"
            gap="md"
            mih={0}
            w="100%"
          >
            <Box flex="1 1 0" mih={isTheatreMode ? 400 : 0} w="100%">
              <TimeStampedNotes
                currentTimeSeconds={currentTimeSeconds}
                durationSeconds={durationSeconds}
                notes={notes}
                onAddNoteStart={handleTimestampNoteAddStart}
                onTimestampClick={handleTimestampClick}
              />
            </Box>
            <Box flex="1 1 0" mih={isTheatreMode ? 400 : 0} w="100%">
              <GeneralNotes notes={generalNotes} />
            </Box>
          </Flex>
        </Flex>
      )}
    </Stack>
  );
}
