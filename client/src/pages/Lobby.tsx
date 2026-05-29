import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { PlayerSlot } from '../components/lobby/PlayerSlot';
import {
  emitReady,
  emitSetRounds,
  emitStartGame,
  tryRejoin,
} from '../hooks/useSocket';
import { loadSession } from '../store/session';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRoomStore } from '../store/useRoomStore';
import { connectSocket, getSocket } from '../lib/socket';

const SLOTS = 6;
const ROUND_OPTIONS = [3, 5, 7] as const;

export function Lobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get('room')?.toUpperCase() ?? '';

  const roomCode = useRoomStore((s) => s.roomCode);
  const players = useRoomStore((s) => s.players);
  const isHost = useRoomStore((s) => s.isHost);
  const totalRounds = useRoomStore((s) => s.totalRounds);
  const playerId = usePlayerStore((s) => s.playerId);
  const [ready, setReady] = useState(false);
  const [rejoining, setRejoining] = useState(true);

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
        const me = ack.players.find((p) => p.id === ack.playerId);
        setReady(me?.ready ?? false);

        if (ack.phase === 'playing' || ack.phase === 'scoreboard') {
          navigate(`/game?room=${ack.roomCode}`, { replace: true });
        }
      }
      setRejoining(false);
    };
    init();
  }, [navigate, roomFromUrl]);

  useEffect(() => {
    const socket = getSocket();
    const onGameStarting = () => navigate(`/game?room=${roomCode}`);
    socket.on('game_starting', onGameStarting);
    return () => {
      socket.off('game_starting', onGameStarting);
    };
  }, [navigate, roomCode]);

  const toggleReady = () => {
    const next = !ready;
    setReady(next);
    emitReady(next);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/lobby?room=${roomCode}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied!');
  };

  const allReady =
    players.length >= 2 && players.every((p) => p.ready);
  const canStart = isHost && allReady;

  const slots = Array.from({ length: SLOTS }, (_, i) => players[i]);

  if (rejoining) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-game">
        <p className="text-lg font-bold text-primary">Rejoining room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-game px-4 py-8">
      <Toaster position="top-center" />
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="font-logo text-4xl text-primary">Waiting Room</h1>
          <p className="mt-2 font-mono text-2xl font-bold text-secondary">{roomCode}</p>
          <p className="text-text-muted">{players.length} / 6 players</p>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {slots.map((player, i) => (
            <PlayerSlot
              key={player?.id ?? `empty-${i}`}
              player={player}
              isSelf={player?.id === playerId}
              slotIndex={i}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-xl border-2 border-primary bg-white px-6 py-3 font-bold text-primary hover:bg-primary/5"
          >
            Copy Share Link
          </button>
          <button
            type="button"
            onClick={toggleReady}
            className={`rounded-xl px-6 py-3 font-bold text-white ${
              ready ? 'bg-text-muted' : 'bg-success'
            }`}
          >
            {ready ? 'Not Ready' : 'Ready!'}
          </button>
        </div>

        {isHost && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <div>
              <span className="mr-2 font-bold text-text-muted">Rounds:</span>
              <div className="inline-flex rounded-lg border-2 border-primary overflow-hidden">
                {ROUND_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => emitSetRounds(n)}
                    className={`px-4 py-2 font-bold ${
                      totalRounds === n
                        ? 'bg-primary text-white'
                        : 'bg-white text-primary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => emitStartGame()}
              disabled={!canStart}
              className="rounded-xl bg-gradient-to-r from-primary to-accent-pink px-10 py-3 text-lg font-extrabold text-white shadow-lg disabled:opacity-50"
            >
              Start Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
