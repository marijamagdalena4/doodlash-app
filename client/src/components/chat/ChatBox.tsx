import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { AvatarIcon } from '../shared/AvatarIcon';
import { useGameStore } from '../../store/useGameStore';
import { useRoomStore } from '../../store/useRoomStore';

export function ChatBox() {
  const messages = useGameStore((s) => s.messages);
  const players = useRoomStore((s) => s.players);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getChar = (playerId: string) =>
    players.find((p) => p.id === playerId)?.characterId ?? 'char_1';

  return (
    <div className="flex h-36 flex-col overflow-y-auto rounded-lg border border-gray-200 bg-bg-card p-2">
      {messages.length === 0 && (
        <p className="text-center text-sm text-text-muted">Chat and guesses appear here...</p>
      )}
      {messages.map((msg, i) => (
        <div
          key={`${msg.ts}-${i}`}
          className={clsx(
            'mb-1 flex items-start gap-2 rounded px-2 py-1 text-sm',
            msg.correct && 'bg-success/20 font-bold text-green-800'
          )}
        >
          <AvatarIcon characterId={getChar(msg.playerId)} size={24} />
          <div>
            <span className="font-bold">{msg.name}: </span>
            <span>{msg.text}</span>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
