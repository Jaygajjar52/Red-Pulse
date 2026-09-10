import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/api';
import { clearTokens, persistTokens, registerAuthHandlers } from '@/api/axios';
import type { LoginRequest, RegisterRequest, User } from '@/types';
import { normalizeApiError } from '@/api/errors';

interface AuthContextValue {
  user: User | null;
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<User>;
  register: (payload: RegisterRequest) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    if (window.location.pathname !== '/login') {
      window.location.assign('/login');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('redpulse.refreshToken');
    if (!refreshToken) return null;
    try {
      const response = await authApi.refresh(refreshToken);
      persistTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      return response.accessToken;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    registerAuthHandlers({
      refresh: refreshSession,
      onUnauthorized: () => {
        clearTokens();
        setUser(null);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      },
    });
  }, [refreshSession]);

  useEffect(() => {
    const token = localStorage.getItem('redpulse.accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(async () => {
        const restored = await refreshSession();
        if (!restored) setUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshSession]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authApi.login(payload);
    persistTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await authApi.register(payload);
    persistTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    return response.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      currentUser: user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function roleHome(role: User['role']): string {
  switch (role) {
    case 'DONOR':
      return '/donor/dashboard';
    case 'REQUESTER':
      return '/requester/dashboard';
    case 'HOSPITAL':
      return '/hospital/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

export function getAuthErrorMessage(error: unknown): string {
  return normalizeApiError(error).message;
}
