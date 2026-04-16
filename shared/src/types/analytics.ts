export interface AnalyticsSummary {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolumeThisWeek: number;
  totalVolumeThisMonth: number;
  avgDurationMinutes: number;
  recentWorkout: { id: string; name: string; date: string } | null;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
}

export interface VolumeDataPoint {
  date: string;
  volume: number;
}

export interface MuscleGroupData {
  muscleGroup: string;
  count: number;
  percentage: number;
}

export interface FrequencyDataPoint {
  week: string;
  count: number;
}
