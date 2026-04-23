import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PRBadge } from './PRBadge';
import { useExerciseHistory, useExerciseRecords, useBackfillRecords } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { formatDate } from '../../utils/formatting';
import type { ExerciseHistory, PersonalRecord } from '@workout-app/shared';

interface ExerciseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string | undefined;
  exerciseName: string;
}

const RECORD_LABELS: Record<PersonalRecord['recordType'], string> = {
  max_weight: 'Max weight',
  max_reps: 'Max reps',
  max_volume: 'Max volume',
  est_1rm: 'Est. 1RM',
};

export function ExerciseHistoryModal({ isOpen, onClose, exerciseId, exerciseName }: ExerciseHistoryModalProps) {
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';
  const { data: history, isLoading } = useExerciseHistory(exerciseId);
  const { data: records } = useExerciseRecords(exerciseId);
  const backfill = useBackfillRecords();
  const { showToast } = useToast();

  const handleBackfill = async () => {
    try {
      const r = await backfill.mutateAsync();
      showToast(`Scanned ${r.workoutsScanned} workouts · found ${r.totalPrs} PRs`, 'success');
    } catch {
      showToast('Backfill failed', 'error');
    }
  };

  const hasHistory = history && history.length > 0;
  const hasRecords = records && records.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exerciseName} size="lg">
      {isLoading ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-5">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Personal Records
              </h3>
              {hasHistory && !hasRecords && (
                <button
                  onClick={handleBackfill}
                  disabled={backfill.isPending}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
                >
                  {backfill.isPending ? 'Scanning…' : 'Scan for PRs'}
                </button>
              )}
            </div>
            {hasRecords ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {records.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/40"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">{RECORD_LABELS[pr.recordType]}</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatRecordValue(pr, unit)}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{formatDate(pr.achievedAt)}</p>
                  </div>
                ))}
              </div>
            ) : hasHistory ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No PRs recorded yet for this exercise. Click{' '}
                <span className="text-blue-600 dark:text-blue-400">Scan for PRs</span>{' '}
                to compute them from your past workouts.
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                PRs will appear here once you log some sets.
              </p>
            )}
          </section>

          {hasHistory && <ProgressGraph history={history} unit={unit} />}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              Recent Sessions
            </h3>
            {!history || history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                No history for this exercise yet.
              </p>
            ) : (
              <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {history.map((session, i) => (
                  <li
                    key={`${session.workoutId}-${i}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/workouts/${session.workoutId}`}
                          onClick={onClose}
                          className="font-medium text-gray-900 dark:text-white hover:underline truncate block"
                        >
                          {session.workoutName}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(session.date)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[28px_1fr_1fr_auto_auto] gap-2 text-xs text-gray-500 dark:text-gray-400 pb-1">
                      <span className="text-center">#</span>
                      <span>Weight</span>
                      <span>Reps</span>
                      <span>RPE</span>
                      <span></span>
                    </div>
                    <div className="space-y-0.5">
                      {(() => {
                        let workSetNumber = 0;
                        return session.sets.map((set, j) => {
                          if (!set.isWarmup && !set.isDropset) workSetNumber++;
                          const label = set.isWarmup
                            ? 'W'
                            : set.isDropset
                            ? 'D'
                            : String(workSetNumber);
                          return (
                            <div
                              key={j}
                              className={`grid grid-cols-[28px_1fr_1fr_auto_auto] gap-2 items-center text-sm py-1 px-1 rounded ${
                                set.isDropset ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                              }`}
                            >
                              <span
                                className={`text-center font-medium ${
                                  set.isDropset
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : set.isWarmup
                                    ? 'text-gray-400 dark:text-gray-500'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {label}
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {set.weight != null ? `${set.weight} ${unit}` : '—'}
                              </span>
                              <span className="text-gray-900 dark:text-white">{set.reps ?? '—'}</span>
                              <span className="text-gray-500 dark:text-gray-400">{set.rpe ?? ''}</span>
                              <span>{set.isPr && <PRBadge size="xs" />}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
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

type Metric = 'est_1rm' | 'top_weight' | 'top_volume' | 'total_volume' | 'top_reps';

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'est_1rm', label: 'Est. 1RM' },
  { value: 'top_weight', label: 'Top weight' },
  { value: 'top_volume', label: 'Top set volume' },
  { value: 'total_volume', label: 'Total volume' },
  { value: 'top_reps', label: 'Top reps' },
];

function computeMetric(session: ExerciseHistory, metric: Metric): number | null {
  const workSets = session.sets.filter((s) => !s.isWarmup);
  const nonDrop = workSets.filter((s) => !s.isDropset);

  let v = 0;
  switch (metric) {
    case 'est_1rm':
      v = nonDrop.reduce((m, s) => {
        if (s.weight == null || s.reps == null) return m;
        const e1rm = s.weight * (1 + s.reps / 30);
        return e1rm > m ? e1rm : m;
      }, 0);
      break;
    case 'top_weight':
      v = nonDrop.reduce((m, s) => (s.weight != null && s.weight > m ? s.weight : m), 0);
      break;
    case 'top_volume':
      v = nonDrop.reduce((m, s) => {
        if (s.weight == null || s.reps == null) return m;
        const vol = s.weight * s.reps;
        return vol > m ? vol : m;
      }, 0);
      break;
    case 'total_volume':
      v = workSets.reduce((sum, s) => {
        if (s.weight == null || s.reps == null) return sum;
        return sum + s.weight * s.reps;
      }, 0);
      break;
    case 'top_reps':
      v = nonDrop.reduce((m, s) => (s.reps != null && s.reps > m ? s.reps : m), 0);
      break;
  }
  return v > 0 ? Math.round(v * 100) / 100 : null;
}

function metricSuffix(metric: Metric, unit: 'kg' | 'lb'): string {
  if (metric === 'top_reps') return 'reps';
  return unit;
}

function ProgressGraph({ history, unit }: { history: ExerciseHistory[]; unit: 'kg' | 'lb' }) {
  const [metric, setMetric] = useState<Metric>('est_1rm');

  const data = useMemo(() => {
    return history
      .slice()
      .reverse() // history is newest-first; chart left→right in chronological order
      .map((s) => ({ date: s.date, value: computeMetric(s, metric) }))
      .filter((d): d is { date: string; value: number } => d.value != null);
  }, [history, metric]);

  const suffix = metricSuffix(metric, unit);

  return (
    <section>
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Progress
        </h3>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {METRIC_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {data.length < 2 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
          Log at least two sessions to see a trend.
        </p>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) =>
                  new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })
                }
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30,41,59,0.95)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v.toLocaleString()} ${suffix}`, METRIC_OPTIONS.find((o) => o.value === metric)?.label]}
                labelFormatter={(l) => new Date(l).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
