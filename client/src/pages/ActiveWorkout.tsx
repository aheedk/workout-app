import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { ExercisePicker } from '../components/features/ExercisePicker';
import { ExerciseEntry, type ExerciseEntryData } from '../components/features/ExerciseEntry';
import { RestTimer } from '../components/features/RestTimer';
import { useCreateWorkout } from '../api/workouts';
import { useToast } from '../components/ui/Toast';
import { useElapsedTimer } from '../hooks/useTimer';
import { formatDurationTimer } from '../utils/formatting';
import type { Exercise, Routine, CreateWorkoutRequest } from '@workout-app/shared';

export function ActiveWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const routineState = (location.state as { routine?: Routine } | null)?.routine;

  const elapsed = useElapsedTimer();
  const createWorkout = useCreateWorkout();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseEntryData[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);

  useEffect(() => {
    if (routineState) {
      setName(routineState.name);
      setExercises(
        routineState.exercises.map((re) => ({
          exerciseId: re.exerciseId,
          exerciseName: re.exerciseName,
          notes: '',
          restSeconds: re.restSeconds ?? 90,
          sets: Array.from({ length: re.defaultSets }, () => ({
            weight: re.defaultWeight,
            reps: re.defaultReps,
            rpe: null,
            isWarmup: false,
            isDropset: false,
            completed: false,
          })),
        }))
      );
    } else {
      setName(`Workout ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
    }
  }, [routineState]);

  const handleAddExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        notes: '',
        restSeconds: 90,
        sets: [{ weight: null, reps: null, rpe: null, isWarmup: false, isDropset: false, completed: false }],
      },
    ]);
  };

  const handleUpdateExercise = (index: number, updated: ExerciseEntryData) => {
    setExercises((prev) => prev.map((e, i) => (i === index ? updated : e)));
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetComplete = (restSeconds: number) => {
    if (restSeconds > 0) {
      setRestTimer(restSeconds);
    }
  };

  const handleFinish = async () => {
    if (!name.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (exercises.length === 0) {
      showToast('Add at least one exercise', 'error');
      return;
    }

    const data: CreateWorkoutRequest = {
      name: name.trim(),
      date: new Date().toISOString(),
      durationMinutes: Math.round(elapsed / 60),
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        notes: e.notes || undefined,
        sets: e.sets
          .filter((s) => s.weight != null || s.reps != null)
          .map((s) => ({
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            isWarmup: s.isWarmup,
            isDropset: s.isDropset,
          })),
      })),
    };

    // Filter out exercises with no sets
    data.exercises = data.exercises.filter((e) => e.sets.length > 0);
    if (data.exercises.length === 0) {
      showToast('Enter at least one set with data', 'error');
      return;
    }

    try {
      const workout = await createWorkout.mutateAsync(data);
      showToast('Workout saved!', 'success');
      navigate(`/workouts/${workout.id}`);
    } catch {
      showToast('Failed to save workout', 'error');
    }
  };

  const handleCancel = () => {
    if (confirm('Discard this workout?')) {
      navigate('/workouts');
    }
  };

  return (
    <div>
      <PageHeader
        title={
          <>
            <span className="hidden sm:inline">Active Workout</span>
            <span className="sm:hidden">Workout</span>
            <span className="ml-2 text-sm font-mono font-normal text-gray-500 dark:text-gray-400">
              {formatDurationTimer(elapsed)}
            </span>
          </>
        }
        action={
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-2 sm:px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={createWorkout.isPending}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium rounded-lg whitespace-nowrap"
            >
              {createWorkout.isPending ? 'Saving…' : 'Finish'}
            </button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Workout name"
          className="w-full px-4 py-3 text-lg font-medium border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        />

        {exercises.map((entry, i) => (
          <ExerciseEntry
            key={`${entry.exerciseId}-${i}`}
            entry={entry}
            onChange={(updated) => handleUpdateExercise(i, updated)}
            onRemove={() => handleRemoveExercise(i)}
            onSetComplete={handleSetComplete}
          />
        ))}

        <button
          onClick={() => setPickerOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
        >
          + Add Exercise
        </button>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setRestTimer(90)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
          >
            Start Rest Timer
          </button>
        </div>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />

      {restTimer != null && <RestTimer seconds={restTimer} onClose={() => setRestTimer(null)} />}
    </div>
  );
}
