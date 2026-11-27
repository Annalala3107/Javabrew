import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatAuthError, getSupabaseClient } from '../services/supabaseClient';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    const desc = searchParams.get('error_description') || searchParams.get('error');
    return desc ? formatAuthError(desc) : null;
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const code = searchParams.get('code');
    const client = getSupabaseClient();
    if (!code || !client) {
      if (!client && !errorMsg) {
        navigate('/login', { replace: true });
      }
      return;
    }

    let cancelled = false;
    void client.auth
      .exchangeCodeForSession(code)
      .then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setErrorMsg(formatAuthError(error.message));
          return;
        }
        navigate('/dashboard', { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(formatAuthError(err instanceof Error ? err.message : ''));
      });

    return () => {
      cancelled = true;
    };
  }, [user, searchParams, navigate, errorMsg]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center text-xs">
        {errorMsg ? (
          <>
            <h1 className="text-base font-bold text-[var(--danger-text)]">
              Xác thực tài khoản không thành công
            </h1>
            <p role="alert" className="text-[var(--text-secondary)]">
              {errorMsg}
            </p>
            <Link
              to="/login"
              className="inline-flex min-h-[38px] items-center justify-center rounded-lg bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-contrast)]"
            >
              Quay lại trang Đăng nhập
            </Link>
          </>
        ) : (
          <>
            <RefreshCw
              className="mx-auto h-6 w-6 animate-spin text-[var(--accent)]"
              aria-hidden="true"
            />
            <h1 className="text-base font-bold text-[var(--text-primary)]">
              Đang hoàn tất đăng nhập…
            </h1>
            <p className="text-[var(--text-muted)]">
              Vui lòng đợi trong giây lát, hệ thống đang xác nhận phiên làm việc với Supabase.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
