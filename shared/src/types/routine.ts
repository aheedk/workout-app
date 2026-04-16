export interface RoutineExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number | null;
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  tags: string[];
  isFavorite: boolean;
  lastUsedAt: string | null;
  exercises: RoutineExercise[];
  createdAt: string;
}

export interface CreateRoutineExerciseInput {
  exerciseId: string;
  defaultSets?: number;
  defaultReps?: number;
  defaultWeight?: number | null;
  restSeconds?: number;
}

export interface CreateRoutineRequest {
  name: string;
  tags?: string[];
  exercises: CreateRoutineExerciseInput[];
}
