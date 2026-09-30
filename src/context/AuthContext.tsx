import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  changePassword,
  connectRiot,
  currentUser,
  login,
  logout,
  recoveryOptions,
  registerAccount,
  resetPassword,
  restoreSession,
  type AuthUser,
  type ChampionOption,
} from '../services/backendAuth';

type AuthStatus = 'loading' | 'anonymous' | 'authenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: Parameters<typeof registerAccount>[0]) => Promise<void>;
  signOut: () => Promise<void>;
  loadRecoveryOptions: () => Promise<{ elos: string[]; champions: ChampionOption[] }>;
  recover: (payload: Parameters<typeof resetPassword>[0]) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  linkRiot: (gameName: string, tagLine: string, region: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setStatus(restored ? 'authenticated' : 'anonymous');
      })
      .catch(() => {
        if (!active) return;
        setStatus('anonymous');
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    error,
    clearError: () => setError(null),
    signIn: async (email, password) => {
      setError(null);
      try {
        const next = await login(email, password);
        setUser(next);
        setStatus('authenticated');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
        throw err;
      }
    },
    signUp: async (payload) => {
      setError(null);
      try {
        const next = await registerAccount(payload);
        setUser(next);
        setStatus('authenticated');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
        throw err;
      }
    },
    signOut: async () => {
      await logout();
      setUser(null);
      setStatus('anonymous');
    },
    loadRecoveryOptions: recoveryOptions,
    recover: async (payload) => {
      setError(null);
      try {
        await resetPassword(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo recuperar la cuenta.');
        throw err;
      }
    },
    updatePassword: async (currentPassword, newPassword) => {
      setError(null);
      try {
        await changePassword(currentPassword, newPassword);
        await logout();
        setUser(null);
        setStatus('anonymous');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.');
        throw err;
      }
    },
    linkRiot: async (gameName, tagLine, region) => {
      setError(null);
      try {
        await connectRiot(gameName, tagLine, region);
        setUser(await currentUser());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo vincular Riot.');
        throw err;
      }
    },
  }), [error, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
