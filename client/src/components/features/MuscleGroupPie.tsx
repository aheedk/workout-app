import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { MuscleGroupData } from '@workout-app/shared';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#6b7280'];

export function MuscleGroupPie({ data }: { data: MuscleGroupData[] }) {
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
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30,41,59,0.95)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
            }}
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
