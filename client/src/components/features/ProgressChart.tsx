import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useExerciseHistory } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProgressChartProps {
  exerciseId: string;
}

export function ProgressChart({ exerciseId }: ProgressChartProps) {
  const { data: history, isLoading } = useExerciseHistory(exerciseId);
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No history for this exercise yet
      </p>
    );
  }

  const chartData = [...history]
    .reverse()
    .map((session) => {
      const maxWeight = session.sets.reduce((max, s) => {
        if (s.weight == null) return max;
        return s.weight > max ? s.weight : max;
      }, 0);
      return {
        date: session.date,
        maxWeight,
      };
    })
    .filter((d) => d.maxWeight > 0);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30,41,59,0.95)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
            }}
            formatter={(v: number) => [`${v} ${unit}`, 'Max weight']}
            labelFormatter={(l) => new Date(l).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
