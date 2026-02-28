import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearLabel?: string;
}

export default function SearchableSelect({ label, options, value, onChange, placeholder = 'Buscar…', clearLabel = 'Ninguno' }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) { setQuery(''); return; }
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pick = (v: string) => { onChange(v); setOpen(false); };

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-left hover:border-gray-400 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
      >
        <span className={`flex-1 truncate ${selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
          {selected ? selected.label : clearLabel}
        </span>
        {selected
          ? <X size={14} className="text-gray-400 flex-shrink-0" onClick={e => { e.stopPropagation(); pick(''); }} />
          : <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {open && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800/60">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
                onKeyDown={e => { if (e.key === 'Escape') setOpen(false); }}
              />
              {query && <button type="button" onClick={() => setQuery('')}><X size={12} className="text-gray-400 hover:text-gray-600" /></button>}
            </div>
            <ul className="max-h-52 overflow-y-auto py-1">
              <li>
                <button type="button" onClick={() => pick('')}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${!value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                  {clearLabel}
                </button>
              </li>
              {filtered.length === 0
                ? <li className="px-3 py-2 text-xs text-gray-400 dark:text-gray-600">Sin resultados</li>
                : filtered.map(o => (
                  <li key={o.value}>
                    <button type="button" onClick={() => pick(o.value)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === o.value ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                      {o.label}
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
