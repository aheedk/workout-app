import type { ExerciseEntryData } from '../components/features/ExerciseEntry';

const STORAGE_KEY = 'activeWorkout:v1';

export interface ActiveWorkoutSnapshot {
  name: string;
  notes: string;
  exercises: ExerciseEntryData[];
  startedAt: number;
  savedAt: number;
}

export function loadActiveWorkout(): ActiveWorkoutSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveWorkoutSnapshot>;
    if (
      typeof parsed?.startedAt !== 'number' ||
      typeof parsed?.name !== 'string' ||
      !Array.isArray(parsed?.exercises)
    ) {
      return null;
    }
    return {
      name: parsed.name,
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
      exercises: parsed.exercises as ExerciseEntryData[],
      startedAt: parsed.startedAt,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveActiveWorkout(snapshot: Omit<ActiveWorkoutSnapshot, 'savedAt'>): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...snapshot, savedAt: Date.now() })
    );
  } catch {
    // localStorage unavailable (quota, private mode) — fall back to ephemeral state.
  }
}

export function clearActiveWorkout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasActiveWorkout(): boolean {
  return loadActiveWorkout() !== null;
}
