import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '../components/ui/PageHeader';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GoalProgress } from '../components/features/GoalProgress';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../components/ui/Toast';
import { useUpdateProfile, useChangePassword } from '../api/users';
import { useBodyweightLogs, useLogBodyweight, useDeleteBodyweight } from '../api/bodyweight';
import { useGoals, useCreateGoal, useDeleteGoal } from '../api/goals';
import { useExercises } from '../api/exercises';
import { formatDate } from '../utils/formatting';
import type { Goal, CreateGoalRequest } from '@workout-app/shared';

const CARD_CLASS =
  'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5';
const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export function Profile() {
  const { user, logout } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  return (
    <div>
      <PageHeader title="Profile" />

      <div className="max-w-2xl space-y-6">
        <AccountCard />
        <PreferencesCard />
        <PasswordCard />
        <BodyweightCard unit={unit} />
        <GoalsCard unit={unit} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Signed in as {user?.email}
          </p>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountCard() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState(user?.name ?? '');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const nameChanged = name.trim() !== '' && name !== user?.name;

  const saveName = async () => {
    if (!nameChanged || !user) return;
    try {
      const updated = await updateProfile.mutateAsync({ name: name.trim() });
      updateUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        unitPreference: updated.unitPreference,
        theme: updated.theme,
      });
      showToast('Profile updated', 'success');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  return (
    <section className={CARD_CLASS}>
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Account</h2>
      <div className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
            <button
              onClick={saveName}
              disabled={!nameChanged || updateProfile.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg shrink-0"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Email</label>
          <input
            type="email"
            value={user?.email ?? ''}
            disabled
            className={`${INPUT_CLASS} opacity-60 cursor-not-allowed`}
          />
        </div>
      </div>
    </section>
  );
}

function PreferencesCard() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const updateProfile = useUpdateProfile();

  const setUnit = async (unitPreference: 'kg' | 'lb') => {
    if (!user || user.unitPreference === unitPreference) return;
    try {
      const updated = await updateProfile.mutateAsync({ unitPreference });
      updateUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        unitPreference: updated.unitPreference,
        theme: updated.theme,
      });
    } catch {
      showToast('Failed to update unit preference', 'error');
    }
  };

  return (
    <section className={CARD_CLASS}>
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
      <div className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Units</label>
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(['kg', 'lb'] as const).map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  user?.unitPreference === u
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Theme</label>
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  theme === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

function PasswordCard() {
  const { showToast } = useToast();
  const changePassword = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const onSubmit = async (data: PasswordForm) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      showToast('Password changed', 'success');
      reset();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      showToast(error.response?.data?.message ?? 'Failed to change password', 'error');
    }
  };

  return (
    <section className={CARD_CLASS}>
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Current password</label>
          <input
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            className={INPUT_CLASS}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.currentPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS}>New password</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('newPassword')}
            className={INPUT_CLASS}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.newPassword.message}
            </p>
          )}
        </div>
        <div>
          <label className={LABEL_CLASS}>Confirm new password</label>
          <input
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={INPUT_CLASS}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg"
        >
          {isSubmitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  );
}

