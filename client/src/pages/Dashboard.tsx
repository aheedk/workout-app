import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StreakBadge } from '../components/features/StreakBadge';
import { GoalProgress } from '../components/features/GoalProgress';
import { useSummary, useStreaks, useVolume } from '../api/analytics';
import { useGoals } from '../api/goals';
import { useRoutines } from '../api/routines';
import { useAuth } from '../hooks/useAuth';
import { formatDuration, formatRelativeDate } from '../utils/formatting';
import { BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';

export function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: streaks } = useStreaks();
  const { data: volume } = useVolume(6);
  const { data: goals } = useGoals();
  const { data: routines } = useRoutines();

  const unit = user?.unitPreference ?? 'kg';
  const favorites = routines?.filter((r) => r.isFavorite).slice(0, 3) ?? [];

  if (loadingSummary) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={user?.name ? `Hi, ${user.name.split(' ')[0]}` : 'Dashboard'}
        action={
          <Link
            to="/workouts/active"
            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base font-medium rounded-lg whitespace-nowrap"
          >
            Start Workout
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="This Week" value={summary?.workoutsThisWeek ?? 0} subtext="workouts" />
        <StatCard
          label="Current Streak"
          value={streaks?.currentStreak ?? 0}
          subtext={`days · longest ${streaks?.longestStreak ?? 0}`}
        />
        <StatCard
          label="Volume"
          value={(summary?.totalVolumeThisWeek ?? 0).toLocaleString()}
          subtext={`${unit} this week`}
        />
        <StatCard
          label="Avg Duration"
          value={summary?.avgDurationMinutes ? formatDuration(summary.avgDurationMinutes) : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Active Goals</h3>
          {goals && goals.filter((g) => g.isActive).length > 0 ? (
            <div className="space-y-3">
              {goals
                .filter((g) => g.isActive)
                .slice(0, 4)
                .map((goal) => (
                  <GoalProgress key={goal.id} goal={goal} unit={unit} />
                ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No active goals.{' '}
              <Link to="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">
                Create one
              </Link>
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Volume trend</h3>
            <Link to="/analytics" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Details
            </Link>
          </div>
          {volume && volume.length > 0 ? (
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip
                    cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                    contentStyle={{ backgroundColor: 'rgba(30,41,59,0.95)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                    formatter={(v: number) => [`${v.toLocaleString()} ${unit}`, 'Volume']}
                    labelFormatter={(l) => new Date(l).toLocaleDateString()}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">No data yet</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {summary?.recentWorkout && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Most Recent Workout</h3>
            <Link
              to={`/workouts/${summary.recentWorkout.id}`}
              className="block p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <p className="font-medium text-gray-900 dark:text-white">{summary.recentWorkout.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {formatRelativeDate(summary.recentWorkout.date)}
              </p>
            </Link>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Favorite Routines</h3>
            <Link to="/routines" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              View all
            </Link>
          </div>
          {favorites.length > 0 ? (
            <div className="space-y-2">
              {favorites.map((r) => (
                <Link
                  key={r.id}
                  to={`/routines/${r.id}/edit`}
                  className="block p-3 -mx-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ★ {r.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {r.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Star a routine to see it here.
            </p>
          )}
        </div>
      </div>

      {streaks && streaks.currentStreak > 0 && (
        <div className="mt-6">
          <StreakBadge days={streaks.currentStreak} />
        </div>
      )}
    </div>
  );
}
