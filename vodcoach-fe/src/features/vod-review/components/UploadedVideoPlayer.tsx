"use client";

import { useEffect, useRef, useState } from "react";
import { AspectRatio, Box, Paper, Stack, Text } from "@mantine/core";
import { useResizeObserver } from "@mantine/hooks";
import type { KonvaEventObject } from "konva/lib/Node";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import {
  denormalizePoint,
  denormalizePoints,
  getDistance,
  getScaleBase,
  normalizePoint,
  normalizeRect,
} from "../drawing/geometry";
import {
  DEFAULT_DRAWING_DURATION_SECONDS,
  type DrawingAnnotation,
  type DrawingShape,
} from "../drawing/types";
import { DrawingToolbar, type DrawingTool } from "./DrawingToolbar";

type UploadedVideoPlayerProps = {
  isTheatreMode: boolean;
  src: string;
  title: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDurationChange?: (durationSeconds: number) => void;
  onTheatreModeChange: (enabled: boolean) => void;
  onTimeChange?: (currentTimeSeconds: number) => void;
};

function createDrawingId() {
  return crypto.randomUUID();
}

function isFreehandTool(
  tool: DrawingTool,
): tool is Extract<DrawingTool, "pen" | "eraser"> {
  return tool === "pen" || tool === "eraser";
}

function getCurrentVideoTime(video: HTMLVideoElement | null) {
  return video ? Math.floor(video.currentTime) : 0;
}

function isAnnotationVisible(
  annotation: DrawingAnnotation,
  currentTime: number,
) {
  return (
    currentTime >= annotation.timestampSeconds &&
    currentTime <= annotation.timestampSeconds + annotation.durationSeconds
  );
}

