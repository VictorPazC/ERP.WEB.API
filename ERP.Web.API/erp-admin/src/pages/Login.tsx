import { useState } from 'react';
import { Boxes, Eye, EyeOff, LogIn, Factory } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../api/users';
import { useUser, type AppRole } from '../context/UserContext';
import type { CompanySummary } from '../types';

export default function Login() {
  const { setUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Company selector state (shown after login for SuperAdmin with multiple companies)
  const [pendingLogin, setPendingLogin] = useState<{
    token: string; userId: number; name: string; email: string; role: AppRole;
    isSuperAdmin: boolean; companies: CompanySummary[];
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await usersApi.login({ email, password });
      const role: AppRole = (result.role === 'Admin' || result.role === 'Manager') ? 'Admin' : 'Viewer';

      // If SuperAdmin with multiple companies → show company selector
      if (result.isSuperAdmin && result.companies && result.companies.length > 1) {
        setPendingLogin({
          token: result.token, userId: result.userId, name: result.name,
          email: result.email, role, isSuperAdmin: true, companies: result.companies,
        });
        return;
      }

      // Regular user or SuperAdmin with 1 company → login immediately
      setUser({
        userId: result.userId, name: result.name, email: result.email, role,
        authenticated: true, token: result.token,
        companyId: result.companyId, companyName: result.companyName,
        isSuperAdmin: result.isSuperAdmin, companies: result.companies,
      });
      toast.success(`Welcome, ${result.name}`);
    } catch {
      toast.error('Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handlePickCompany = (company: CompanySummary) => {
    if (!pendingLogin) return;
    setUser({
      userId: pendingLogin.userId, name: pendingLogin.name, email: pendingLogin.email,
      role: pendingLogin.role, authenticated: true, token: pendingLogin.token,
      companyId: company.companyId, companyName: company.name,
      isSuperAdmin: pendingLogin.isSuperAdmin, companies: pendingLogin.companies,
    });
    toast.success(`Welcome, ${pendingLogin.name} — ${company.name}`);
  };

  // Company selector screen
  if (pendingLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
              <Factory size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Select Company</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose which company to manage</p>
          </div>
          <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-4 shadow-xl shadow-black/5 space-y-2">
            {pendingLogin.companies.map(p => (
              <button
                key={p.companyId}
                onClick={() => handlePickCompany(p)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  {p.logoUrl
                    ? <img src={p.logoUrl} alt="" className="w-6 h-6 rounded object-cover" />
                    : <Factory size={18} className="text-indigo-500" />
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-600 truncate">{p.slug}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={() => setPendingLogin(null)}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-4">
            <Boxes size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">ERP Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-xl shadow-black/5 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@company.com"
                className="bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-gray-100 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700/60 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 disabled:opacity-60 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
