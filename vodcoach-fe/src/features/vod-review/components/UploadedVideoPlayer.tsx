"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AspectRatio,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Layer, Line, Stage } from "react-konva";

type UploadedVideoPlayerProps = {
  file: File;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

type DrawingTool = "pen" | "eraser";

type DrawingLine = {
  tool: DrawingTool;
  points: number[];
};

// TODO: Add a proper drawing toolbar, colors, and stroke widths
// TODO: Associate drawings with a video timestamp and a duration in seconds
// TODO: Decouple the drawing logic and types from this file to another file

export function UploadedVideoPlayer({
  file,
  videoRef,
}: UploadedVideoPlayerProps) {
  const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [containerRef, containerRect] = useResizeObserver<HTMLDivElement>();
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawingModeEnabled, setIsDrawingModeEnabled] = useState(false);
  const isDrawing = useRef(false);
  const tool: DrawingTool = "pen";

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (!isDrawingModeEnabled) {
      return;
    }

    isDrawing.current = true;
    const position = event.target.getStage()?.getPointerPosition();

    if (!position) {
      return;
    }

    setLines((currentLines) => [
      ...currentLines,
      { tool, points: [position.x, position.y] },
    ]);
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (!isDrawingModeEnabled || !isDrawing.current) {
      return;
    }

    const stage = event.target.getStage();
    const point = stage?.getPointerPosition();

    if (!point) {
      return;
    }

    setLines((currentLines) => {
      const lastLine = currentLines.at(-1);

      if (!lastLine) {
        return currentLines;
      }

      return [
        ...currentLines.slice(0, -1),
        {
          ...lastLine,
          points: [...lastLine.points, point.x, point.y],
        },
      ];
    });
  }

  function handleMouseUp() {
    isDrawing.current = false;
  }

  function handleDrawingModeChange(checked: boolean) {
    setIsDrawingModeEnabled(checked);
    isDrawing.current = false;
  }

  function handleUndoLastLine() {
    isDrawing.current = false;
    setLines((currentLines) => currentLines.slice(0, -1));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isUndoKey = event.key.toLowerCase() === "z";
      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isUndoKey || !isModifierPressed) {
        return;
      }

      event.preventDefault();
      handleUndoLastLine();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={600}>{file.name}</Text>
          <Group gap="sm">
            <Button
              disabled={lines.length === 0}
              size="compact-sm"
              variant="light"
              onClick={handleUndoLastLine}
            >
              Undo
            </Button>
            <Switch
              checked={isDrawingModeEnabled}
              label="Drawing mode"
              onChange={(event) =>
                handleDrawingModeChange(event.currentTarget.checked)
              }
            />
          </Group>
        </Group>
        <AspectRatio ref={containerRef} pos="relative" ratio={16 / 9}>
          <video
            ref={videoRef}
            disablePictureInPicture
            controls
            preload="metadata"
            src={videoUrl}
          />
          <Box
            pos="absolute"
            inset={0}
            style={{
              pointerEvents: isDrawingModeEnabled ? "auto" : "none",
            }}
          >
            <Stage
              width={containerRect.width}
              height={containerRect.height}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                {lines.map((line, i) => (
                  <Line
                    key={i}
                    points={line.points}
                    stroke="#df4b26"
                    strokeWidth={5}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                    globalCompositeOperation={
                      line.tool === "eraser"
                        ? "destination-out"
                        : "source-over"
                    }
                  />
                ))}
              </Layer>
            </Stage>
          </Box>
        </AspectRatio>
      </Stack>
    </Paper>
  );
}
