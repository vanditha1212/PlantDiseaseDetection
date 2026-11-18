import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { api } from '../services/api.ts';
import { translate } from '../i18n/translations.ts';
import type { LanguageCode, UserProfile } from '../types/index.ts';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  authLoading: boolean;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerFarmer: (payload: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    state: string;
    district: string;
    preferredLanguage: LanguageCode;
  }) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  loginAsAdmin: (email: string, password: string) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (payload: {
    fullName: string;
    mobileNumber: string;
    state: string;
    district: string;
    preferredLanguage: LanguageCode;
  }) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Keep Firebase Auth state synced if user signed in via Google
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const { user: syncedUser } = await api.syncGoogleUser(idToken);
          setToken(idToken);
          setUser(syncedUser);
          if (
            syncedUser.preferredLanguage === 'en' ||
            syncedUser.preferredLanguage === 'kn' ||
            syncedUser.preferredLanguage === 'hi'
          ) {
            setLanguageState(syncedUser.preferredLanguage);
          }
        } catch (err) {
          console.error('Firebase user sync failed:', err);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string) => translate(language, key), [language]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
    if (res.user.preferredLanguage) {
      setLanguageState(res.user.preferredLanguage);
    }
    return res.user;
  }, []);

  const registerFarmer = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      mobileNumber: string;
      password: string;
      state: string;
      district: string;
      preferredLanguage: LanguageCode;
    }) => {
      const res = await api.register(payload);
      setToken(res.token);
      setUser(res.user);
      setLanguageState(payload.preferredLanguage);
      return res.user;
    },
    []
  );

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    const { user: syncedUser } = await api.syncGoogleUser(idToken);
    setToken(idToken);
    setUser(syncedUser);
    if (syncedUser.preferredLanguage) {
      setLanguageState(syncedUser.preferredLanguage);
    }
    return syncedUser;
  }, []);

  const loginAsAdmin = useCallback(async (email: string, password: string) => {
    const res = await api.adminLogin(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const res = await api.getProfile(token);
    setUser(res.user);
  }, [token]);

  const updateUserProfile = useCallback(
    async (payload: {
      fullName: string;
      mobileNumber: string;
      state: string;
      district: string;
      preferredLanguage: LanguageCode;
    }) => {
      if (!token) throw new Error('Not authenticated');
      const res = await api.updateProfile(token, payload);
      setUser(res.user);
      setLanguageState(res.user.preferredLanguage);
      return res.user;
    },
    [token]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore Firebase signout error for local JWT users
    }
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        language,
        setLanguage,
        t,
        loginWithEmail,
        registerFarmer,
        loginWithGoogle,
        loginAsAdmin,
        refreshUser,
        updateUserProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
