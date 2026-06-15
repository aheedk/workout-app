import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { VolumeDataPoint } from '@workout-app/shared';
import { useAuth } from '../../hooks/useAuth';
import { parseDateString } from '../../utils/formatting';

export function VolumeChart({ data }: { data: VolumeDataPoint[] }) {
  const { user } = useAuth();
  const unit = user?.unitPreference ?? 'kg';

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
        No volume data yet
      </p>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dcd8cc" className="dark:opacity-20" />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => parseDateString(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 11, fill: '#9b9587' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#9b9587' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#151413',
              border: 'none',
              borderRadius: 2,
              color: '#fff',
            }}
            formatter={(v: number) => [`${v.toLocaleString()} ${unit}`, 'Volume']}
            labelFormatter={(l) => parseDateString(String(l)).toLocaleDateString()}
          />
          <Bar dataKey="volume" fill="#f95f11" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
