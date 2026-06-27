import type { NormalizedRect, Point, RectangleDrawing } from "./types";

export function getDistance(start: Point, end: Point) {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

export function getScaleBase(width: number, height: number) {
  return Math.max(1, Math.min(width, height));
}

export function normalizePoint(
  point: Point,
  width: number,
  height: number,
): Point {
  return {
    x: point.x / Math.max(1, width),
    y: point.y / Math.max(1, height),
  };
}

export function denormalizePoint(
  point: Point,
  width: number,
  height: number,
): Point {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

export function denormalizePoints(
  points: number[],
  width: number,
  height: number,
) {
  return points.map((point, index) =>
    index % 2 === 0 ? point * width : point * height,
  );
}

export function normalizeRect(rectangle: RectangleDrawing): NormalizedRect {
  return {
    x: Math.min(rectangle.x, rectangle.x + rectangle.width),
    y: Math.min(rectangle.y, rectangle.y + rectangle.height),
    width: Math.abs(rectangle.width),
    height: Math.abs(rectangle.height),
  };
}
