import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DrawingCanvas } from '../components/canvas/DrawingCanvas';
import { ColorPicker } from '../components/canvas/ColorPicker';
import { ToolBar } from '../components/canvas/ToolBar';
import { ChatBox } from '../components/chat/ChatBox';
import { GuessInput } from '../components/chat/GuessInput';
import { PlayerList } from '../components/game/PlayerList';
import { Timer } from '../components/game/Timer';
import { WordHint } from '../components/game/WordHint';
import { Scoreboard } from '../components/shared/Scoreboard';
import {
  emitCanvasClear,
  emitCanvasUndo,
  tryRejoin,
} from '../hooks/useSocket';
import { loadSession } from '../store/session';
import { useGameStore } from '../store/useGameStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRoomStore } from '../store/useRoomStore';
import { connectSocket, getSocket } from '../lib/socket';
import type { Stroke } from '../types';

export function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get('room')?.toUpperCase() ?? '';

  const roomCode = useRoomStore((s) => s.roomCode);
  const players = useRoomStore((s) => s.players);
  const playerId = usePlayerStore((s) => s.playerId);
  const drawerId = useGameStore((s) => s.drawerId);
  const round = useGameStore((s) => s.round);
  const totalRounds = useGameStore((s) => s.totalRounds);
  const muted = useGameStore((s) => s.muted);
  const setMuted = useGameStore((s) => s.setMuted);
  const phase = useGameStore((s) => s.phase);

  const [brushSize, setBrushSize] = useState(12);
  const [color, setColor] = useState('#000000');
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);
  const [rejoining, setRejoining] = useState(true);

  const isDrawer = drawerId === playerId;
  const drawerName = players.find((p) => p.id === drawerId)?.name ?? 'Someone';

  useEffect(() => {
    const init = async () => {
      const session = loadSession();
      if (!session && roomFromUrl) {
        navigate(`/?room=${roomFromUrl}`, { replace: true });
        return;
      }
      connectSocket();
      if (session) {
        const ack = await tryRejoin();
        if (!ack) {
          navigate(`/?room=${roomFromUrl || session.roomCode}`, { replace: true });
          return;
        }
        if (ack.phase === 'lobby') {
          navigate(`/lobby?room=${ack.roomCode}`, { replace: true });
        }
      }
      setRejoining(false);
    };
    init();
  }, [navigate, roomFromUrl]);

  useEffect(() => {
    const socket = getSocket();
    const goLobby = () => navigate(`/lobby?room=${roomCode}`);
    socket.on('return_to_lobby', goLobby);
    socket.on('game_starting', () => {});
    return () => {
      socket.off('return_to_lobby', goLobby);
    };
  }, [navigate, roomCode]);

  useEffect(() => {
    setLocalStrokes([]);
  }, [drawerId]);

  const handleUndo = () => {
    const next = localStrokes.slice(0, -1);
    setLocalStrokes(next);
    emitCanvasUndo(next);
  };

  const handleClear = () => {
    if (!confirm('Clear the canvas?')) return;
    setLocalStrokes([]);
    emitCanvasClear();
  };

  if (rejoining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-game">
        <p className="text-lg font-bold text-primary">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-game">
      <div className="fixed top-0 left-0 right-0 z-10 bg-danger/90 py-1 text-center text-sm text-white md:hidden">
        Best played on desktop
      </div>

      <header className="flex items-center justify-between border-b border-primary/20 bg-bg-card px-4 py-2">
        <span className="font-logo text-xl text-primary">DOODLASH</span>
        <span className="font-mono font-bold text-secondary">{roomCode}</span>
        <span className="text-sm font-bold">
          Round {round} / {totalRounds}
        </span>
        <button
          type="button"
          onClick={() => setMuted(!muted)}
          className="rounded-lg bg-gray-100 px-2 py-1 text-lg"
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[200px]">
          <PlayerList />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col gap-3">
          <WordHint />
          <DrawingCanvas
            isDrawer={isDrawer}
            brushSize={brushSize}
            color={color}
            tool={tool}
            localStrokes={localStrokes}
            setLocalStrokes={setLocalStrokes}
          />
          <ChatBox />
          <GuessInput />
        </main>

        <aside className="w-full shrink-0 lg:w-[200px]">
          <div className="rounded-xl bg-bg-card p-4 shadow-md">
            <p className="text-center text-lg font-extrabold text-accent-pink">
              ✏️ {drawerName} is drawing!
            </p>
            {!isDrawer && (
              <p className="mt-1 text-center text-sm text-text-muted">
                🔍 Guess the word!
              </p>
            )}
            <div className="my-4">
              <Timer />
            </div>
            {isDrawer && phase === 'playing' && (
              <div className="space-y-4 border-t pt-4">
                <ToolBar
                  brushSize={brushSize}
                  tool={tool}
                  onBrushSize={setBrushSize}
                  onTool={setTool}
                  onUndo={handleUndo}
                  onClear={handleClear}
                  canUndo={localStrokes.length > 0}
                />
                <ColorPicker color={color} onChange={setColor} />
              </div>
            )}
          </div>
        </aside>
      </div>

      <Scoreboard />
    </div>
  );
}
