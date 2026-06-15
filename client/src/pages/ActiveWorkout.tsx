import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { ExercisePicker } from '../components/features/ExercisePicker';
import { ExerciseEntry, type ExerciseEntryData } from '../components/features/ExerciseEntry';
import { RestTimer } from '../components/features/RestTimer';
import { useCreateWorkout } from '../api/workouts';
import { useToast } from '../components/ui/Toast';
import { useElapsedTimer } from '../hooks/useTimer';
import { formatDurationTimer, toLocalDateString } from '../utils/formatting';
import {
  clearActiveWorkout,
  loadActiveWorkout,
  saveActiveWorkout,
  type ActiveWorkoutSnapshot,
} from '../utils/activeWorkoutStorage';
import type { Exercise, Routine, CreateWorkoutRequest } from '@workout-app/shared';

/** Prefilled session passed via navigation state (e.g. "Repeat" on a past workout). */
export interface WorkoutPrefill {
  name: string;
  exercises: ExerciseEntryData[];
}

// Time away after which a resumed session is treated as paused rather than
// running: the gap is excluded from the workout duration.
const IDLE_GAP_MS = 15 * 60 * 1000;

const AUTO_NAME_PATTERN = /^Workout [A-Z][a-z]{2} \d{1,2}$/;

function autoName(): string {
  return `Workout ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/**
 * Resume a persisted session. Idle time since the last save is excluded by
 * shifting `startedAt` forward, so the on-screen timer (and the saved
 * duration) only counts time actually spent in the workout. If the session
 * was auto-named on an earlier day and never renamed, refresh the name.
 */
function resumeSnapshot(p: ActiveWorkoutSnapshot) {
  const gap = Date.now() - p.savedAt;
  let startedAt = p.startedAt;
  let name = p.name;
  if (gap > IDLE_GAP_MS) {
    startedAt = Math.min(Date.now(), p.startedAt + gap);
    if (AUTO_NAME_PATTERN.test(name)) name = autoName();
  }
  return { name, notes: p.notes, exercises: p.exercises, startedAt };
}

export function ActiveWorkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as { routine?: Routine; prefill?: WorkoutPrefill } | null;
  const routineState = navState?.routine;
  const prefillState = navState?.prefill;

  // Decide once on first render whether we're resuming a paused session or
  // starting fresh. After that, state lives in React + localStorage.
  const initialRef = useRef<{
    name: string;
    notes: string;
    exercises: ExerciseEntryData[];
    startedAt: number;
  } | null>(null);

  if (initialRef.current === null) {
    const persisted = loadActiveWorkout();
    const incoming: { name: string; exercises: ExerciseEntryData[] } | null = routineState
      ? {
          name: routineState.name,
          exercises: routineState.exercises.map((re) => ({
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
          })),
        }
      : prefillState ?? null;

    if (incoming) {
      // The user explicitly chose a routine or repeat — discard any paused session.
      if (persisted) {
        const ok = window.confirm(
          'You have a paused workout in progress. Discard it and start this one?'
        );
        if (!ok) {
          initialRef.current = resumeSnapshot(persisted);
        }
      }
      if (initialRef.current === null) {
        clearActiveWorkout();
        initialRef.current = {
          name: incoming.name,
          notes: '',
          exercises: incoming.exercises,
          startedAt: Date.now(),
        };
      }
    } else if (persisted) {
      initialRef.current = resumeSnapshot(persisted);
    } else {
      initialRef.current = {
        name: autoName(),
        notes: '',
        exercises: [],
        startedAt: Date.now(),
      };
    }
  }

  const initial = initialRef.current;
  const elapsed = useElapsedTimer(initial.startedAt);
  const createWorkout = useCreateWorkout();
  const { showToast } = useToast();

  const [name, setName] = useState(initial.name);
  const [notes, setNotes] = useState(initial.notes);
  const [exercises, setExercises] = useState<ExerciseEntryData[]>(initial.exercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restTimer, setRestTimer] = useState<{
    seconds: number;
    exerciseName?: string;
    setLabel?: string;
  } | null>(null);

  // Persist on every change so swiping the app away mid-workout doesn't lose it.
  // Only persist once the workout has at least one exercise — opening the page
  // and immediately backing out shouldn't leave a stale "Resume" banner.
  useEffect(() => {
    if (exercises.length === 0) return;
    saveActiveWorkout({ name, notes, exercises, startedAt: initial.startedAt });
  }, [name, notes, exercises, initial.startedAt]);

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

  const handleMoveExercise = (index: number, direction: -1 | 1) => {
    setExercises((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSetComplete = (ctx: {
    restSeconds: number;
    exerciseName: string;
    setLabel: string;
  }) => {
    if (ctx.restSeconds > 0) {
      setRestTimer({
        seconds: ctx.restSeconds,
        exerciseName: ctx.exerciseName,
        setLabel: ctx.setLabel,
      });
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

    // Active minutes, excluding idle gaps (handled at resume). A session that
    // still computes to more than 12 hours isn't a meaningful duration — save
    // the workout without one rather than recording a multi-day "workout".
    const minutes = Math.round(elapsed / 60);
    const durationMinutes = minutes >= 1 && minutes <= 720 ? minutes : undefined;

    const data: CreateWorkoutRequest = {
      name: name.trim(),
      date: toLocalDateString(new Date()),
      durationMinutes,
      notes: notes.trim() || undefined,
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
      clearActiveWorkout();
      showToast('Workout saved!', 'success');
      navigate(`/workouts/${workout.id}`);
    } catch {
      showToast('Failed to save workout', 'error');
    }
  };

  const handleCancel = () => {
    if (confirm('Discard this workout?')) {
      clearActiveWorkout();
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
            <button onClick={handleCancel} className="btn-ghost px-3 py-2.5">
              Cancel
            </button>
            <button
              onClick={handleFinish}
              disabled={createWorkout.isPending}
              className="btn px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white whitespace-nowrap"
            >
              {createWorkout.isPending ? 'Saving…' : 'Finish ✓'}
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
          className="w-full px-4 py-3 font-display text-2xl uppercase tracking-wide border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />

        {exercises.map((entry, i) => (
          <ExerciseEntry
            key={`${entry.exerciseId}-${i}`}
            entry={entry}
            onChange={(updated) => handleUpdateExercise(i, updated)}
            onRemove={() => handleRemoveExercise(i)}
            onSetComplete={handleSetComplete}
            onMoveUp={i > 0 ? () => handleMoveExercise(i, -1) : undefined}
            onMoveDown={i < exercises.length - 1 ? () => handleMoveExercise(i, 1) : undefined}
          />
        ))}

        <button
          onClick={() => setPickerOpen(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 text-xs font-semibold uppercase tracking-label text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          + Add Exercise
        </button>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Workout notes — how did it go?"
          rows={2}
          className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-colors"
        />

        <div className="flex gap-2 pt-2">
          <button onClick={() => setRestTimer({ seconds: 90 })} className="btn-ghost px-4 py-2.5">
            ⏱ Start Rest Timer
          </button>
        </div>
      </div>

      <ExercisePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddExercise}
      />

      {restTimer != null && (
        <RestTimer
          seconds={restTimer.seconds}
          exerciseName={restTimer.exerciseName}
          setLabel={restTimer.setLabel}
          onClose={() => setRestTimer(null)}
        />
      )}
    </div>
  );
}
