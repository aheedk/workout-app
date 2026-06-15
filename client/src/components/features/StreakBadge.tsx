export function StreakBadge({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="font-mono text-2xl font-bold tabular-nums text-blue-600 dark:text-blue-400 leading-none">
          {days}
        </p>
        <p className="eyebrow mt-1 text-blue-700/80 dark:text-blue-400/80">
          day{days !== 1 ? 's' : ''} streak
        </p>
      </div>
    </div>
  );
}
