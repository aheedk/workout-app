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
      className="group relative block plate p-4 pl-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      {/* Left accent bar that ignites on hover. */}
      <span
        className="absolute left-0 inset-y-0 w-[3px] bg-blue-500 scale-y-0 group-hover:scale-y-100 origin-center transition-transform"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg uppercase tracking-wide leading-tight text-gray-900 dark:text-white truncate">
              {workout.name}
            </h3>
            {workout.hasPr && <PRBadge />}
          </div>
          <p className="eyebrow mt-1">{formatDate(workout.date)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-sm tabular-nums text-gray-600 dark:text-gray-300">
        <span>
          {workout.exerciseCount} exercise{workout.exerciseCount === 1 ? '' : 's'}
        </span>
        {workout.durationMinutes != null && <span>{formatDuration(workout.durationMinutes)}</span>}
        <span>
          {workout.totalVolume.toLocaleString()} {unit}
        </span>
      </div>

      {workout.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {workout.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
