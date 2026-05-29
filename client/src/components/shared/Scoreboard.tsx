import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { AvatarIcon } from './AvatarIcon';
import { emitPlayAgain } from '../../hooks/useSocket';
import { useGameStore } from '../../store/useGameStore';
import { useRoomStore } from '../../store/useRoomStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { CharacterId } from '../../types';

const MEDALS = ['🥇', '🥈', '🥉'];

export function Scoreboard() {
  const showScoreboard = useGameStore((s) => s.showScoreboard);
  const phase = useGameStore((s) => s.phase);
  const finalScores = useGameStore((s) => s.finalScores);
  const lastWord = useGameStore((s) => s.lastWord);
  const players = useRoomStore((s) => s.players);
  const isHost = useRoomStore((s) => s.isHost);
  const isFinal = phase === 'ended';
  const sorted = isFinal
    ? finalScores
    : [...players].sort((a, b) => b.score - a.score);

  useEffect(() => {
    if (isFinal && showScoreboard) {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [isFinal, showScoreboard]);

  if (!showScoreboard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md animate-[slideUp_0.3s_ease-out] rounded-2xl bg-bg-card p-6 shadow-2xl">
        <h2 className="mb-2 text-center font-logo text-3xl text-primary">
          {isFinal ? 'FINAL SCORES' : 'Round Scores'}
        </h2>
        {!isFinal && lastWord && (
          <p className="mb-4 text-center text-lg font-bold text-secondary">
            The word was: {lastWord.toUpperCase()}
          </p>
        )}
        <ul className="space-y-3">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-bg-game px-3 py-2"
            >
              <span className="text-2xl">{MEDALS[i] ?? `#${i + 1}`}</span>
              <AvatarIcon characterId={p.characterId as CharacterId} size={40} />
              <div className="flex-1">
                <div className="font-bold">{p.name}</div>
                {!isFinal && 'roundScore' in p && (
                  <div className="text-sm text-success">+{(p as { roundScore: number }).roundScore} pts</div>
                )}
              </div>
              <div className="text-xl font-extrabold text-primary">{p.score}</div>
            </li>
          ))}
        </ul>
        {isFinal && isHost && (
          <button
            type="button"
            onClick={() => emitPlayAgain()}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-primary to-accent-pink py-3 font-bold text-white shadow-lg hover:opacity-90"
          >
            Play Again
          </button>
        )}
        {isFinal && !isHost && (
          <p className="mt-4 text-center text-sm text-text-muted">
            Waiting for host to start again...
          </p>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
