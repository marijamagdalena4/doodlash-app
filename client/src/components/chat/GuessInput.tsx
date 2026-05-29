import { useState } from 'react';
import { emitGuess } from '../../hooks/useSocket';
import { useGameStore } from '../../store/useGameStore';
import { usePlayerStore } from '../../store/usePlayerStore';

export function GuessInput() {
  const [text, setText] = useState('');
  const drawerId = useGameStore((s) => s.drawerId);
  const playerId = usePlayerStore((s) => s.playerId);
  const guessedIds = useGameStore((s) => s.guessedIds);
  const phase = useGameStore((s) => s.phase);

  const isDrawer = drawerId === playerId;
  const alreadyGuessed = guessedIds.has(playerId);
  const disabled = phase !== 'playing' || isDrawer;

  const submit = () => {
    if (!text.trim() || disabled) return;
    emitGuess(text);
    setText('');
  };

  if (isDrawer) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-sm text-text-muted">
        You are drawing — no peeking!
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 60))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={disabled}
        placeholder={
          alreadyGuessed
            ? 'Chat with others...'
            : 'Type your guess...'
        }
        className="flex-1 rounded-lg border-2 border-primary/30 px-3 py-2 outline-none focus:border-primary disabled:bg-gray-100"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="rounded-lg bg-primary px-4 py-2 font-bold text-white transition hover:bg-secondary disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
