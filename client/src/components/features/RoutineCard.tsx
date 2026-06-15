import { Link, useNavigate } from 'react-router-dom';
import type { Routine } from '@workout-app/shared';
import { formatRelativeDate } from '../../utils/formatting';
import { useToggleFavorite, useStartWorkout } from '../../api/routines';
import { useToast } from '../ui/Toast';

export function RoutineCard({ routine }: { routine: Routine }) {
  const navigate = useNavigate();
  const toggleFavorite = useToggleFavorite();
  const startWorkout = useStartWorkout();
  const { showToast } = useToast();

  const handleStart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const workout = await startWorkout.mutateAsync(routine.id);
      navigate(`/workouts/active`, { state: { workoutId: workout.id, routine } });
    } catch {
      showToast('Failed to start workout', 'error');
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(routine.id);
  };

  return (
    <Link
      to={`/routines/${routine.id}/edit`}
      className="group block plate p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg uppercase tracking-wide leading-tight text-gray-900 dark:text-white">
            {routine.name}
          </h3>
          <p className="eyebrow mt-1">
            {routine.exercises.length} exercise{routine.exercises.length === 1 ? '' : 's'}
            {routine.lastUsedAt && ` · ${formatRelativeDate(routine.lastUsedAt)}`}
          </p>
        </div>
        <button
          onClick={handleFavorite}
          className={`text-xl leading-none p-1 transition-colors ${
            routine.isFavorite ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'
          }`}
          aria-label="Toggle favorite"
        >
          {routine.isFavorite ? '★' : '☆'}
        </button>
      </div>

      {routine.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {routine.tags.map((tag) => (
            <span
              key={tag}
              className="text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <button
          onClick={handleStart}
          disabled={startWorkout.isPending}
          className="btn-primary w-full"
        >
          Start Workout
        </button>
      </div>
    </Link>
  );
}
