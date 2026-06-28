export const DRAWING_TOOL = {
  pen: "pen",
  rectangle: "rectangle",
  circle: "circle",
  eraser: "eraser",
} as const;

export type DrawingTool = (typeof DRAWING_TOOL)[keyof typeof DRAWING_TOOL];

export type FreehandTool = typeof DRAWING_TOOL.pen | typeof DRAWING_TOOL.eraser;

export const DRAWING_SHAPE_TYPE = {
  freehand: "freehand",
  rectangle: "rectangle",
  circle: "circle",
} as const;

export type FreehandDrawing = {
  id: string;
  type: typeof DRAWING_SHAPE_TYPE.freehand;
  color: string;
  points: number[];
  strokeWidth: number;
  tool: FreehandTool;
};

export type RectangleDrawing = {
  id: string;
  type: typeof DRAWING_SHAPE_TYPE.rectangle;
  color: string;
  height: number;
  strokeWidth: number;
  width: number;
  x: number;
  y: number;
};

export type CircleDrawing = {
  id: string;
  type: typeof DRAWING_SHAPE_TYPE.circle;
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
export const DEFAULT_START_COLOR = "#df4b26";
