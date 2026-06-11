/**
 * Epley formula for estimated 1 rep max.
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}

/**
 * Volume = weight * reps for a single set.
 */
export function calculateVolume(weight: number | null, reps: number | null): number {
  if (!weight || !reps) return 0;
  return weight * reps;
}

/**
 * Workouts saved by older clients could record multi-day durations when a
 * session was abandoned and finished later. Anything past 12 hours isn't a
 * real training duration — report it as unknown rather than skewing stats.
 */
export const MAX_PLAUSIBLE_DURATION_MINUTES = 720;

export function sanitizeDurationMinutes(minutes: number | null): number | null {
  if (minutes == null || minutes <= 0 || minutes > MAX_PLAUSIBLE_DURATION_MINUTES) return null;
  return minutes;
}
