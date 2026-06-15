import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { FrequencyDataPoint } from '@workout-app/shared';
import { parseDateString } from '../../utils/formatting';

export function FrequencyChart({ data }: { data: FrequencyDataPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No frequency data yet
      </p>
    );
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcd8cc" className="dark:opacity-20" />
          <XAxis
            dataKey="week"
            tickFormatter={(v) => parseDateString(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 11, fill: '#9b9587' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9b9587' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#151413',
              border: 'none',
              borderRadius: 2,
              color: '#fff',
            }}
            formatter={(v: number) => [`${v} workouts`, 'Frequency']}
            labelFormatter={(l) => parseDateString(String(l)).toLocaleDateString()}
          />
          <Bar dataKey="count" fill="#ff7a33" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
