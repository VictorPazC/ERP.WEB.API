import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { CompanySummary } from '../types';

export type AppRole = 'Admin' | 'Viewer';

export interface ActiveUser {
  userId?: number;
  name: string;
  email?: string;
  role: AppRole;
  /** true = authenticated against DB password */
  authenticated: boolean;
  /** JWT token */
  token?: string;
  /** Current company */
  companyId?: number;
  companyName?: string;
  isSuperAdmin?: boolean;
  companies?: CompanySummary[];
}

interface UserContextValue {
  user: ActiveUser;
  setUser: (u: ActiveUser) => void;
  logout: () => void;
  switchCompany: (companyId: number, companyName: string) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const STORAGE_KEY = 'erp-active-user';

const GUEST_USER: ActiveUser = { name: 'Guest', role: 'Viewer', authenticated: false };

function loadUser(): ActiveUser {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActiveUser;
      if (parsed.name && (parsed.role === 'Admin' || parsed.role === 'Viewer')) return parsed;
    }
  } catch {}
  return GUEST_USER;
}

const UserContext = createContext<UserContextValue>({
  user: GUEST_USER,
  setUser: () => {},
  logout: () => {},
  switchCompany: () => {},
  isAdmin: false,
  isAuthenticated: false,
  isSuperAdmin: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ActiveUser>(loadUser);

  const setUser = useCallback((u: ActiveUser) => {
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    // Also store token and companyId separately for the API interceptor
    if (u.token) localStorage.setItem('erp-token', u.token);
    if (u.companyId) localStorage.setItem('erp-company-id', String(u.companyId));
  }, []);

  const logout = useCallback(() => {
    setUserState(GUEST_USER);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('erp-token');
    localStorage.removeItem('erp-company-id');
  }, []);

  const switchCompany = useCallback((companyId: number, companyName: string) => {
    setUserState(prev => {
      const updated = { ...prev, companyId, companyName };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem('erp-company-id', String(companyId));
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      logout,
      switchCompany,
      isAdmin: user.role === 'Admin',
      isAuthenticated: user.authenticated,
      isSuperAdmin: user.isSuperAdmin ?? false,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
