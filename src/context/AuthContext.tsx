import { createContext, useContext, useState, type ReactNode } from 'react';
import { getSession, setSession, clearSession, initAdminIfNeeded, checkAndProcessInterest, type User } from '../utils/localStorageDB';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    initAdminIfNeeded();
    checkAndProcessInterest();
    return getSession();
  });
  const [loading] = useState(false);

  const login = (u: User) => {
    setSession(u);
    setUser(u);
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  const refreshUser = () => {
    const sessionUser = getSession();
    if (sessionUser) setUser(sessionUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
