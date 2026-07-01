"use client";

import { useCallback, useRef, useState } from "react";
import { Box, Center, Flex, Loader, Paper, Stack, Text } from "@mantine/core";
import { NOTE_KIND } from "../api";
import { DEFAULT_START_COLOR, type DrawingAnnotation } from "../drawing/types";
import {
  useCreateSharedDrawingsBatch,
  useCreateSharedNote,
  useSharedAnnotations,
  useSharedNotes,
  useSharedPlaybackURL,
} from "../share-hooks";
import {
  toDrawingAnnotations,
  toGeneralNotes,
  toTimestampedNotes,
} from "../mappers";
import { GeneralNotes } from "./GeneralNotes";
import { TimeStampedNotes } from "./TimeStampedNotes";
import { UploadedVideoPlayer } from "./UploadedVideoPlayer";

type SharedVodReviewWorkspaceProps = {
  canComment: boolean;
  shareToken: string;
};

export function SharedVodReviewWorkspace({
  canComment,
  shareToken,
}: SharedVodReviewWorkspaceProps) {
  const { notes: fetchedNotes } = useSharedNotes(shareToken, true);
  const { annotations } = useSharedAnnotations(shareToken, true);
  const {
    data: playbackURL,
    error: playbackURLError,
    isFetching: isPlaybackURLFetching,
    isLoading: isPlaybackURLLoading,
    refetch: refetchPlaybackURL,
  } = useSharedPlaybackURL(shareToken, true);
  const createNote = useCreateSharedNote(shareToken);
  const createDrawingsBatch = useCreateSharedDrawingsBatch(shareToken);
  const notes = toTimestampedNotes(fetchedNotes);
  const generalNotes = toGeneralNotes(fetchedNotes);
  const drawingAnnotations = toDrawingAnnotations(annotations.drawings);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isTheatreMode, setIsTheatreMode] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const handleSaveDrawingAnnotations = useCallback(
    async (drawings: DrawingAnnotation[]): Promise<void> => {
      if (!canComment) {
        return;
      }

      await createDrawingsBatch.mutateAsync(
        drawings.map((drawing) => ({
          timestamp_seconds: drawing.timestampSeconds,
          duration_seconds: drawing.durationSeconds,
          color: drawing.drawingJson[0]?.color ?? DEFAULT_START_COLOR,
          drawing_json: drawing.drawingJson,
        })),
      );
    },
    [canComment, createDrawingsBatch],
  );

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
      <Flex
        direction={{ base: "column", lg: isTheatreMode ? "column" : "row" }}
        gap="sm"
        align="stretch"
      >
        <Box
          flex={{
            base: "1 1 auto",
            lg: isTheatreMode ? "1 1 auto" : "0 0 60%",
          }}
          w="100%"
        >
          {isPlaybackURLLoading ? (
            <Paper className="vc-card" radius="md">
              <Center h={360}>
                <Loader size="sm" />
              </Center>
            </Paper>
          ) : playbackURLError || !playbackURL?.playback_url ? (
            <Paper className="vc-card" radius="md">
              <Center h={360}>
                <Text size="sm" c="red">
                  Failed to load playback URL
                </Text>
              </Center>
            </Paper>
          ) : (
            <UploadedVideoPlayer
              canDraw={canComment}
              drawingAnnotations={drawingAnnotations}
              src={playbackURL.playback_url}
              isTheatreMode={isTheatreMode}
              isRefreshingPlayback={isPlaybackURLFetching}
              videoRef={videoPlayerRef}
              onDurationChange={setDurationSeconds}
              onRefreshPlayback={() => refetchPlaybackURL()}
              onSaveDrawingAnnotations={handleSaveDrawingAnnotations}
              onTheatreModeChange={setIsTheatreMode}
              onTimeChange={setCurrentTimeSeconds}
            />
          )}
        </Box>

        <Flex
          direction={{ base: "column", lg: isTheatreMode ? "row" : "column" }}
          flex="1 1 0"
          gap="sm"
          mih={0}
          w="100%"
        >
          <Box
            flex="1 1 0"
            mih={{ base: 320, lg: isTheatreMode ? 400 : 0 }}
            w="100%"
          >
            <TimeStampedNotes
              canComment={canComment}
              canEditNotes={false}
              currentTimeSeconds={currentTimeSeconds}
              durationSeconds={durationSeconds}
              notes={notes}
              onAddNoteStart={handleTimestampNoteAddStart}
              onCreateNote={(note) =>
                createNote.mutate({
                  noteKind: NOTE_KIND.timestamped,
                  timestampSeconds: note.timestampSeconds,
                  noteText: note.noteText,
                  tags: note.tags,
                })
              }
              onDeleteNote={() => {}}
              onUpdateNote={() => {}}
              onTimestampClick={handleTimestampClick}
            />
          </Box>
          <Box
            flex="1 1 0"
            mih={{ base: 320, lg: isTheatreMode ? 400 : 0 }}
            w="100%"
          >
            <GeneralNotes
              canComment={canComment}
              canEditNotes={false}
              notes={generalNotes}
              onCreateNote={(note) =>
                createNote.mutate({
                  noteKind: NOTE_KIND.general,
                  timestampSeconds: null,
                  noteText: note.noteText,
                  tags: note.tags,
                })
              }
              onDeleteNote={() => {}}
              onUpdateNote={() => {}}
            />
          </Box>
        </Flex>
      </Flex>
    </Stack>
  );
}
