import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 pt-safe pl-safe pr-safe">
      <div className="grain-overlay" aria-hidden />
      <Sidebar />
      <div className="relative z-10 lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-10 pb-28 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
