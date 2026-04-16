import type { Goal } from '@workout-app/shared';

interface GoalProgressProps {
  goal: Goal;
  unit: 'kg' | 'lb';
}

export function GoalProgress({ goal, unit }: GoalProgressProps) {
  const progress = Math.min(100, (goal.currentProgress / goal.targetValue) * 100);
  const isComplete = goal.currentProgress >= goal.targetValue;

  const label =
    goal.type === 'workouts_per_week'
      ? `${goal.targetValue} workouts/week`
      : `${goal.exerciseName ?? 'Exercise'} · ${goal.targetValue} ${unit}`;

  const valueLabel =
    goal.type === 'workouts_per_week'
      ? `${Math.round(goal.currentProgress)}/${goal.targetValue}`
      : `${Math.round(goal.currentProgress)}/${goal.targetValue} ${unit}`;

  return (
    <div>
      <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
        <span className="text-gray-700 dark:text-gray-300 truncate">{label}</span>
        <span
          className={
            isComplete
              ? 'text-green-600 dark:text-green-400 font-medium shrink-0'
              : 'text-gray-500 dark:text-gray-400 shrink-0'
          }
        >
          {valueLabel}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isComplete ? 'bg-green-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
