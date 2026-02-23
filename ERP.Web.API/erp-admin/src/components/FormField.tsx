import type { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormField({ label, error, ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-400">{label}</label>
      <input
        {...props}
        className={`bg-gray-800/60 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all duration-200 ${
          error ? 'border-red-500/50' : 'border-gray-700/60 hover:border-gray-600'
        } ${props.className ?? ''}`}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
