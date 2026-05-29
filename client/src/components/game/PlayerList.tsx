import clsx from 'clsx';
import { AvatarIcon } from '../shared/AvatarIcon';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useRoomStore } from '../../store/useRoomStore';

export function PlayerList() {
  const players = useRoomStore((s) => s.players);
  const playerId = usePlayerStore((s) => s.playerId);
  const drawerId = useGameStore((s) => s.drawerId);
  const guessedIds = useGameStore((s) => s.guessedIds);

  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold uppercase text-text-muted">Players</h3>
      {sorted.map((p, i) => (
        <div
          key={p.id}
          className={clsx(
            'flex items-center gap-2 rounded-lg px-2 py-2 transition-colors',
            p.id === playerId && 'bg-primary/10'
          )}
        >
          <span className="w-5 text-xs font-bold text-text-muted">#{i + 1}</span>
          <AvatarIcon characterId={p.characterId} size={36} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 truncate text-sm font-bold">
              {p.name}
              {!p.connected && (
                <span className="text-xs text-text-muted">(away)</span>
              )}
              {p.id === drawerId && <span title="Drawing">✏️</span>}
              {guessedIds.has(p.id) && <span className="text-success">✓</span>}
              {p.guessStreak >= 3 && (
                <span className="rounded bg-danger/20 px-1 text-xs text-danger">
                  🔥
                </span>
              )}
            </div>
            <div className="text-xs text-text-muted">
              +{p.roundScore} · {p.score} pts
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
