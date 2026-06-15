import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { MuscleGroupData } from '@workout-app/shared';
import { useTheme } from '../../hooks/useTheme';
import { chartColors } from '../../theme/palettes';

export function MuscleGroupPie({ data }: { data: MuscleGroupData[] }) {
  const { palette, resolvedTheme } = useTheme();
  const c = chartColors(palette, resolvedTheme);

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No exercise data yet
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="muscleGroup"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(entry: { percentage?: number }) =>
              entry.percentage != null ? `${entry.percentage.toFixed(0)}%` : ''
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={c.pie[i % c.pie.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 2, color: c.tooltipFg }}
            formatter={(v: number, _name, item) => [
              `${v} sets (${(item.payload as MuscleGroupData).percentage.toFixed(0)}%)`,
              (item.payload as MuscleGroupData).muscleGroup,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => <span className="capitalize">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
