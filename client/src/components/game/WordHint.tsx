import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export function WordHint() {
  const hint = useGameStore((s) => s.hint);
  const secretWord = useGameStore((s) => s.secretWord);
  const drawerId = useGameStore((s) => s.drawerId);
  const playerId = usePlayerStore((s) => s.playerId);
  const lastWord = useGameStore((s) => s.lastWord);
  const phase = useGameStore((s) => s.phase);

  const isDrawer = drawerId === playerId;
  const showSecret = isDrawer && secretWord && phase === 'playing';
  const showReveal = phase === 'scoreboard' && lastWord;

  if (!hint && !showReveal) return null;

  const lengthsLabel = hint?.wordLengths?.length
    ? `(${hint.wordLengths.join(', ')})`
    : '';

  return (
    <div className="rounded-xl bg-secondary/10 px-4 py-3">
      {showSecret && (
        <div className="mb-2 rounded-lg bg-accent-pink/20 px-3 py-1 text-center font-bold text-secondary">
          {secretWord.toUpperCase()}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xl font-bold tracking-widest text-text-primary">
          {showReveal ? lastWord.toUpperCase() : hint?.display}
        </p>
        {hint && !showReveal && (
          <span className="shrink-0 text-sm text-text-muted">{lengthsLabel}</span>
        )}
      </div>
    </div>
  );
}
