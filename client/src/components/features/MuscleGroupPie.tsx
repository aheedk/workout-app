import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { MuscleGroupData } from '@workout-app/shared';

const COLORS = ['#f95f11', '#37342e', '#9b9587', '#ff7a33', '#bd3f06', '#c3beaf', '#56514a', '#ffc7a0'];

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
              backgroundColor: '#151413',
              border: 'none',
              borderRadius: 2,
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
