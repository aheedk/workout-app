import { useState } from 'react';
import { SetRow, type SetData } from './SetRow';
import { useExerciseHistory } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';

export interface ExerciseEntryData {
  exerciseId: string;
  exerciseName: string;
  notes: string;
  sets: SetData[];
}

interface ExerciseEntryProps {
  entry: ExerciseEntryData;
  onChange: (entry: ExerciseEntryData) => void;
  onRemove: () => void;
  onSetComplete: (restSeconds?: number) => void;
  defaultRestSeconds?: number;
}

export function ExerciseEntry({
  entry,
  onChange,
  onRemove,
  onSetComplete,
  defaultRestSeconds,
}: ExerciseEntryProps) {
  const [collapsed, setCollapsed] = useState(false);
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
      onSetComplete(defaultRestSeconds);
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
          completed: false,
        },
      ],
    });
  };

  const handleRemoveSet = (index: number) => {
    onChange({ ...entry, sets: entry.sets.filter((_, i) => i !== index) });
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
        <button
          onClick={onRemove}
          className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded"
        >
          Remove
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="grid grid-cols-[32px_1fr_1fr_1fr_auto_auto] gap-2 px-2 pb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="text-center">#</span>
            <span>Weight</span>
            <span>Reps</span>
            <span>RPE</span>
            <span></span>
            <span></span>
          </div>
          <div className="space-y-1">
            {entry.sets.map((set, i) => (
              <SetRow
                key={i}
                setNumber={entry.sets.slice(0, i + 1).filter((s) => !s.isWarmup).length}
                set={set}
                previous={previousBest ?? undefined}
                onChange={(changes) => handleSetChange(i, changes)}
                onRemove={() => handleRemoveSet(i)}
              />
            ))}
          </div>
          <button
            onClick={handleAddSet}
            className="mt-2 w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg"
          >
            + Add Set
          </button>

          <textarea
            value={entry.notes}
            onChange={(e) => onChange({ ...entry, notes: e.target.value })}
            placeholder="Notes..."
            rows={1}
            className="mt-3 w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          />
        </>
      )}
    </div>
  );
}
