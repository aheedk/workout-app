import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useExerciseHistory } from '../../api/exercises';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { chartColors } from '../../theme/palettes';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { parseDateString } from '../../utils/formatting';

interface ProgressChartProps {
  exerciseId: string;
}

export function ProgressChart({ exerciseId }: ProgressChartProps) {
  const { data: history, isLoading } = useExerciseHistory(exerciseId);
  const { user } = useAuth();
  const { palette, resolvedTheme } = useTheme();
  const c = chartColors(palette, resolvedTheme);
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
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => parseDateString(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 11, fill: c.axis }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: c.axis }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 2, color: c.tooltipFg }}
            formatter={(v: number) => [`${v} ${unit}`, 'Max weight']}
            labelFormatter={(l) => parseDateString(String(l)).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="maxWeight"
            stroke={c.accent}
            strokeWidth={2}
            dot={{ r: 3, fill: c.accent }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
