import clsx from 'clsx';
import { useGameStore } from '../../store/useGameStore';

export function Timer() {
  const secondsLeft = useGameStore((s) => s.secondsLeft);

  const color =
    secondsLeft > 40
      ? 'text-success border-success'
      : secondsLeft > 15
        ? 'text-accent-yellow border-accent-yellow'
        : 'text-danger border-danger';

  const pulse = secondsLeft <= 10 && secondsLeft > 0;

  const circumference = 2 * Math.PI * 42;
  const progress = (secondsLeft / 100) * circumference;

  return (
    <div
      className={clsx(
        'relative mx-auto flex h-28 w-28 items-center justify-center',
        pulse && 'animate-pulse-timer'
      )}
    >
      <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          className={color}
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span className={clsx('absolute text-3xl font-extrabold', color)}>
        {secondsLeft}
      </span>
    </div>
  );
}
