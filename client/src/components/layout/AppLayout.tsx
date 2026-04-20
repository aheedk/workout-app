import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe pl-safe pr-safe">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8 pb-28 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
