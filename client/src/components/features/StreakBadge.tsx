export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300 leading-none">{days}</p>
        <p className="text-xs text-orange-600 dark:text-orange-400">
          day{days !== 1 ? 's' : ''} streak
        </p>
      </div>
    </div>
  );
}
