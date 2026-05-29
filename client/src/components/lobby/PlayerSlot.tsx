import clsx from 'clsx';
import { AvatarIcon } from '../shared/AvatarIcon';
import type { Player } from '../../types';

interface Props {
  player?: Player;
  isSelf?: boolean;
  slotIndex: number;
}

export function PlayerSlot({ player, isSelf, slotIndex }: Props) {
  if (!player) {
    return (
      <div className="flex h-28 flex-col items-center justify-center rounded-xl border-2 border-dashed border-text-muted/40 bg-bg-card/50">
        <span className="text-sm text-text-muted">Waiting...</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'relative flex h-28 flex-col items-center justify-center rounded-xl bg-bg-card p-3 shadow-md transition-all',
        isSelf && 'ring-2 ring-primary/40'
      )}
    >
      <AvatarIcon characterId={player.characterId} size={48} />
      <span className="mt-1 max-w-full truncate text-sm font-bold">
        {player.name}
        {isSelf && <span className="text-text-muted"> (You)</span>}
      </span>
      {player.ready && (
        <span className="mt-1 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-white">
          Ready
        </span>
      )}
    </div>
  );
}
