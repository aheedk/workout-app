import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { RoutineCard } from '../components/features/RoutineCard';
import { useRoutines } from '../api/routines';

export function Routines() {
  const { data: routines, isLoading } = useRoutines();

  return (
    <div>
      <PageHeader
        title="Routines"
        action={
          <Link to="/routines/new" className="btn-primary">
            New Routine
          </Link>
        }
      />

      {isLoading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : !routines || routines.length === 0 ? (
        <EmptyState
          title="No routines yet"
          description="Create a reusable workout template to save time."
          action={
            <Link to="/routines/new" className="btn-primary">
              Create Routine
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} />
          ))}
        </div>
      )}
    </div>
  );
}
