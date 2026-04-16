import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { WorkoutCard } from '../components/features/WorkoutCard';
import { useWorkouts } from '../api/workouts';

export function WorkoutHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            New Workout
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search workouts..."
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
            <Link
              to="/workouts/active"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
            >
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
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= data.totalPages}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
