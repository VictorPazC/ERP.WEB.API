import { createContext, useContext, useState, type ReactNode } from 'react';

export type AppRole = 'Admin' | 'Viewer';

export interface ActiveUser {
  userId?: number;
  name: string;
  email?: string;
  role: AppRole;
  /** true = authenticated against DB password, false = guest/demo mode */
  authenticated: boolean;
}

interface UserContextValue {
  user: ActiveUser;
  setUser: (u: ActiveUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
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
  isAdmin: false,
  isAuthenticated: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<ActiveUser>(loadUser);

  const setUser = (u: ActiveUser) => {
    setUserState(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  };

  const logout = () => {
    setUserState(GUEST_USER);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <UserContext.Provider value={{
      user,
      setUser,
      logout,
      isAdmin: user.role === 'Admin',
      isAuthenticated: user.authenticated,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
