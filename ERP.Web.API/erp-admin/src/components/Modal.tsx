import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

export default function Modal({ title, onClose, children, size = 'md' }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-gray-900 border border-gray-800/80 rounded-2xl shadow-2xl shadow-black/40 w-full ${sizes[size]} flex flex-col max-h-[90vh] animate-scaleIn`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
