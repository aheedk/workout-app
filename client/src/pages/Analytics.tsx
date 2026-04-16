import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { StreakBadge } from '../components/features/StreakBadge';
import { VolumeChart } from '../components/features/VolumeChart';
import { MuscleGroupPie } from '../components/features/MuscleGroupPie';
import { FrequencyChart } from '../components/features/FrequencyChart';
import { ProgressChart } from '../components/features/ProgressChart';
import { PRBadge } from '../components/features/PRBadge';
import {
  useSummary,
  useStreaks,
  useVolume,
  useMuscleGroups,
  useFrequency,
} from '../api/analytics';
import { useExercises, useAllRecords } from '../api/exercises';
import { useAuth } from '../hooks/useAuth';
import { formatDuration, formatRelativeDate } from '../utils/formatting';
import type { PersonalRecord } from '@workout-app/shared';

const RECORD_LABELS: Record<PersonalRecord['recordType'], string> = {
  max_weight: 'Max weight',
  max_reps: 'Max reps',
  max_volume: 'Max volume',
  est_1rm: 'Est. 1RM',
};

const CARD_CLASS =
  'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5';

export function Analytics() {
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  const { data: summary, isLoading: loadingSummary } = useSummary();
  const { data: streaks } = useStreaks();
  const { data: volume } = useVolume(12);
  const { data: muscleGroups } = useMuscleGroups();
  const { data: frequency } = useFrequency(12);
  const { data: records } = useAllRecords();
  const { data: exercises } = useExercises();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

  const topRecords = (records ?? [])
    .slice()
    .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
    .slice(0, 5);

  if (loadingSummary) {
    return (
      <div className="py-16">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Analytics" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="This Month"
          value={summary?.workoutsThisMonth ?? 0}
          subtext="workouts"
        />
        <StatCard
          label="Volume"
          value={(summary?.totalVolumeThisMonth ?? 0).toLocaleString()}
          subtext={`${unit} this month`}
        />
        <StatCard
          label="Avg Duration"
          value={summary?.avgDurationMinutes ? formatDuration(summary.avgDurationMinutes) : '—'}
        />
      </div>

      {streaks && (streaks.currentStreak > 0 || streaks.longestStreak > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <StreakBadge days={streaks.currentStreak} />
          {streaks.longestStreak > streaks.currentStreak && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Longest streak: {streaks.longestStreak} day{streaks.longestStreak !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      <div className={`${CARD_CLASS} mt-6`}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Volume (last 12 weeks)
        </h3>
        <VolumeChart data={volume ?? []} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className={CARD_CLASS}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Muscle Groups</h3>
          <MuscleGroupPie data={muscleGroups ?? []} />
        </div>

        <div className={CARD_CLASS}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Personal Records</h3>
          {topRecords.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No PRs yet — finish a workout to start tracking.
            </p>
          ) : (
            <ul className="space-y-3">
              {topRecords.map((pr) => (
                <li
                  key={pr.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PRBadge size="xs" />
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {pr.exerciseName}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {RECORD_LABELS[pr.recordType]} · {formatRelativeDate(pr.achievedAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatRecordValue(pr, unit)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={`${CARD_CLASS} mt-6`}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Workout Frequency (last 12 weeks)
        </h3>
        <FrequencyChart data={frequency ?? []} />
      </div>

      <div className={`${CARD_CLASS} mt-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Exercise Progress</h3>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Select an exercise…</option>
            {exercises?.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>
        {selectedExerciseId ? (
          <ProgressChart exerciseId={selectedExerciseId} />
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            Pick an exercise above to chart your max weight over time.
          </p>
        )}
      </div>

      {(records?.length ?? 0) === 0 && (summary?.workoutsThisMonth ?? 0) === 0 && (
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Log a <Link to="/workouts/active" className="text-blue-600 dark:text-blue-400 hover:underline">workout</Link> to
          start seeing analytics.
        </p>
      )}
    </div>
  );
}

function formatRecordValue(pr: PersonalRecord, unit: 'kg' | 'lb'): string {
  switch (pr.recordType) {
    case 'max_weight':
    case 'est_1rm':
      return `${pr.value} ${unit}`;
    case 'max_reps':
      return `${pr.value} reps`;
    case 'max_volume':
      return `${pr.value.toLocaleString()} ${unit}`;
  }
}
