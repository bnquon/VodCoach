import type { DrawingTool } from "../components/DrawingToolbar";

export type FreehandDrawing = {
  id: string;
  type: "freehand";
  color: string;
  points: number[];
  strokeWidth: number;
  tool: Extract<DrawingTool, "pen" | "eraser">;
};

export type RectangleDrawing = {
  id: string;
  type: "rectangle";
  color: string;
  height: number;
  strokeWidth: number;
  width: number;
  x: number;
  y: number;
};

export type CircleDrawing = {
  id: string;
  type: "circle";
  color: string;
  radius: number;
  strokeWidth: number;
  x: number;
  y: number;
};

export type DrawingShape = FreehandDrawing | RectangleDrawing | CircleDrawing;

export type DrawingAnnotation = {
  id: string;
  timestampSeconds: number;
  durationSeconds: number;
  drawingJson: DrawingShape[];
};

export type Point = {
  x: number;
  y: number;
};

export type NormalizedRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export const DEFAULT_DRAWING_DURATION_SECONDS = 3;
