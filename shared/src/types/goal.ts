export interface Goal {
  id: string;
  type: 'workouts_per_week' | 'exercise_target';
  targetValue: number;
  exerciseId: string | null;
  exerciseName: string | null;
  targetWeight: number | null;
  isActive: boolean;
  currentProgress: number;
  createdAt: string;
}

export interface CreateGoalRequest {
  type: 'workouts_per_week' | 'exercise_target';
  targetValue: number;
  exerciseId?: string;
  targetWeight?: number;
}
