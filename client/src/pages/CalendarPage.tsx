import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Calendar } from '../components/features/Calendar';
import { useWorkouts } from '../api/workouts';
import { useAuth } from '../hooks/useAuth';
import { formatDuration } from '../utils/formatting';

export function CalendarPage() {
  const [selected, setSelected] = useState<{ date: string; ids: string[] } | null>(null);
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  const { data: workoutsList } = useWorkouts(
    selected ? { startDate: selected.date, endDate: selected.date, limit: 20 } : { limit: 1 }
  );
  const dayWorkouts = selected ? workoutsList?.data ?? [] : [];

  return (
    <div>
      <PageHeader title="Calendar" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        <Calendar onDaySelect={(date, ids) => setSelected({ date, ids })} />

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {selected
              ? new Date(selected.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Select a day'}
          </h3>

          {!selected ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click a day to view workouts.
            </p>
          ) : dayWorkouts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No workouts on this day.</p>
          ) : (
            <div className="space-y-2">
              {dayWorkouts.map((w) => (
                <Link
                  key={w.id}
                  to={`/workouts/${w.id}`}
                  className="block p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <p className="font-medium text-gray-900 dark:text-white">{w.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {w.exerciseCount} exercises
                    {w.durationMinutes != null && ` · ${formatDuration(w.durationMinutes)}`} ·{' '}
                    {w.totalVolume.toLocaleString()} {unit}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
