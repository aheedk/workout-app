import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { PRBadge } from './PRBadge';
import { useExerciseHistory, useExerciseRecords, useBackfillRecords } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ui/Toast';
import { formatDate } from '../../utils/formatting';
import type { PersonalRecord } from '@workout-app/shared';

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
