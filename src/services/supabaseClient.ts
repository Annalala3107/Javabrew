/// <reference types="vite/client" />
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';

function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = String(
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      ''
  ).trim();
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return null;
  }

  const signature = `${url}|${anonKey}`;
  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    cachedSignature = signature;
  }
  return cachedClient;
}

export function resetSupabaseClientForTest(): void {
  cachedClient = null;
  cachedSignature = '';
}

export function formatAuthError(rawMessage: string): string {
  const msg = rawMessage.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Hãy kiểm tra hộp thư (hoặc Spam) và bấm link kích hoạt.';
  }
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Email này đã được đăng ký. Hãy chuyển sang tab Đăng nhập hoặc dùng Quên mật khẩu.';
  }
  if (lower.includes('password should be at least') || lower.includes('weak_password')) {
    return 'Mật khẩu quá ngắn — cần tối thiểu 6 ký tự.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Bạn thao tác quá nhanh. Vui lòng đợi khoảng 1 phút rồi thử lại.';
  }
  if (lower.includes('invalid email') || lower.includes('unable to validate email')) {
    return 'Địa chỉ email không hợp lệ.';
  }
  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Không kết nối được tới máy chủ Supabase. Hãy kiểm tra kết nối mạng hoặc URL dự án.';
  }
  return msg || 'Xác thực thất bại. Vui lòng thử lại.';
}

export function sanitizeRedirectPath(raw: string | null): string {
  if (!raw) return '/dashboard';
  const trimmed = raw.trim();
  if (!trimmed.startsWith('/')) return '/dashboard';
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\')) return '/dashboard';
  if (
    trimmed === '/login' ||
    trimmed.startsWith('/login?') ||
    trimmed.startsWith('/login/') ||
    trimmed === '/register' ||
    trimmed.startsWith('/register?') ||
    trimmed === '/auth/callback' ||
    trimmed.startsWith('/auth/callback?')
  ) {
    return '/dashboard';
  }
  return trimmed;
}
