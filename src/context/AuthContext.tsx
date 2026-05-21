import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User, AuthState } from '@/types/domain.types';
import { auth } from '@/config/firebase';
import { signInWithGoogle, signOutGoogle, mapFirebaseUser } from '@/services/auth/googleAuth';
import { clearTokens } from '@/store/auth.store';
import { clearBookmarks } from '@/store/bookmarks.store';
import { cancelAllNotifications } from '@/services/notifications/scheduler';
import {
  localLogin,
  localRegister,
  clearLocalSession,
} from '@/store/local.auth.store';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  updateLocalUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to Firebase auth state — fires on app start, Google sign-in, sign-out
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        // Firebase has no session — fall back to local session check
        import('@/store/local.auth.store')
          .then(({ getLocalSession }) => getLocalSession())
          .then((saved) => { if (saved) setUser(saved); })
          .catch(() => {})
          .finally(() => setIsLoading(false));
        return;
      }
      setIsLoading(false);
    });
    return unsub;
  }, []);

  // Google Sign-In (primary method)
  const googleLogin = useCallback(async () => {
    const loggedIn = await signInWithGoogle();
    setUser(loggedIn);
  }, []);

  // Email/password local auth (kept as fallback)
  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await localLogin(email, password);
    setUser(loggedIn);
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const newUser = await localRegister(username, email, password);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await cancelAllNotifications().catch(() => {});
    await clearBookmarks().catch(() => {});
    await clearTokens().catch(() => {});
    await clearLocalSession().catch(() => {});
    await signOutGoogle().catch(() => {});
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
