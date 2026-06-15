import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { WorkoutCard } from '../components/features/WorkoutCard';
import { useWorkouts } from '../api/workouts';
import { hasActiveWorkout } from '../utils/activeWorkoutStorage';

export function WorkoutHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [paused, setPaused] = useState(() => hasActiveWorkout());

  useEffect(() => {
    const refresh = () => setPaused(hasActiveWorkout());
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const { data, isLoading } = useWorkouts({ page, limit: 10, search: search || undefined });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Workouts"
        action={
          <Link
            to="/workouts/active"
            className={`btn px-4 py-2.5 ${
              paused ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-on-accent'
            }`}
          >
            {paused ? 'Resume Workout' : 'New Workout'} <span aria-hidden>→</span>
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search workouts…"
          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
      </form>

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          description="Start your first workout to track your progress."
          action={
            <Link to="/workouts/active" className="btn-primary">
              Start Workout
            </Link>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.data.map((workout) => (
              <WorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="btn-ghost disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="eyebrow">
                Page {page} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.totalPages}
                className="btn-ghost disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
