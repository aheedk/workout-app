import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ExercisePicker } from '../components/features/ExercisePicker';
import { useRoutine, useCreateRoutine, useUpdateRoutine, useDeleteRoutine } from '../api/routines';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import type { Exercise } from '@workout-app/shared';

interface ExerciseRow {
  id?: string;
  exerciseId: string;
  exerciseName: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  restSeconds: number;
}

export function RoutineFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  const { data: existing, isLoading } = useRoutine(id);
  const createMutation = useCreateRoutine();
  const updateMutation = useUpdateRoutine();
  const deleteMutation = useDeleteRoutine();

  const [name, setName] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (existing) {
      setName(existing.name);
      setTagsInput(existing.tags.join(', '));
      setExercises(
        existing.exercises.map((e) => ({
          id: e.id,
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
          defaultWeight: e.defaultWeight,
          restSeconds: e.restSeconds,
        }))
      );
    }
  }, [existing]);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        defaultSets: 3,
        defaultReps: 10,
        defaultWeight: null,
        restSeconds: 90,
      },
    ]);
  };

  const handleUpdateExercise = (index: number, changes: Partial<ExerciseRow>) => {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...changes } : ex)));
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= exercises.length) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (exercises.length === 0) {
      showToast('Add at least one exercise', 'error');
      return;
    }
    const data = {
      name: name.trim(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        defaultSets: e.defaultSets,
        defaultReps: e.defaultReps,
        defaultWeight: e.defaultWeight,
        restSeconds: e.restSeconds,
      })),
    };

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync({ id, data });
        showToast('Routine updated', 'success');
      } else {
        await createMutation.mutateAsync(data);
        showToast('Routine created', 'success');
      }
      navigate('/routines');
    } catch {
      showToast('Failed to save routine', 'error');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this routine?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Routine deleted', 'success');
      navigate('/routines');
    } catch {
      showToast('Failed to delete', 'error');
    }
  };

  if (isEdit && isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Routine' : 'New Routine'} />

      <div className="space-y-4 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="push, upper, strength"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Exercises</label>
            <button
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
            >
              + Add Exercise
            </button>
          </div>

          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div
                key={`${ex.exerciseId}-${i}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(i, -1)}
                        disabled={i === 0}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMove(i, 1)}
                        disabled={i === exercises.length - 1}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {ex.exerciseName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveExercise(i)}
                    className="text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <NumField
                    label="Sets"
                    value={ex.defaultSets}
                    onChange={(v) => handleUpdateExercise(i, { defaultSets: v })}
                    min={1}
                  />
                  <NumField
                    label="Reps"
                    value={ex.defaultReps}
                    onChange={(v) => handleUpdateExercise(i, { defaultReps: v })}
                    min={1}
                  />
                  <NumField
                    label={`Weight (${unit})`}
                    value={ex.defaultWeight ?? 0}
                    onChange={(v) => handleUpdateExercise(i, { defaultWeight: v || null })}
                    min={0}
                    step={0.5}
                  />
                  <NumField
                    label="Rest (s)"
                    value={ex.restSeconds}
                    onChange={(v) => handleUpdateExercise(i, { restSeconds: v })}
                    min={0}
                  />
                </div>
              </div>
            ))}

            {exercises.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Add exercises to build your routine.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4">
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg"
          >
            {isEdit ? 'Save Changes' : 'Create Routine'}
          </button>
          <Link
            to="/routines"
            className="px-5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg"
          >
            Cancel
          </Link>
          {isEdit && (
            <button
              onClick={handleDelete}
              className="ml-auto px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm"
            >
              Delete routine
            </button>
          )}
        </div>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  min,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <label className="text-sm">
      <span className="block text-gray-500 dark:text-gray-400 text-xs mb-0.5">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        step={step}
        className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </label>
  );
}
