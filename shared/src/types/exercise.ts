export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'cardio', 'other',
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT_TYPES = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell', 'other',
] as const;

export type Equipment = (typeof EQUIPMENT_TYPES)[number];

export interface Exercise {
  id: string;
  userId: string | null;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles: string[];
  equipment: Equipment | null;
  isCustom: boolean;
}

export interface CreateExerciseRequest {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: string[];
  equipment?: Equipment;
}

export interface ExerciseHistory {
  date: string;
  workoutName: string;
  sets: { setNumber: number; weight: number | null; reps: number | null; rpe: number | null }[];
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
  value: number;
  achievedAt: string;
}
