import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { VolumeDataPoint } from '@workout-app/shared';
import { useAuth } from '../../hooks/useAuth';

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
            formatter={(v: number) => [`${v.toLocaleString()} ${unit}`, 'Volume']}
            labelFormatter={(l) => new Date(l).toLocaleDateString()}
          />
          <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
