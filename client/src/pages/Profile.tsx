import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../hooks/useAuth';

export function Profile() {
  const { user, logout } = useAuth();

  return (
    <div>
      <PageHeader title="Profile" />
      <div className="text-gray-600 dark:text-gray-400 mb-4">
        Signed in as {user?.email}
      </div>
      <button
        onClick={() => logout()}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
      >
        Log out
      </button>
    </div>
  );
}
