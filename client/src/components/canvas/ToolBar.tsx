import clsx from 'clsx';

interface Props {
  brushSize: number;
  tool: 'brush' | 'eraser' | 'fill';
  onBrushSize: (size: number) => void;
  onTool: (tool: 'brush' | 'eraser' | 'fill') => void;
  onUndo: () => void;
  onClear: () => void;
  canUndo: boolean;
}

const SIZES = [
  { label: 'S', size: 4 },
  { label: 'M', size: 12 },
  { label: 'L', size: 28 },
];

export function ToolBar({
  brushSize,
  tool,
  onBrushSize,
  onTool,
  onUndo,
  onClear,
  canUndo,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1">
        {SIZES.map((s) => (
          <button
            key={s.size}
            type="button"
            onClick={() => onBrushSize(s.size)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-sm font-bold transition-all',
              brushSize === s.size
                ? 'bg-primary text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onTool('brush')}
          className={clsx(
            'flex-1 rounded-lg py-2 text-sm font-bold',
            tool === 'brush' ? 'bg-primary text-white' : 'bg-gray-100'
          )}
        >
          🖌️
        </button>
        <button
          type="button"
          onClick={() => onTool('eraser')}
          className={clsx(
            'flex-1 rounded-lg py-2 text-sm font-bold',
            tool === 'eraser' ? 'bg-primary text-white' : 'bg-gray-100'
          )}
        >
          🧽
        </button>
        <button
          type="button"
          onClick={() => onTool('fill')}
          className={clsx(
            'flex-1 rounded-lg py-2 text-sm font-bold',
            tool === 'fill' ? 'bg-primary text-white' : 'bg-gray-100'
          )}
        >
          🪣
        </button>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 rounded-lg bg-gray-100 py-2 text-sm font-bold disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-lg bg-danger/20 py-2 text-sm font-bold text-danger"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
