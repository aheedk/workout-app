import { Link } from 'react-router-dom';
import type { WorkoutSummary } from '@workout-app/shared';
import { formatDate, formatDuration } from '../../utils/formatting';
import { PRBadge } from './PRBadge';
import { useAuth } from '../../hooks/useAuth';

export function WorkoutCard({ workout }: { workout: WorkoutSummary }) {
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  return (
    <Link
      to={`/workouts/${workout.id}`}
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{workout.name}</h3>
            {workout.hasPr && <PRBadge />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(workout.date)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
        <span>{workout.exerciseCount} exercises</span>
        {workout.durationMinutes != null && <span>{formatDuration(workout.durationMinutes)}</span>}
        <span>
          {workout.totalVolume.toLocaleString()} {unit} volume
        </span>
      </div>

      {workout.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workout.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
