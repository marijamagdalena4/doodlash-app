import clsx from 'clsx';
import { PALETTE } from '../../types';

interface Props {
  color: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ color, onChange }: Props) {
  return (
    <div>
      <div className="grid grid-cols-6 gap-1">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={clsx(
              'h-7 w-7 rounded-md border border-gray-200 transition-transform hover:scale-125',
              color === c && 'ring-2 ring-white ring-offset-2 ring-offset-primary'
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
      <div
        className="mt-2 h-10 w-full rounded-lg border-2 border-gray-200"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
