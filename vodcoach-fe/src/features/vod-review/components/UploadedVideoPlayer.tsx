"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AspectRatio, Box, Paper, Stack, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import {
  DrawingToolbar,
  type DrawingTool,
} from "./DrawingToolbar";

type UploadedVideoPlayerProps = {
  file: File;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDurationChange?: (durationSeconds: number) => void;
  onTimeChange?: (currentTimeSeconds: number) => void;
};

type FreehandDrawing = {
  id: string;
  type: "freehand";
  color: string;
  points: number[];
  strokeWidth: number;
  tool: Extract<DrawingTool, "pen" | "eraser">;
};

type RectangleDrawing = {
  id: string;
  type: "rectangle";
  color: string;
  height: number;
  strokeWidth: number;
  width: number;
  x: number;
  y: number;
};

type CircleDrawing = {
  id: string;
  type: "circle";
  color: string;
  radius: number;
  strokeWidth: number;
  x: number;
  y: number;
};

type DrawingShape = FreehandDrawing | RectangleDrawing | CircleDrawing;

type Point = {
  x: number;
  y: number;
};

type NormalizedRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function createDrawingId() {
  return crypto.randomUUID();
}

function getDistance(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

function normalizeRect(rectangle: RectangleDrawing): NormalizedRect {
  return {
    x: Math.min(rectangle.x, rectangle.x + rectangle.width),
    y: Math.min(rectangle.y, rectangle.y + rectangle.height),
    width: Math.abs(rectangle.width),
    height: Math.abs(rectangle.height),
  };
}

function isFreehandTool(
  tool: DrawingTool,
): tool is Extract<DrawingTool, "pen" | "eraser"> {
  return tool === "pen" || tool === "eraser";
}

// TODO: Associate drawings with a video timestamp and a duration in seconds
// TODO: Decouple the drawing logic and types from this file to another file

export function UploadedVideoPlayer({
  file,
  onDurationChange,
  onTimeChange,
  videoRef,
}: UploadedVideoPlayerProps) {
  const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [containerRef, containerRect] = useResizeObserver<HTMLDivElement>();
  const [drawings, setDrawings] = useState<DrawingShape[]>([]);
  const [drawingColor, setDrawingColor] = useState("#df4b26");
  const [isDrawingModeEnabled, setIsDrawingModeEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const isDrawing = useRef(false);

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (!isDrawingModeEnabled) {
      return;
    }

    isDrawing.current = true;
    const position = event.target.getStage()?.getPointerPosition();

    if (!position) {
      return;
    }

    if (isFreehandTool(tool)) {
      setDrawings((currentDrawings) => [
        ...currentDrawings,
        {
          id: createDrawingId(),
          type: "freehand",
          color: drawingColor,
          points: [position.x, position.y],
          strokeWidth,
          tool,
        },
      ]);

      return;
    }

    if (tool === "rectangle") {
      setDrawings((currentDrawings) => [
        ...currentDrawings,
        {
          id: createDrawingId(),
          type: "rectangle",
          color: drawingColor,
          height: 0,
          strokeWidth,
          width: 0,
          x: position.x,
          y: position.y,
        },
      ]);

      return;
    }

    setDrawings((currentDrawings) => [
      ...currentDrawings,
      {
        id: createDrawingId(),
        type: "circle",
        color: drawingColor,
        radius: 0,
        strokeWidth,
        x: position.x,
        y: position.y,
      },
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

    setDrawings((currentDrawings) => {
      const lastDrawing = currentDrawings.at(-1);

      if (!lastDrawing) {
        return currentDrawings;
      }

      if (lastDrawing.type === "freehand") {
        return [
          ...currentDrawings.slice(0, -1),
          {
            ...lastDrawing,
            points: [...lastDrawing.points, point.x, point.y],
          },
        ];
      }

      if (lastDrawing.type === "rectangle") {
        return [
          ...currentDrawings.slice(0, -1),
          {
            ...lastDrawing,
            width: point.x - lastDrawing.x,
            height: point.y - lastDrawing.y,
          },
        ];
      }

      return [
        ...currentDrawings.slice(0, -1),
        {
          ...lastDrawing,
          radius: getDistance(lastDrawing, point),
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

  function handleUndoLastDrawing() {
    isDrawing.current = false;
    setDrawings((currentDrawings) => currentDrawings.slice(0, -1));
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isUndoKey = event.key.toLowerCase() === "z";
      const isModifierPressed = event.ctrlKey || event.metaKey;

      if (!isUndoKey || !isModifierPressed) {
        return;
      }

      event.preventDefault();
      handleUndoLastDrawing();
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
        <Stack gap="sm">
          <Text fw={600}>{file.name}</Text>
          <DrawingToolbar
            canUndo={drawings.length > 0}
            color={drawingColor}
            drawingModeEnabled={isDrawingModeEnabled}
            strokeWidth={strokeWidth}
            tool={tool}
            onColorChange={setDrawingColor}
            onDrawingModeChange={handleDrawingModeChange}
            onStrokeWidthChange={setStrokeWidth}
            onToolChange={setTool}
            onUndo={handleUndoLastDrawing}
          />
        </Stack>

        <AspectRatio ref={containerRef} pos="relative" ratio={16 / 9}>
          <video
            ref={videoRef}
            disablePictureInPicture
            controls
            preload="metadata"
            src={videoUrl}
            onLoadedMetadata={(event) =>
              onDurationChange?.(event.currentTarget.duration)
            }
            onTimeUpdate={(event) =>
              onTimeChange?.(event.currentTarget.currentTime)
            }
          />
          <Box
            pos="absolute"
            inset={0}
            style={{
              pointerEvents: isDrawingModeEnabled ? "auto" : "none",
            }}
          >
            <Stage
              height={containerRect.height}
              width={containerRect.width}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Layer>
                {drawings.map((drawing) => {
                  if (drawing.type === "freehand") {
                    return (
                      <Line
                        key={drawing.id}
                        points={drawing.points}
                        stroke={drawing.color}
                        strokeWidth={drawing.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={
                          drawing.tool === "eraser"
                            ? "destination-out"
                            : "source-over"
                        }
                      />
                    );
                  }

                  if (drawing.type === "rectangle") {
                    const rectangle = normalizeRect(drawing);

                    return (
                      <Rect
                        key={drawing.id}
                        height={rectangle.height}
                        stroke={drawing.color}
                        strokeWidth={drawing.strokeWidth}
                        width={rectangle.width}
                        x={rectangle.x}
                        y={rectangle.y}
                      />
                    );
                  }

                  return (
                    <Circle
                      key={drawing.id}
                      radius={drawing.radius}
                      stroke={drawing.color}
                      strokeWidth={drawing.strokeWidth}
                      x={drawing.x}
                      y={drawing.y}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </Box>
        </AspectRatio>
      </Stack>
    </Paper>
  );
}
