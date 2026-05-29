import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { CharacterPicker } from '../components/landing/CharacterPicker';
import { joinLobby } from '../lib/socket';
import { saveSession } from '../store/session';
import { usePlayerStore } from '../store/usePlayerStore';
import { useRoomStore } from '../store/useRoomStore';
import { useGameStore } from '../store/useGameStore';
import type { CharacterId } from '../types';

export function Landing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomFromUrl = searchParams.get('room')?.toUpperCase() ?? '';

  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState(roomFromUrl);
  const [characterId, setCharacterId] = useState<CharacterId | null>(null);
  const [loading, setLoading] = useState(false);

  const canPlay = name.trim().length > 0 && characterId !== null;

  const formatRoomCode = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return cleaned.slice(0, 9);
  };

  const handlePlay = async () => {
    if (!canPlay || !characterId) {
      toast.error('Pick a name and character first!');
      return;
    }

    setLoading(true);
    try {
      const ack = await joinLobby({
        name: name.trim(),
        characterId,
        roomCode: roomCode.trim() || undefined,
      });

      if ('error' in ack) {
        toast.error(ack.error);
        return;
      }

      saveSession({
        name: name.trim(),
        characterId,
        roomCode: ack.roomCode,
        playerId: ack.playerId,
      });

      usePlayerStore.getState().setName(name.trim());
      usePlayerStore.getState().setCharacterId(characterId);
      usePlayerStore.getState().setPlayerId(ack.playerId);
      useRoomStore.getState().setRoomCode(ack.roomCode);
      useRoomStore.getState().setPlayers(ack.players);
      useRoomStore.getState().setIsHost(ack.isHost);
      useRoomStore.getState().setHostId(ack.hostId);
      useRoomStore.getState().setTotalRounds(ack.totalRounds);
      useGameStore.getState().setPhase(ack.phase);
      useGameStore.getState().setTotalRounds(ack.totalRounds);

      if (ack.phase === 'playing' || ack.phase === 'scoreboard') {
        navigate(`/game?room=${ack.roomCode}`);
      } else {
        navigate(`/lobby?room=${ack.roomCode}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-secondary via-accent-pink to-accent-yellow">
      <Toaster position="top-center" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <span className="absolute left-[10%] top-[15%] text-6xl animate-float">✏️</span>
        <span className="absolute right-[15%] top-[25%] text-5xl animate-float-slow">🎨</span>
        <span className="absolute left-[20%] bottom-[20%] text-5xl animate-float">⭐</span>
        <span className="absolute right-[25%] bottom-[30%] text-6xl animate-float-slow">🏆</span>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <h1 className="font-logo text-6xl text-white drop-shadow-lg md:text-7xl">DOODLASH</h1>
        <p className="mt-2 text-xl font-semibold text-white/90">
          Draw it. Guess it. Win it.
        </p>

        <div className="mt-10 w-full max-w-lg space-y-4">
          <input
            type="text"
            placeholder="Your name"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border-2 border-primary bg-white/95 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="Room code (optional)"
            value={roomCode}
            onChange={(e) => setRoomCode(formatRoomCode(e.target.value))}
            className="w-full rounded-xl border-2 border-primary/50 bg-white/90 px-4 py-3 text-lg font-mono uppercase outline-none focus:ring-2 focus:ring-primary"
          />

          <CharacterPicker selected={characterId} onSelect={setCharacterId} />

          <button
            type="button"
            onClick={handlePlay}
            disabled={!canPlay || loading}
            title={!canPlay ? 'Pick a name and character first!' : undefined}
            className="animate-bounce-btn w-full rounded-2xl bg-gradient-to-r from-primary to-accent-pink py-4 text-xl font-extrabold text-white shadow-xl transition disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400"
          >
            {loading ? 'Joining...' : "LET'S PLAY!"}
          </button>
        </div>
      </div>
    </div>
  );
}
