"use client";

import { useRef, useState } from "react";
import { Box, Flex, Stack } from "@mantine/core";
import { NOTE_KIND } from "../api";
import { useCreateVodNote, useVodAnnotations, useVodNotes } from "../hooks";
import {
  toDrawingAnnotations,
  toGeneralNotes,
  toTimestampedNotes,
} from "../mappers";
import { GeneralNotes } from "./GeneralNotes";
import { TimeStampedNotes } from "./TimeStampedNotes";
import { UploadedVideoPlayer } from "./UploadedVideoPlayer";

interface VodReviewWorkspaceProps {
  videoId?: string;
  vodTitle: string;
}

export function VodReviewWorkspace({
  videoId,
  vodTitle,
}: VodReviewWorkspaceProps) {
  // TODO: Use videoId once the VOD list is backed by the API. For now hooks use the hardcoded test VOD id.
  void videoId;

  const { notes: fetchedNotes } = useVodNotes();
  const { annotations } = useVodAnnotations();
  const createNote = useCreateVodNote();
  const notes = toTimestampedNotes(fetchedNotes);
  const generalNotes = toGeneralNotes(fetchedNotes);
  const drawingAnnotations = toDrawingAnnotations(annotations.drawings);
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

  function handleCreateTimestampedNote(note: {
    noteText: string;
    tags: string[];
    timestampSeconds: number;
  }) {
    createNote.mutate({
      noteKind: NOTE_KIND.timestamped,
      timestampSeconds: note.timestampSeconds,
      noteText: note.noteText,
      tags: note.tags,
    });
  }

  function handleCreateGeneralNote(note: { noteText: string; tags: string[] }) {
    createNote.mutate({
      noteKind: NOTE_KIND.general,
      timestampSeconds: null,
      noteText: note.noteText,
      tags: note.tags,
    });
  }

  return (
    <Stack gap="xl">
      <Flex
        direction={{ base: "column", md: isTheatreMode ? "column" : "row" }}
        gap="sm"
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
            drawingAnnotations={drawingAnnotations}
            src="/TestVod.mp4"
            title={vodTitle}
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
          gap="sm"
          mih={0}
          w="100%"
        >
          <Box flex="1 1 0" mih={isTheatreMode ? 400 : 0} w="100%">
            <TimeStampedNotes
              currentTimeSeconds={currentTimeSeconds}
              durationSeconds={durationSeconds}
              notes={notes}
              onAddNoteStart={handleTimestampNoteAddStart}
              onCreateNote={handleCreateTimestampedNote}
              onTimestampClick={handleTimestampClick}
            />
          </Box>
          <Box flex="1 1 0" mih={isTheatreMode ? 400 : 0} w="100%">
            <GeneralNotes
              notes={generalNotes}
              onCreateNote={handleCreateGeneralNote}
            />
          </Box>
        </Flex>
      </Flex>
    </Stack>
  );
}
