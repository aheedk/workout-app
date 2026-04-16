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
      className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">{routine.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {routine.exercises.length} exercises
            {routine.lastUsedAt && ` · Last used ${formatRelativeDate(routine.lastUsedAt)}`}
          </p>
        </div>
        <button
          onClick={handleFavorite}
          className="text-xl leading-none p-1"
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
              className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
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
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
        >
          Start Workout
        </button>
      </div>
    </Link>
  );
}
