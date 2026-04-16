import { useTimer } from '../../hooks/useTimer';
import { formatDurationTimer } from '../../utils/formatting';
import { useEffect } from 'react';

interface RestTimerProps {
  seconds: number;
  onClose: () => void;
}

const PRESETS = [30, 60, 90, 120, 180];

export function RestTimer({ seconds, onClose }: RestTimerProps) {
  const { seconds: remaining, isRunning, start, pause, reset } = useTimer(seconds);

  useEffect(() => {
    start();
  }, [start, seconds]);

  const pct = seconds > 0 ? (remaining / seconds) * 100 : 0;
  const done = remaining === 0;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Rest Timer</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="relative h-32 flex items-center justify-center mb-3">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-100 dark:text-gray-700"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 44}`}
            strokeDashoffset={`${2 * Math.PI * 44 * (1 - pct / 100)}`}
            className={done ? 'text-green-500' : 'text-blue-600'}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className={`text-3xl font-bold ${done ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>
          {formatDurationTimer(remaining)}
        </span>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={isRunning ? pause : start}
          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => reset()}
          className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
        >
          Reset
        </button>
      </div>

      <div className="flex gap-1 flex-wrap">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => reset(s)}
            className="flex-1 py-1 text-xs bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
          >
            {s}s
          </button>
        ))}
      </div>
    </div>
  );
}
