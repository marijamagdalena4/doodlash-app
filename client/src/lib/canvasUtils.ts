import type { Stroke } from '../types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 540;

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.tool === 'fill' && stroke.fillData) {
    floodFill(ctx, stroke.fillData.x, stroke.fillData.y, stroke.fillData.color);
    return;
  }

  const { points, color, size, tool } = stroke;
  if (points.length === 0) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size;
  ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
  ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

export function redrawCanvas(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  strokes.forEach((s) => drawStroke(ctx, s));
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: string
): void {
  const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const data = imageData.data;
  const startIdx = (Math.floor(startY) * CANVAS_WIDTH + Math.floor(startX)) * 4;
  const startR = data[startIdx];
  const startG = data[startIdx + 1];
  const startB = data[startIdx + 2];
  const startA = data[startIdx + 3];

  const fill = hexToRgb(fillColor);
  if (!fill) return;
  if (
    startR === fill.r &&
    startG === fill.g &&
    startB === fill.b &&
    startA === 255
  ) {
    return;
  }

  const stack: [number, number][] = [[Math.floor(startX), Math.floor(startY)]];
  const visited = new Uint8Array(CANVAS_WIDTH * CANVAS_HEIGHT);

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= CANVAS_WIDTH || y >= CANVAS_HEIGHT) continue;
    const vi = y * CANVAS_WIDTH + x;
    if (visited[vi]) continue;

    const idx = vi * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a === 0) continue;
    if (r !== startR || g !== startG || b !== startB) continue;

    visited[vi] = 1;
    data[idx] = fill.r;
    data[idx + 1] = fill.g;
    data[idx + 2] = fill.b;
    data[idx + 3] = 255;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  ctx.putImageData(imageData, 0, 0);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace('#', '');
  if (h.length !== 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function scalePoint(
  x: number,
  y: number,
  rect: DOMRect
): { x: number; y: number } {
  return {
    x: (x - rect.left) * (CANVAS_WIDTH / rect.width),
    y: (y - rect.top) * (CANVAS_HEIGHT / rect.height),
  };
}
