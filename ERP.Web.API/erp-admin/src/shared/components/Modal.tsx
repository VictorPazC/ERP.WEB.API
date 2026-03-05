import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

export default function Modal({ title, onClose, children, size = 'md' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-gray-900 border-t sm:border border-gray-200 dark:border-gray-800/80 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 w-full ${sizes[size]} flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-scaleIn`}>
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800/60">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-700 sm:hidden" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mt-1 sm:mt-0">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
