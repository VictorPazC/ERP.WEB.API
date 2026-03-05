import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="p-5 bg-gray-100 dark:bg-gray-800/50 rounded-2xl ring-1 ring-gray-200 dark:ring-gray-700/30">
        <Icon size={32} className="text-gray-400 dark:text-gray-600" />
      </div>
      <div className="text-center">
        <h3 className="text-gray-900 dark:text-white font-medium">{title}</h3>
        <p className="text-gray-500 dark:text-gray-600 text-sm mt-1 max-w-xs">{description}</p>
      </div>
    </div>
  );
}
