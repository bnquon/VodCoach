import {
  DRAWING_TOOL,
  type DrawingAnnotation,
  type DrawingTool,
  type FreehandTool,
} from "./types";

export function createDrawingId() {
  return crypto.randomUUID();
}

export function isFreehandTool(tool: DrawingTool): tool is FreehandTool {
  return tool === DRAWING_TOOL.pen || tool === DRAWING_TOOL.eraser;
}

export function getCurrentVideoTime(video: HTMLVideoElement | null) {
  return video ? Math.floor(video.currentTime) : 0;
}

export function isAnnotationVisible(
  annotation: DrawingAnnotation,
  currentTime: number,
) {
  return (
    currentTime >= annotation.timestampSeconds &&
    currentTime <= annotation.timestampSeconds + annotation.durationSeconds
  );
}
