export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  isWarmup: boolean;
  isPr: boolean;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  notes: string | null;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  routineId: string | null;
  name: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  durationMinutes: number | null;
  notes: string | null;
  tags: string[];
  exercises: WorkoutExercise[];
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  durationMinutes: number | null;
  tags: string[];
  exerciseCount: number;
  totalVolume: number;
  hasPr: boolean;
}

export interface CreateWorkoutSetInput {
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  isWarmup?: boolean;
}

export interface CreateWorkoutExerciseInput {
  exerciseId: string;
  notes?: string;
  sets: CreateWorkoutSetInput[];
}

export interface CreateWorkoutRequest {
  name: string;
  date: string;
  routineId?: string;
  notes?: string;
  tags?: string[];
  durationMinutes?: number;
  exercises: CreateWorkoutExerciseInput[];
}

export interface CalendarDay {
  date: string;
  workoutCount: number;
  workoutIds: string[];
}
