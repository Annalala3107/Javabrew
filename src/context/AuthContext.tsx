import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  formatAuthError,
  getSupabaseClient,
  isSupabaseConfigured,
} from '../services/supabaseClient';

export type AuthActionResult = { ok: true } | { ok: false; error: string };
export type RegisterActionResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; error: string };

export interface AuthContextValue {
  configured: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthActionResult>;
  signUpWithPassword: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<RegisterActionResult>;
  signInWithGoogle: () => Promise<AuthActionResult>;
  resetPasswordForEmail: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(configured);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    void client.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [configured]);

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      const client = getSupabaseClient();
      if (!client) {
        return {
          ok: false,
          error: 'Chưa cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
        };
      }
      try {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          return { ok: false, error: formatAuthError(error.message) };
        }
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: formatAuthError(err instanceof Error ? err.message : ''),
        };
      }
    },
    []
  );

  const signUpWithPassword = useCallback(
    async (
      email: string,
      password: string,
      fullName?: string
    ): Promise<RegisterActionResult> => {
      const client = getSupabaseClient();
      if (!client) {
        return {
          ok: false,
          error: 'Chưa cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
        };
      }
      try {
        const cleanName = fullName?.trim();
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: cleanName ? { full_name: cleanName } : undefined,
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          return { ok: false, error: formatAuthError(error.message) };
        }
        return {
          ok: true,
          needsEmailConfirmation: !data.session,
        };
      } catch (err) {
        return {
          ok: false,
          error: formatAuthError(err instanceof Error ? err.message : ''),
        };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        error: 'Chưa cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      };
    }
    try {
      const { error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        return { ok: false, error: formatAuthError(error.message) };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: formatAuthError(err instanceof Error ? err.message : ''),
      };
    }
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<AuthActionResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        error: 'Chưa cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      };
    }
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login?mode=reset`,
      });
      if (error) {
        return { ok: false, error: formatAuthError(error.message) };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: formatAuthError(err instanceof Error ? err.message : ''),
      };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<AuthActionResult> => {
    const client = getSupabaseClient();
    if (!client) {
      return {
        ok: false,
        error: 'Chưa cấu hình Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).',
      };
    }
    try {
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { ok: false, error: formatAuthError(error.message) };
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: formatAuthError(err instanceof Error ? err.message : ''),
      };
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch {
        // ignore network errors on sign out and clear local auth state
      }
    }
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      user,
      session,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    }),
    [
      configured,
      user,
      session,
      loading,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      resetPasswordForEmail,
      updatePassword,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
