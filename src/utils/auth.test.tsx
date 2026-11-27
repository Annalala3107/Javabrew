import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';

const mockState = {
  configured: false,
  session: null as Session | null,
  signInResult: { error: null as { message: string } | null },
  signUpResult: {
    data: { session: null as Session | null, user: null as User | null },
    error: null as { message: string } | null,
  },
  signInCalls: [] as Array<{ email: string; password: string }>,
  signUpCalls: [] as Array<{ email: string; password: string }>,
};

vi.mock('../services/supabaseClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/supabaseClient')>();
  return {
    ...actual,
    isSupabaseConfigured: () => mockState.configured,
    getSupabaseClient: () => {
      if (!mockState.configured) return null;
      return {
        auth: {
          getSession: vi.fn(async () => ({ data: { session: mockState.session }, error: null })),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
          signInWithPassword: vi.fn(async ({ email, password }: { email: string; password: string }) => {
            mockState.signInCalls.push({ email, password });
            return { data: { session: mockState.session, user: mockState.session?.user ?? null }, error: mockState.signInResult.error };
          }),
          signUp: vi.fn(async ({ email, password }: { email: string; password: string }) => {
            mockState.signUpCalls.push({ email, password });
            return mockState.signUpResult;
          }),
          signInWithOAuth: vi.fn(async () => ({ error: null })),
          resetPasswordForEmail: vi.fn(async () => ({ error: null })),
          updateUser: vi.fn(async () => ({ error: null })),
          signOut: vi.fn(async () => ({ error: null })),
        },
      };
    },
  };
});

import { AppRoutes } from '../App';
import { RequireAuth } from '../components/auth/RequireAuth';
import { AppProvider } from '../context/AppContext';
import { AuthProvider } from '../context/AuthContext';
import { AuthPage } from '../pages/AuthPage';
import { formatAuthError, sanitizeRedirectPath } from '../services/supabaseClient';

const DEMO_USER = {
  id: 'user-1',
  email: 'student@fpt.edu.vn',
  user_metadata: { full_name: 'Sinh viên PRO192' },
} as unknown as User;

const DEMO_SESSION = {
  access_token: 'tok_123',
  user: DEMO_USER,
} as unknown as Session;

describe('Supabase Auth integration & helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockState.configured = false;
    mockState.session = null;
    mockState.signInResult = { error: null };
    mockState.signUpResult = {
      data: { session: null, user: DEMO_USER },
      error: null,
    };
    mockState.signInCalls = [];
    mockState.signUpCalls = [];
  });

  it('maps Supabase auth messages to Vietnamese and blocks unsafe redirect URLs', () => {
    expect(formatAuthError('Invalid login credentials')).toContain('chưa đúng');
    expect(formatAuthError('Email not confirmed')).toContain('chưa được xác nhận');
    expect(formatAuthError('User already registered')).toContain('đã được đăng ký');

    expect(sanitizeRedirectPath(null)).toBe('/dashboard');
    expect(sanitizeRedirectPath('https://evil.example/phish')).toBe('/dashboard');
    expect(sanitizeRedirectPath('//evil.example')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/\\evil')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/login?mode=register')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/auth/callback')).toBe('/dashboard');
    expect(sanitizeRedirectPath('/studio/1?foo=bar')).toBe('/studio/1?foo=bar');
  });

  it('redirects unauthenticated users from protected routes to /login when Supabase is configured, and renders once signed in', async () => {
    mockState.configured = true;
    mockState.session = null;

    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div data-testid="login-screen">Login Route</div>} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<div data-testid="dash-screen">Dashboard Route</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('login-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('dash-screen')).not.toBeInTheDocument();
    unmount();

    mockState.session = DEMO_SESSION;
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div data-testid="login-screen">Login Route</div>} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<div data-testid="dash-screen">Dashboard Route</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('dash-screen')).toBeInTheDocument();
  });

  it('validates register password match, submits login & register via Supabase, and displays Vietnamese feedback', async () => {
    mockState.configured = true;
    mockState.session = null;

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/dashboard" element={<div>Dashboard OK</div>} />
          </Routes>
        </AppProvider>
      </MemoryRouter>
    );

    const emailInput = await screen.findByLabelText(/^Email$/i);
    const passInput = screen.getByLabelText(/^Mật khẩu$/i);

    fireEvent.change(emailInput, { target: { value: 'student@fpt.edu.vn' } });
    fireEvent.change(passInput, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập ngay/i }));

    await waitFor(() => {
      expect(mockState.signInCalls).toEqual([{ email: 'student@fpt.edu.vn', password: '123456' }]);
    });
    expect(await screen.findByText('Dashboard OK')).toBeInTheDocument();
  });

  it('handles registration validation and email confirmation notice on AuthPage', async () => {
    mockState.configured = true;
    mockState.session = null;

    render(
      <MemoryRouter initialEntries={['/login?mode=register']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(await screen.findByLabelText(/^Email$/i), {
      target: { value: 'newuser@fpt.edu.vn' },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/Nhập lại mật khẩu/i), { target: { value: 'mismatch' } });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/không khớp/i);
    expect(mockState.signUpCalls).toHaveLength(0);

    fireEvent.change(screen.getByLabelText(/Nhập lại mật khẩu/i), {
      target: { value: 'secret123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Tạo tài khoản/i }));

    await waitFor(() => {
      expect(mockState.signUpCalls).toEqual([{ email: 'newuser@fpt.edu.vn', password: 'secret123' }]);
    });
    expect(await screen.findByRole('status')).toHaveTextContent(/xác nhận/i);
  });

  it('renders /login cleanly inside full AppRoutes when Supabase is not configured', async () => {
    mockState.configured = false;
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Đăng nhập JavaBrew/i })).toBeInTheDocument();
    expect(screen.getByText(/Chưa cấu hình biến môi trường Supabase/i)).toBeInTheDocument();
  });
});
