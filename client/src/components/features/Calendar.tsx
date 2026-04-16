import { useState, useMemo } from 'react';
import { CalendarDay } from './CalendarDay';
import { useCalendarData } from '../../api/workouts';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarProps {
  onDaySelect: (date: string, workoutIds: string[]) => void;
}

export function Calendar({ onDaySelect }: CalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: calendarData, isLoading } = useCalendarData(year, month + 1);

  const byDate = useMemo(() => {
    const map = new Map<string, { count: number; ids: string[] }>();
    calendarData?.forEach((d) => {
      map.set(d.date, { count: d.workoutCount, ids: d.workoutIds });
    });
    return map;
  }, [calendarData]);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const days: Date[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const endWeekday = lastDay.getDay();
  for (let i = 1; i < 7 - endWeekday; i++) {
    days.push(new Date(year, month + 1, i));
  }

  const prevMonth = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  const handleDayClick = (date: Date) => {
    const iso = date.toISOString().split('T')[0];
    setSelectedDate(iso);
    const entry = byDate.get(iso);
    onDaySelect(iso, entry?.ids ?? []);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Previous month"
        >
          ←
        </button>
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {isLoading ? (
        <div className="py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              const iso = date.toISOString().split('T')[0];
              const entry = byDate.get(iso);
              const isToday =
                date.getDate() === today.getDate() &&
                date.getMonth() === today.getMonth() &&
                date.getFullYear() === today.getFullYear();
              return (
                <CalendarDay
                  key={i}
                  date={date}
                  isCurrentMonth={date.getMonth() === month}
                  isToday={isToday}
                  isSelected={selectedDate === iso}
                  workoutCount={entry?.count ?? 0}
                  onClick={() => handleDayClick(date)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
