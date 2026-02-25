import type { LucideIcon } from 'lucide-react';
import { TrendingUp } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'indigo' | 'emerald' | 'violet' | 'amber';
  trend?: string;
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    ring: 'ring-indigo-500/20',
    gradient: 'from-indigo-500/10 to-transparent',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    ring: 'ring-emerald-500/20',
    gradient: 'from-emerald-500/10 to-transparent',
  },
  violet: {
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    ring: 'ring-violet-500/20',
    gradient: 'from-violet-500/10 to-transparent',
  },
  amber: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    ring: 'ring-amber-500/20',
    gradient: 'from-amber-500/10 to-transparent',
  },
};

export default function StatsCard({ title, value, icon: Icon, color = 'indigo', trend }: Props) {
  const c = colorMap[color];
  return (
    <div className="group relative bg-white dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 sm:p-5 hover:border-gray-300 dark:hover:border-gray-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-[10px] sm:text-xs font-medium uppercase tracking-wider truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1.5 sm:mt-2 tabular-nums">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={12} className="text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${c.bg} ring-1 ${c.ring}`}>
          <Icon size={16} className={`sm:hidden ${c.text}`} />
          <Icon size={20} className={`hidden sm:block ${c.text}`} />
        </div>
      </div>
    </div>
  );
}
