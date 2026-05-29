import clsx from 'clsx';
import { AvatarIcon } from '../shared/AvatarIcon';
import { CHARACTERS, type CharacterId } from '../../types';

interface Props {
  selected: CharacterId | null;
  onSelect: (id: CharacterId) => void;
}

export function CharacterPicker({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {CHARACTERS.map((char) => {
        const isSelected = selected === char.id;
        return (
          <button
            key={char.id}
            type="button"
            onClick={() => onSelect(char.id)}
            className={clsx(
              'relative flex w-[140px] flex-col items-center rounded-2xl bg-bg-card p-3 shadow-md transition-all duration-150',
              'hover:scale-[1.04] hover:shadow-lg',
              isSelected && 'scale-[1.08] shadow-xl'
            )}
            style={{
              border: isSelected ? `3px solid ${char.fill}` : '3px solid transparent',
            }}
          >
            {isSelected && (
              <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-success text-xs text-white">
                ✓
              </span>
            )}
            <AvatarIcon characterId={char.id} size={72} />
            <span className="mt-2 font-bold text-text-primary">{char.name}</span>
          </button>
        );
      })}
    </div>
  );
}
