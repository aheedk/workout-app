import { useState } from 'react';
import { SetRow, type SetData } from './SetRow';
import { ExerciseHistoryModal } from './ExerciseHistoryModal';
import { useExerciseHistory } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';

export interface ExerciseEntryData {
  exerciseId: string;
  exerciseName: string;
  notes: string;
  restSeconds: number;
  sets: SetData[];
}

interface ExerciseEntryProps {
  entry: ExerciseEntryData;
  onChange: (entry: ExerciseEntryData) => void;
  onRemove: () => void;
  onSetComplete: (restSeconds: number) => void;
}

const REST_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'No rest' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
  { value: 240, label: '4m' },
  { value: 300, label: '5m' },
];

export function ExerciseEntry({ entry, onChange, onRemove, onSetComplete }: ExerciseEntryProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';
  const { data: history } = useExerciseHistory(entry.exerciseId);

  const lastSession = history?.[0];
  const previousBest = lastSession
    ? lastSession.sets
        .filter((s) => s.weight != null && s.reps != null)
        .reduce<{ weight: number; reps: number } | null>((best, s) => {
          if (!best || (s.weight! * s.reps!) > best.weight * best.reps) {
            return { weight: s.weight!, reps: s.reps! };
          }
          return best;
        }, null)
    : null;

  const handleSetChange = (index: number, changes: Partial<SetData>) => {
    const newSets = entry.sets.map((s, i) => (i === index ? { ...s, ...changes } : s));
    onChange({ ...entry, sets: newSets });

    // If set just marked completed, trigger rest timer
    if (changes.completed === true && !entry.sets[index].completed) {
      onSetComplete(entry.restSeconds);
    }
  };

  const handleAddSet = () => {
    const last = entry.sets[entry.sets.length - 1];
    onChange({
      ...entry,
      sets: [
        ...entry.sets,
        {
          weight: last?.weight ?? null,
          reps: last?.reps ?? null,
          rpe: null,
          isWarmup: false,
          isDropset: false,
          completed: false,
        },
      ],
    });
  };

  const handleAddDropset = () => {
    const last = entry.sets[entry.sets.length - 1];
    onChange({
      ...entry,
      sets: [
        ...entry.sets,
        {
          // Start a drop at ~80% of last weight as a hint; user will adjust
          weight: last?.weight != null ? Math.round(last.weight * 0.8 * 2) / 2 : null,
          reps: null,
          rpe: null,
          isWarmup: false,
          isDropset: true,
          completed: false,
        },
      ],
    });
  };

  const handleRemoveSet = (index: number) => {
    onChange({ ...entry, sets: entry.sets.filter((_, i) => i !== index) });
  };

  const handleRestChange = (value: number) => {
    onChange({ ...entry, restSeconds: value });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <button onClick={() => setCollapsed(!collapsed)} className="text-left flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">{entry.exerciseName}</h3>
          {previousBest && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Previous best: {previousBest.weight} {unit} × {previousBest.reps}
            </p>
          )}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setHistoryOpen(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded"
            title="View history"
          >
            History
          </button>
          <RestSelect value={entry.restSeconds} onChange={handleRestChange} />
          <button
            onClick={onRemove}
            className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded"
          >
            Remove
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-[20px_1fr_1fr_auto] gap-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="text-center">#</span>
            <span>Weight</span>
            <span>Reps</span>
            <span></span>
          </div>
          <div className="space-y-1">
            {entry.sets.map((set, i) => (
              <SetRow
                key={i}
                setNumber={
                  entry.sets
                    .slice(0, i + 1)
                    .filter((s) => !s.isWarmup && !s.isDropset).length
                }
                set={set}
                previous={previousBest ?? undefined}
                onChange={(changes) => handleSetChange(i, changes)}
                onRemove={() => handleRemoveSet(i)}
              />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              onClick={handleAddSet}
              className="py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
            >
              + Add Set
            </button>
            <button
              onClick={handleAddDropset}
              disabled={entry.sets.length === 0}
              className="py-2 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50 rounded-lg"
            >
              + Drop
            </button>
          </div>

          <textarea
            value={entry.notes}
            onChange={(e) => onChange({ ...entry, notes: e.target.value })}
            placeholder="Notes..."
            rows={1}
            className="mt-3 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </>
      )}

      <ExerciseHistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        exerciseId={entry.exerciseId}
        exerciseName={entry.exerciseName}
      />
    </div>
  );
}

function RestSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const isOff = !value;
  return (
    <label
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border cursor-pointer ${
        isOff
          ? 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
          : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
      }`}
      title="Rest after each set"
    >
      <span aria-hidden>⏱</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent outline-none appearance-none pr-1 cursor-pointer"
      >
        {REST_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