export function UploadedVideoPlayer({
  isTheatreMode,
  onDurationChange,
  onTheatreModeChange,
  onTimeChange,
  src,
  title,
  videoRef,
}: UploadedVideoPlayerProps) {
  const [containerRef, containerRect] = useResizeObserver<HTMLDivElement>();
  const [drawingAnnotations, setDrawingAnnotations] = useState<
    DrawingAnnotation[]
  >([]);
  const [drawingColor, setDrawingColor] = useState("#df4b26");
  const [isDrawingModeEnabled, setIsDrawingModeEnabled] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tool, setTool] = useState<DrawingTool>("pen");
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const activeAnnotationId = useRef<string | null>(null);
  const isDrawing = useRef(false);

  const visibleAnnotations = drawingAnnotations.filter((annotation) =>
    isAnnotationVisible(annotation, currentTimeSeconds),
  );

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (!isDrawingModeEnabled) {
      return;
    }

    isDrawing.current = true;
    const position = event.target.getStage()?.getPointerPosition();
    const normalizedPosition = position
      ? normalizePoint(position, containerRect.width, containerRect.height)
      : null;

    if (!normalizedPosition) {
      return;
    }

    const shapeId = createDrawingId();
    const annotationId = createDrawingId();
    activeAnnotationId.current = annotationId;

    let drawingShape: DrawingShape;

    if (isFreehandTool(tool)) {
      drawingShape = {
        id: shapeId,
        type: "freehand",
        color: drawingColor,
        points: [normalizedPosition.x, normalizedPosition.y],
        strokeWidth,
        tool,
      };
    } else if (tool === "rectangle") {
      drawingShape = {
        id: shapeId,
        type: "rectangle",
        color: drawingColor,
        height: 0,
        strokeWidth,
        width: 0,
        x: normalizedPosition.x,
        y: normalizedPosition.y,
      };
    } else {
      drawingShape = {
        id: shapeId,
        type: "circle",
        color: drawingColor,
        radius: 0,
        strokeWidth,
        x: normalizedPosition.x,
        y: normalizedPosition.y,
      };
    }

    setDrawingAnnotations((currentAnnotations) => [
      ...currentAnnotations,
      {
        id: annotationId,
        timestampSeconds: getCurrentVideoTime(videoRef.current),
        durationSeconds: DEFAULT_DRAWING_DURATION_SECONDS,
        drawingJson: [drawingShape],
      },
    ]);
    console.log(drawingAnnotations);
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (!isDrawingModeEnabled || !isDrawing.current) {
      return;
    }

    const stage = event.target.getStage();
    const point = stage?.getPointerPosition();
    const normalizedPoint = point
      ? normalizePoint(point, containerRect.width, containerRect.height)
      : null;

    if (!point || !normalizedPoint || !activeAnnotationId.current) {
      return;
    }

    setDrawingAnnotations((currentAnnotations) =>
      currentAnnotations.map((annotation) => {
        if (annotation.id !== activeAnnotationId.current) {
          return annotation;
        }

        const [drawing] = annotation.drawingJson;

        if (!drawing) {
          return annotation;
        }

        if (drawing.type === "freehand") {
          return {
            ...annotation,
            drawingJson: [
              {
                ...drawing,
                points: [
                  ...drawing.points,
                  normalizedPoint.x,
                  normalizedPoint.y,
                ],
              },
            ],
          };
        }

        if (drawing.type === "rectangle") {
          return {
            ...annotation,
            drawingJson: [
              {
                ...drawing,
                width: normalizedPoint.x - drawing.x,
                height: normalizedPoint.y - drawing.y,
              },
            ],
          };
        }

        return {
          ...annotation,
          drawingJson: [
            {
              ...drawing,
              radius:
                getDistance(
                  denormalizePoint(
                    drawing,
                    containerRect.width,
                    containerRect.height,
                  ),
                  point,
                ) / getScaleBase(containerRect.width, containerRect.height),
            },
          ],
        };
      }),
    );
  }

  function handleMouseUp() {
    isDrawing.current = false;
    activeAnnotationId.current = null;
  }

  function handleDrawingModeChange(checked: boolean) {
    setIsDrawingModeEnabled(checked);
    isDrawing.current = false;
    activeAnnotationId.current = null;
  }

  function handleUndoLastDrawing() {
    isDrawing.current = false;
    activeAnnotationId.current = null;
    setDrawingAnnotations((currentAnnotations) =>
      currentAnnotations.slice(0, -1),
    );
  }

  function handleTimeUpdate(video: HTMLVideoElement) {
    setCurrentTimeSeconds(video.currentTime);
    onTimeChange?.(video.currentTime);
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
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.src = src;
    video.load();

    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [src, videoRef]);

  return (
    <Paper withBorder p="md" radius="md">
      <Stack gap="sm">
        <Stack gap="sm">
          <Text fw={600}>{title}</Text>
          <DrawingToolbar
            canUndo={drawingAnnotations.length > 0}
            color={drawingColor}
            drawingModeEnabled={isDrawingModeEnabled}
            isTheatreMode={isTheatreMode}
            strokeWidth={strokeWidth}
            tool={tool}
            onColorChange={setDrawingColor}
            onDrawingModeChange={handleDrawingModeChange}
            onStrokeWidthChange={setStrokeWidth}
            onTheatreModeChange={onTheatreModeChange}
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
            onLoadedMetadata={(event) =>
              onDurationChange?.(event.currentTarget.duration)
            }
            onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
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
                {visibleAnnotations.flatMap((annotation) =>
                  annotation.drawingJson.map((drawing) => {
                    if (drawing.type === "freehand") {
                      return (
                        <Line
                          key={drawing.id}
                          points={denormalizePoints(
                            drawing.points,
                            containerRect.width,
                            containerRect.height,
                          )}
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
                          height={rectangle.height * containerRect.height}
                          stroke={drawing.color}
                          strokeWidth={drawing.strokeWidth}
                          width={rectangle.width * containerRect.width}
                          x={rectangle.x * containerRect.width}
                          y={rectangle.y * containerRect.height}
                        />
                      );
                    }

                    return (
                      <Circle
                        key={drawing.id}
                        radius={
                          drawing.radius *
                          getScaleBase(
                            containerRect.width,
                            containerRect.height,
                          )
                        }
                        stroke={drawing.color}
                        strokeWidth={drawing.strokeWidth}
                        x={drawing.x * containerRect.width}
                        y={drawing.y * containerRect.height}
                      />
                    );
                  }),
                )}
              </Layer>
            </Stage>
          </Box>
        </AspectRatio>
      </Stack>
    </Paper>
  );
}