function BodyweightCard({ unit }: { unit: 'kg' | 'lb' }) {
  const { showToast } = useToast();
  const { data: logs } = useBodyweightLogs();
  const logMutation = useLogBodyweight();
  const deleteMutation = useDeleteBodyweight();
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [toDelete, setToDelete] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || Number.isNaN(w)) {
      showToast('Enter a valid weight', 'error');
      return;
    }
    try {
      await logMutation.mutateAsync({
        weight: w,
        date,
        notes: notes.trim() || undefined,
      });
      showToast('Bodyweight logged', 'success');
      setWeight('');
      setNotes('');
    } catch {
      showToast('Failed to log bodyweight', 'error');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete);
      showToast('Entry deleted', 'success');
    } catch {
      showToast('Failed to delete entry', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <section className={CARD_CLASS}>
      <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Bodyweight</h2>

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mb-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Weight ({unit})
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`e.g. 75.5`}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={logMutation.isPending || !weight}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg"
          >
            Log
          </button>
        </div>
        <div className="sm:col-span-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className={INPUT_CLASS}
          />
        </div>
      </form>

      {logs && logs.length > 0 ? (
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {logs.map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {log.weight} {unit}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(log.date)}
                  {log.notes && ` · ${log.notes}`}
                </p>
              </div>
              <button
                onClick={() => setToDelete(log.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline shrink-0"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No bodyweight logged yet.
        </p>
      )}

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Delete entry?"
        message="This will permanently remove this bodyweight entry."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}

function GoalsCard({ unit }: { unit: 'kg' | 'lb' }) {
  const { showToast } = useToast();
  const { data: goals } = useGoals();
  const deleteMutation = useDeleteGoal();
  const [isCreating, setIsCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Goal | null>(null);

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      showToast('Goal deleted', 'success');
    } catch {
      showToast('Failed to delete goal', 'error');
    } finally {
      setToDelete(null);
    }
  };

  return (
    <section className={CARD_CLASS}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Goals</h2>
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
        >
          + New Goal
        </button>
      </div>

      {goals && goals.length > 0 ? (
        <ul className="space-y-4">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <GoalProgress goal={goal} unit={unit} />
              </div>
              <button
                onClick={() => setToDelete(goal)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline shrink-0 mt-0.5"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No goals yet. Create one to start tracking progress.
        </p>
      )}

      <CreateGoalModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        unit={unit}
      />

      <ConfirmDialog
        isOpen={toDelete !== null}
        title="Delete goal?"
        message="This will permanently remove this goal."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
}

function CreateGoalModal({
  isOpen,
  onClose,
  unit,
}: {
  isOpen: boolean;
  onClose: () => void;
  unit: 'kg' | 'lb';
}) {
  const { showToast } = useToast();
  const createGoal = useCreateGoal();
  const { data: exercises } = useExercises();
  const [type, setType] = useState<'workouts_per_week' | 'exercise_target'>('workouts_per_week');
  const [targetValue, setTargetValue] = useState('');
  const [exerciseId, setExerciseId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType('workouts_per_week');
      setTargetValue('');
      setExerciseId('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tv = parseFloat(targetValue);
    if (!tv || Number.isNaN(tv) || tv <= 0) {
      showToast('Enter a valid target value', 'error');
      return;
    }
    if (type === 'exercise_target' && !exerciseId) {
      showToast('Pick an exercise', 'error');
      return;
    }
    const payload: CreateGoalRequest =
      type === 'workouts_per_week'
        ? { type, targetValue: Math.round(tv) }
        : { type, targetValue: tv, exerciseId, targetWeight: tv };
    try {
      await createGoal.mutateAsync(payload);
      showToast('Goal created', 'success');
      onClose();
    } catch {
      showToast('Failed to create goal', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Goal" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('workouts_per_week')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                type === 'workouts_per_week'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Workouts/week
            </button>
            <button
              type="button"
              onClick={() => setType('exercise_target')}
              className={`px-3 py-2 text-sm font-medium rounded-lg border ${
                type === 'exercise_target'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              Exercise target
            </button>
          </div>
        </div>

        {type === 'exercise_target' && (
          <div>
            <label className={LABEL_CLASS}>Exercise</label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="">Select an exercise…</option>
              {exercises?.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>
            {type === 'workouts_per_week' ? 'Workouts per week' : `Target weight (${unit})`}
          </label>
          <input
            type="number"
            step={type === 'workouts_per_week' ? '1' : '0.5'}
            min="0"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder={type === 'workouts_per_week' ? 'e.g. 4' : `e.g. 100`}
            className={INPUT_CLASS}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createGoal.isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg"
          >
            {createGoal.isPending ? 'Creating…' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
