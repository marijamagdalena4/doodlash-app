import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  drawStroke,
  redrawCanvas,
  scalePoint,
} from '../../lib/canvasUtils';
import {
  emitCanvasFill,
  emitStroke,
  emitEmoji,
} from '../../hooks/useSocket';
import { getSocket } from '../../lib/socket';
import { useGameStore } from '../../store/useGameStore';
import type { Stroke, StrokePoint } from '../../types';

const EMOJIS = ['😂', '😱', '🔥', '👏'];

interface Props {
  isDrawer: boolean;
  brushSize: number;
  color: string;
  tool: 'brush' | 'eraser' | 'fill';
  localStrokes: Stroke[];
  setLocalStrokes: React.Dispatch<React.SetStateAction<Stroke[]>>;
}

export function DrawingCanvas({
  isDrawer,
  brushSize,
  color,
  tool,
  localStrokes,
  setLocalStrokes,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokes = useGameStore((s) => s.strokes);
  const showReplay = useGameStore((s) => s.showReplay);
  const drawerId = useGameStore((s) => s.drawerId);

  const [currentPoints, setCurrentPoints] = useState<StrokePoint[]>([]);
  const [wiping, setWiping] = useState(false);
  const [floatEmojis, setFloatEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const drawingRef = useRef(false);
  const prevDrawerRef = useRef(drawerId);

  const activeStrokes = isDrawer ? localStrokes : strokes;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    redrawCanvas(ctx, activeStrokes);
    if (currentPoints.length > 0 && isDrawer) {
      drawStroke(ctx, {
        points: currentPoints,
        color,
        size: brushSize,
        tool: tool === 'eraser' ? 'eraser' : 'brush',
      });
    }
  }, [activeStrokes, currentPoints, isDrawer, color, brushSize, tool]);

  useEffect(() => {
    paint();
  }, [paint]);

  useEffect(() => {
    if (!isDrawer) {
      paint();
    }
  }, [strokes, isDrawer, paint]);

  useEffect(() => {
    if (prevDrawerRef.current !== drawerId) {
      setWiping(true);
      setCurrentPoints([]);
      const t = setTimeout(() => setWiping(false), 600);
      prevDrawerRef.current = drawerId;
      return () => clearTimeout(t);
    }
  }, [drawerId]);

  useEffect(() => {
    if (!showReplay) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const all = strokes;
    if (all.length === 0) return;

    let i = 0;
    const interval = setInterval(() => {
      redrawCanvas(ctx, all.slice(0, i + 1));
      i++;
      if (i >= all.length) clearInterval(interval);
    }, Math.max(20, 2000 / all.length));

    return () => clearInterval(interval);
  }, [showReplay, strokes]);

  useEffect(() => {
    const socket = getSocket();
    const handler = ({ emoji }: { emoji: string }) => {
      const id = Date.now() + Math.random();
      setFloatEmojis((prev) => [
        ...prev,
        { id, emoji, x: 20 + Math.random() * 60 },
      ]);
      setTimeout(() => {
        setFloatEmojis((prev) => prev.filter((e) => e.id !== id));
      }, 2000);
    };
    socket.on('emoji_reaction', handler);
    return () => {
      socket.off('emoji_reaction', handler);
    };
  }, []);

  const finishStroke = (points: StrokePoint[]) => {
    if (points.length < 2) return;
    const stroke: Stroke = {
      points,
      color,
      size: brushSize,
      tool: tool === 'eraser' ? 'eraser' : 'brush',
    };
    setLocalStrokes((prev) => {
      const next = [...prev, stroke].slice(-20);
      return next;
    });
    emitStroke(stroke);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isDrawer) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = scalePoint(e.clientX, e.clientY, rect);

    if (tool === 'fill') {
      const fillStroke: Stroke = {
        points: [],
        color,
        size: 0,
        tool: 'fill',
        fillData: { x, y, color },
      };
      setLocalStrokes((prev) => [...prev, fillStroke]);
      emitCanvasFill(fillStroke);
      return;
    }

    drawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setCurrentPoints([{ x, y }]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawer || !drawingRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const { x, y } = scalePoint(e.clientX, e.clientY, rect);
    setCurrentPoints((prev) => [...prev, { x, y }]);
  };

  const handlePointerUp = () => {
    if (!isDrawer || !drawingRef.current) return;
    drawingRef.current = false;
    if (currentPoints.length >= 2) {
      finishStroke(currentPoints);
    }
    setCurrentPoints([]);
  };

  return (
    <div className="relative w-full">
      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`w-full touch-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        {wiping && (
          <div className="pointer-events-none absolute inset-0 bg-white animate-canvas-wipe" />
        )}
        {floatEmojis.map((e) => (
          <span
            key={e.id}
            className="pointer-events-none absolute bottom-4 animate-emoji-float text-3xl"
            style={{ left: `${e.x}%` }}
          >
            {e.emoji}
          </span>
        ))}
      </div>
      {!isDrawer && (
        <div className="mt-2 flex justify-center gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => emitEmoji(emoji)}
              className="rounded-full bg-bg-card px-3 py-1 text-xl shadow transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
