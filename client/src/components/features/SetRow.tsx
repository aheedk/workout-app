import { useAuth } from '../../hooks/useAuth';

export interface SetData {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isDropset: boolean;
  completed: boolean;
}

interface SetRowProps {
  setNumber: number;
  set: SetData;
  previous?: { weight: number | null; reps: number | null };
  onChange: (changes: Partial<SetData>) => void;
  onRemove: () => void;
}

export function SetRow({ setNumber, set, previous, onChange, onRemove }: SetRowProps) {
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  const label = set.isWarmup ? 'W' : set.isDropset ? 'D' : String(setNumber);

  const bgClass = set.completed
    ? 'bg-green-50 dark:bg-green-900/20'
    : set.isDropset
    ? 'bg-amber-50/50 dark:bg-amber-900/10'
    : '';

  // isWarmup and isDropset are mutually exclusive — toggling one off-toggles the other
  const toggleWarmup = (checked: boolean) => {
    onChange({ isWarmup: checked, isDropset: checked ? false : set.isDropset });
  };
  const toggleDropset = (checked: boolean) => {
    onChange({ isDropset: checked, isWarmup: checked ? false : set.isWarmup });
  };

  return (
    <div
      className={`grid grid-cols-[28px_1fr_1fr_1fr_auto_auto_auto] gap-2 items-center py-2 px-2 rounded ${bgClass}`}
    >
      <span
        className={`text-sm font-medium text-center ${
          set.isDropset
            ? 'text-amber-700 dark:text-amber-300'
            : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </span>

      <div>
        <input
          type="number"
          value={set.weight ?? ''}
          onChange={(e) => onChange({ weight: e.target.value === '' ? null : parseFloat(e.target.value) })}
          placeholder={previous?.weight != null ? String(previous.weight) : unit}
          step={0.5}
          min={0}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <input
          type="number"
          value={set.reps ?? ''}
          onChange={(e) => onChange({ reps: e.target.value === '' ? null : parseInt(e.target.value) })}
          placeholder={previous?.reps != null ? String(previous.reps) : 'reps'}
          min={0}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <select
          value={set.rpe ?? ''}
          onChange={(e) => onChange({ rpe: e.target.value === '' ? null : parseInt(e.target.value) })}
          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">RPE</option>
          {[6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <input
          type="checkbox"
          checked={set.isWarmup}
          onChange={(e) => toggleWarmup(e.target.checked)}
          className="rounded"
        />
        W
      </label>

      <label className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
        <input
          type="checkbox"
          checked={set.isDropset}
          onChange={(e) => toggleDropset(e.target.checked)}
          className="rounded"
        />
        D
      </label>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange({ completed: !set.completed })}
          className={`w-7 h-7 rounded flex items-center justify-center ${
            set.completed
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label="Complete set"
        >
          ✓
        </button>
        <button
          onClick={onRemove}
          className="w-7 h-7 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center justify-center text-lg leading-none"
          aria-label="Remove set"
        >
          ×
        </button>
      </div>
    </div>
  );
}
