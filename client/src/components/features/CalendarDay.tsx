interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  workoutCount: number;
  onClick: () => void;
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  isSelected,
  workoutCount,
  onClick,
}: CalendarDayProps) {
  const hasWorkout = workoutCount > 0;

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className={`
        aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative
        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700 pointer-events-none' : ''}
        ${isCurrentMonth && !isToday && !isSelected ? 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
        ${isToday && !isSelected ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-semibold' : ''}
        ${isSelected ? 'bg-blue-600 text-white font-semibold' : ''}
      `}
    >
      <span>{date.getDate()}</span>
      {hasWorkout && (
        <span
          className={`mt-0.5 w-1.5 h-1.5 rounded-full ${
            isSelected ? 'bg-white' : 'bg-blue-600 dark:bg-blue-400'
          }`}
        />
      )}
    </button>
  );
}
