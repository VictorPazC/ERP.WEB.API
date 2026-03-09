import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { WeeklyStat } from '../types';

interface Props {
  data: WeeklyStat[];
}

export default function WeeklySalesChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-6">
      <h3 className="text-gray-900 dark:text-white font-semibold text-sm mb-4">Weekly Performance</h3>
      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1f2937',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
                color: '#f9fafb',
                fontSize: 12,
              }}
              formatter={(value, name) => {
                const v = Number(value ?? 0);
                return name === 'ganancia'
                  ? [`$${v.toFixed(2)}`, 'Profit']
                  : [v, 'Orders'];
              }}
            />
            <Legend
              formatter={v => (v === 'ganancia' ? 'Profit' : 'Orders')}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="ganancia" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pedidos" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
