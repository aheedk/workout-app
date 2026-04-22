import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { PRBadge } from '../components/features/PRBadge';
import { ExerciseHistoryModal } from '../components/features/ExerciseHistoryModal';
import { useWorkout, useDeleteWorkout } from '../api/workouts';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDuration } from '../utils/formatting';
import { calculateVolume } from '../utils/calculations';
import { useToast } from '../components/ui/Toast';

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workout, isLoading } = useWorkout(id);
  const deleteWorkout = useDeleteWorkout();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [historyFor, setHistoryFor] = useState<{ id: string; name: string } | null>(null);
  const unit = user?.unitPreference ?? 'kg';

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteWorkout.mutateAsync(id);
      showToast('Workout deleted', 'success');
      navigate('/workouts');
    } catch {
      showToast('Failed to delete workout', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!workout) {
    return <p className="text-gray-600 dark:text-gray-400">Workout not found.</p>;
  }

  const totalVolume = workout.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + (set.isWarmup ? 0 : calculateVolume(set.weight ?? 0, set.reps ?? 0)), 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={workout.name}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(true)}
              className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm font-medium"
            >
              Delete
            </button>
          </div>
        }
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Date</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatDate(workout.date)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Duration</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {workout.durationMinutes ? formatDuration(workout.durationMinutes) : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Exercises</p>
            <p className="font-medium text-gray-900 dark:text-white">{workout.exercises.length}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Volume</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {totalVolume.toLocaleString()} {unit}
            </p>
          </div>
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
        {workout.notes && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{workout.notes}</p>
        )}
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise) => (
          <div
            key={exercise.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white min-w-0 truncate">
                {exercise.exerciseName}
              </h3>
              <button
                onClick={() => setHistoryFor({ id: exercise.exerciseId, name: exercise.exerciseName })}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0"
              >
                History
              </button>
            </div>
            {exercise.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{exercise.notes}</p>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-2 font-medium">Set</th>
                  <th className="pb-2 pr-2 font-medium">Weight</th>
                  <th className="pb-2 pr-2 font-medium">Reps</th>
                  <th className="pb-2 pr-2 font-medium">RPE</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let workSetNumber = 0;
                  return exercise.sets.map((set) => {
                    if (!set.isWarmup && !set.isDropset) workSetNumber++;
                    const label = set.isWarmup ? 'W' : set.isDropset ? 'D' : String(workSetNumber);
                    return (
                      <tr
                        key={set.id}
                        className={`border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${
                          set.isDropset ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''
                        }`}
                      >
                        <td
                          className={`py-2 pr-2 font-medium ${
                            set.isDropset
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {label}
                        </td>
                        <td className="py-2 pr-2 text-gray-900 dark:text-white">
                          {set.weight != null ? `${set.weight} ${unit}` : '—'}
                        </td>
                        <td className="py-2 pr-2 text-gray-900 dark:text-white">{set.reps ?? '—'}</td>
                        <td className="py-2 pr-2 text-gray-900 dark:text-white">{set.rpe ?? '—'}</td>
                        <td className="py-2">{set.isPr && <PRBadge size="xs" />}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete workout?"
        message="This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

      <ExerciseHistoryModal
        isOpen={historyFor !== null}
        onClose={() => setHistoryFor(null)}
        exerciseId={historyFor?.id}
        exerciseName={historyFor?.name ?? ''}
      />

      <div className="mt-8">
        <Link to="/workouts" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to workouts
        </Link>
      </div>
    </div>
  );
}
