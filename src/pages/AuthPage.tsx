import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { sanitizeRedirectPath } from '../services/supabaseClient';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseMode(raw: string | null): AuthMode {
  if (raw === 'register' || raw === 'forgot' || raw === 'reset') {
    return raw;
  }
  return 'login';
}

export function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    configured,
    user,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    resetPasswordForEmail,
    updatePassword,
  } = useAuth();

  const mode = parseMode(searchParams.get('mode'));
  const redirectTarget = sanitizeRedirectPath(searchParams.get('redirect'));

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (configured && !loading && user && mode !== 'reset') {
    return <Navigate to={redirectTarget} replace />;
  }

  const switchMode = (nextMode: AuthMode) => {
    setErrorMsg(null);
    setStatusMsg(null);
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'login') {
      next.delete('mode');
    } else {
      next.set('mode', nextMode);
    }
    setSearchParams(next, { replace: true });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (mode === 'login') {
      if (!EMAIL_REGEX.test(email.trim())) {
        setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      if (!password) {
        setErrorMsg('Vui lòng nhập mật khẩu.');
        return;
      }
      setSubmitting(true);
      const res = await signInWithPassword(email, password);
      setSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      navigate(redirectTarget, { replace: true });
      return;
    }

    if (mode === 'register') {
      if (!EMAIL_REGEX.test(email.trim())) {
        setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Mật khẩu xác nhận không khớp.');
        return;
      }
      setSubmitting(true);
      const res = await signUpWithPassword(email, password, fullName);
      setSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      if (res.needsEmailConfirmation) {
        setStatusMsg(
          'Đăng ký thành công! Vui lòng mở hộp thư (hoặc thư mục Spam) và bấm link xác nhận để hoàn tất kích hoạt tài khoản.'
        );
        return;
      }
      navigate(redirectTarget, { replace: true });
      return;
    }

    if (mode === 'forgot') {
      if (!EMAIL_REGEX.test(email.trim())) {
        setErrorMsg('Vui lòng nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.');
        return;
      }
      setSubmitting(true);
      const res = await resetPasswordForEmail(email);
      setSubmitting(false);
      if (!res.ok) {
        setErrorMsg(res.error);
        return;
      }
      setStatusMsg(
        'Đã gửi liên kết đặt lại mật khẩu tới email của bạn. Hãy kiểm tra hộp thư để tiếp tục.'
      );
      return;
    }

    // mode === 'reset'
    if (password.length < 6) {
      setErrorMsg('Mật khẩu mới cần tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu mới xác nhận không khớp.');
      return;
    }
    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setStatusMsg('Đã cập nhật mật khẩu thành công! Đang chuyển vào Dashboard…');
    navigate('/dashboard', { replace: true });
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setSubmitting(true);
    const res = await signInWithGoogle();
    setSubmitting(false);
    if (!res.ok) {
      setErrorMsg(res.error);
    }
  };

  const titleByMode: Record<AuthMode, string> = {
    login: 'Đăng nhập JavaBrew',
    register: 'Tạo tài khoản JavaBrew',
    forgot: 'Khôi phục mật khẩu',
    reset: 'Đặt mật khẩu mới',
  };

  const subtitleByMode: Record<AuthMode, string> = {
    login: 'Đăng nhập để mở khóa lộ trình PRO192, Code Studio, AI Mentor và Phòng thi PE.',
    register: 'Tạo tài khoản cá nhân để bảo mật không gian học tập trên JavaBrew.',
    forgot: 'Nhập email bạn đã dùng đăng ký, Supabase sẽ gửi link khôi phục mật khẩu.',
    reset: 'Nhập mật khẩu mới (tối thiểu 6 ký tự) cho tài khoản của bạn.',
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="rounded-lg focus-visible:outline-2" title="Về trang chủ JavaBrew">
            <Logo />
          </Link>
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--success-text)]" aria-hidden="true" />
            <span>Supabase Auth</span>
          </span>
        </div>

        {(mode === 'login' || mode === 'register') && (
          <div
            role="tablist"
            aria-label="Chuyển đổi Đăng nhập và Đăng ký"
            className="grid grid-cols-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-1 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={[
                'min-h-[36px] rounded-lg font-semibold transition-colors',
                mode === 'login'
                  ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={[
                'min-h-[36px] rounded-lg font-semibold transition-colors',
                mode === 'register'
                  ? 'bg-[var(--accent)] font-bold text-[var(--accent-contrast)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
              ].join(' ')}
            >
              Đăng ký
            </button>
          </div>
        )}

        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{titleByMode[mode]}</h1>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">{subtitleByMode[mode]}</p>
        </div>

        {!configured && (
          <div
            role="status"
            className="space-y-2 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-3.5 text-xs text-[var(--accent-text)]"
          >
            <p className="font-semibold">Chưa cấu hình biến môi trường Supabase</p>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Hãy thêm <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code> vào{' '}
              <code>.env.local</code> hoặc Vercel Environment Variables để bật khóa bảo vệ đăng nhập.
            </p>
            <div className="pt-1">
              <Link
                to="/dashboard"
                className="font-semibold text-[var(--accent-text)] underline underline-offset-2"
              >
                Vào tạm Dashboard (chế độ chưa cấu hình Auth) →
              </Link>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl border border-[var(--danger)]/40 bg-[var(--danger-soft)] px-3.5 py-2.5 text-xs text-[var(--danger-text)]"
          >
            {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div
            role="status"
            className="rounded-xl border border-[var(--success)]/40 bg-[var(--success-soft)] px-3.5 py-2.5 text-xs text-[var(--success-text)]"
          >
            {statusMsg}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5 text-xs" noValidate>
          {mode === 'register' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-fullname" className="block font-medium text-[var(--text-secondary)]">
                Họ và tên (tùy chọn)
              </label>
              <div className="relative">
                <UserIcon
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]"
                  aria-hidden="true"
                />
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] pl-9 pr-3 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                />
              </div>
            </div>
          )}

          {mode !== 'reset' && (
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="block font-medium text-[var(--text-secondary)]">
                Email
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]"
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="sinhvien@fpt.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] pl-9 pr-3 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="auth-password" className="block font-medium text-[var(--text-secondary)]">
                  {mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] font-medium text-[var(--accent-text)] hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]"
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] pl-9 pr-10 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--text-dim)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'reset') && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-confirm-password"
                className="block font-medium text-[var(--text-secondary)]"
              >
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-dim)]"
                  aria-hidden="true"
                />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="Nhập lại khớp mật khẩu trên"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="min-h-[40px] w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] pl-9 pr-3 text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !configured}
            className="flex min-h-[42px] w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? 'Đang xử lý…'
              : mode === 'login'
                ? 'Đăng nhập ngay'
                : mode === 'register'
                  ? 'Tạo tài khoản'
                  : mode === 'forgot'
                    ? 'Gửi link đặt lại mật khẩu'
                    : 'Lưu mật khẩu mới'}
          </button>
        </form>

        {configured && (mode === 'login' || mode === 'register') && (
          <>
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[var(--border-default)]" />
              <span className="mx-3 shrink text-[11px] text-[var(--text-dim)]">hoặc</span>
              <div className="flex-grow border-t border-[var(--border-default)]" />
            </div>

            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={submitting}
              className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-60"
            >
              <span>Tiếp tục với Google</span>
            </button>
          </>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <div className="text-center text-xs">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-medium text-[var(--accent-text)] hover:underline"
            >
              ← Quay lại Đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
