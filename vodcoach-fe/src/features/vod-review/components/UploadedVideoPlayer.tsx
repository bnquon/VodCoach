"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AspectRatio, Box, Paper, Stack } from "@mantine/core";
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
  createDrawingId,
  getCurrentVideoTime,
  isAnnotationVisible,
  isFreehandTool,
} from "../drawing/helpers";
import {
  DEFAULT_DRAWING_DURATION_SECONDS,
  DEFAULT_START_COLOR,
  DRAWING_SHAPE_TYPE,
  DRAWING_TOOL,
  type DrawingAnnotation,
  type DrawingShape,
  type DrawingTool,
} from "../drawing/types";
import { DrawingToolbar } from "./DrawingToolbar";

type UploadedVideoPlayerProps = {
  canDraw?: boolean;
  drawingAnnotations: DrawingAnnotation[];
  isTheatreMode: boolean;
  src: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onDurationChange?: (durationSeconds: number) => void;
  onSaveDrawingAnnotations: (
    drawingAnnotations: DrawingAnnotation[],
  ) => Promise<void>;
  onTheatreModeChange: (enabled: boolean) => void;
  onTimeChange?: (currentTimeSeconds: number) => void;
};

export function UploadedVideoPlayer({
  canDraw = true,
  drawingAnnotations,
  isTheatreMode,
  onDurationChange,
  onSaveDrawingAnnotations,
  onTheatreModeChange,
  onTimeChange,
  src,
  videoRef,
}: UploadedVideoPlayerProps) {
  const [containerRef, containerRect] = useResizeObserver<HTMLDivElement>();
  const [localDrawingAnnotations, setLocalDrawingAnnotations] = useState<
    DrawingAnnotation[]
  >([]);
  const [drawingColor, setDrawingColor] = useState(DEFAULT_START_COLOR);
  const [isDrawingModeEnabled, setIsDrawingModeEnabled] = useState(false);
  const [showDrawings, setShowDrawings] = useState(true);
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tool, setTool] = useState<DrawingTool>(DRAWING_TOOL.pen);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  const activeAnnotationId = useRef<string | null>(null);
  const isDrawing = useRef(false);
  const isSavingDrawings = useRef(false);

  const allDrawingAnnotations = [
    ...drawingAnnotations,
    ...localDrawingAnnotations,
  ];
  const visibleAnnotations = allDrawingAnnotations.filter((annotation) =>
    isAnnotationVisible(annotation, currentTimeSeconds),
  );

  const savePendingDrawingAnnotations = useCallback(async () => {
    if (
      isDrawing.current ||
      isSavingDrawings.current ||
      localDrawingAnnotations.length === 0
    ) {
      return;
    }

    const drawingsToSave = localDrawingAnnotations;
    const savedDrawingIDs = new Set(
      drawingsToSave.map((drawing) => drawing.id),
    );

    isSavingDrawings.current = true;
    try {
      await onSaveDrawingAnnotations(drawingsToSave);
      setLocalDrawingAnnotations((currentAnnotations) =>
        currentAnnotations.filter(
          (annotation) => !savedDrawingIDs.has(annotation.id),
        ),
      );
    } finally {
      isSavingDrawings.current = false;
    }
  }, [localDrawingAnnotations, onSaveDrawingAnnotations]);

  function handleMouseDown(event: KonvaEventObject<MouseEvent>) {
    if (!canDraw || !isDrawingModeEnabled) {
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
        type: DRAWING_SHAPE_TYPE.freehand,
        color: drawingColor,
        points: [normalizedPosition.x, normalizedPosition.y],
        strokeWidth,
        tool,
      };
    } else if (tool === DRAWING_TOOL.rectangle) {
      drawingShape = {
        id: shapeId,
        type: DRAWING_SHAPE_TYPE.rectangle,
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
        type: DRAWING_SHAPE_TYPE.circle,
        color: drawingColor,
        radius: 0,
        strokeWidth,
        x: normalizedPosition.x,
        y: normalizedPosition.y,
      };
    }

    setLocalDrawingAnnotations((currentAnnotations) => [
      ...currentAnnotations,
      {
        id: annotationId,
        timestampSeconds: getCurrentVideoTime(videoRef.current),
        durationSeconds: DEFAULT_DRAWING_DURATION_SECONDS,
        drawingJson: [drawingShape],
      },
    ]);
  }

  function handleMouseMove(event: KonvaEventObject<MouseEvent>) {
    if (!canDraw || !isDrawingModeEnabled || !isDrawing.current) {
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

    setLocalDrawingAnnotations((currentAnnotations) =>
      currentAnnotations.map((annotation) => {
        if (annotation.id !== activeAnnotationId.current) {
          return annotation;
        }

        const [drawing] = annotation.drawingJson;

        if (!drawing) {
          return annotation;
        }

        if (drawing.type === DRAWING_SHAPE_TYPE.freehand) {
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

        if (drawing.type === DRAWING_SHAPE_TYPE.rectangle) {
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

  function handleTimeUpdate(video: HTMLVideoElement) {
    setCurrentTimeSeconds(video.currentTime);
    onTimeChange?.(video.currentTime);
  }

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

  useEffect(() => {
    if (localDrawingAnnotations.length === 0) {
      return;
    }

    const timeoutID = window.setTimeout(() => {
      void savePendingDrawingAnnotations().catch(() => {});
    }, 1000);

    return () => {
      window.clearTimeout(timeoutID);
    };
  }, [localDrawingAnnotations, savePendingDrawingAnnotations]);

  return (
    <Paper className="vc-elevated-card" p="md" radius="md">
      <Stack gap="sm">
        <Stack gap="sm">
          <DrawingToolbar
            canDraw={canDraw}
            color={drawingColor}
            drawingModeEnabled={canDraw ? isDrawingModeEnabled : false}
            isTheatreMode={isTheatreMode}
            showDrawings={showDrawings}
            strokeWidth={strokeWidth}
            tool={tool}
            onColorChange={setDrawingColor}
            onDrawingModeChange={handleDrawingModeChange}
            onShowDrawingsChange={setShowDrawings}
            onStrokeWidthChange={setStrokeWidth}
            onTheatreModeChange={onTheatreModeChange}
            onToolChange={setTool}
          />
        </Stack>

        <AspectRatio ref={containerRef} pos="relative" ratio={16 / 9}>
          <video
            ref={videoRef}
            disablePictureInPicture
            controls
            preload="metadata"
            src={src}
            onLoadedMetadata={(event) =>
              onDurationChange?.(event.currentTarget.duration)
            }
            onTimeUpdate={(event) => handleTimeUpdate(event.currentTarget)}
          />
          <Box
            pos="absolute"
            inset={0}
            style={{
              pointerEvents: canDraw && isDrawingModeEnabled ? "auto" : "none",
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
                {showDrawings
                  ? visibleAnnotations.flatMap((annotation) =>
                      annotation.drawingJson.map((drawing) => {
                        if (drawing.type === DRAWING_SHAPE_TYPE.freehand) {
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
                                drawing.tool === DRAWING_TOOL.eraser
                                  ? "destination-out"
                                  : "source-over"
                              }
                            />
                          );
                        }

                        if (drawing.type === DRAWING_SHAPE_TYPE.rectangle) {
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
                    )
                  : null}
              </Layer>
            </Stage>
          </Box>
        </AspectRatio>
      </Stack>
    </Paper>
  );
}
