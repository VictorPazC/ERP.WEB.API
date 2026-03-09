import { useState, useRef, useEffect } from 'react';
import { Factory, ChevronDown, Check } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useQueryClient } from '@tanstack/react-query';

export default function CompanySelector() {
  const { user, switchCompany, isSuperAdmin } = useUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  if (!isSuperAdmin || !user.companies || user.companies.length <= 1) return null;

  const handleSwitch = (companyId: number, companyName: string) => {
    switchCompany(companyId, companyName);
    setOpen(false);
    // Invalidate all queries so data refetches for the new company
    qc.invalidateQueries();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-500/15 ring-1 ring-indigo-500/25 flex items-center justify-center flex-shrink-0">
          <Factory size={14} className="text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{user.companyName ?? 'Select company'}</p>
          <p className="text-[10px] text-gray-500">Switch company</p>
        </div>
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="max-h-48 overflow-y-auto py-1">
            {user.companies.map(p => (
              <button
                key={p.companyId}
                onClick={() => handleSwitch(p.companyId, p.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  p.companyId === user.companyId
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Factory size={13} className="flex-shrink-0" />
                <span className="flex-1 truncate">{p.name}</span>
                {p.companyId === user.companyId && <Check size={13} className="flex-shrink-0 text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
