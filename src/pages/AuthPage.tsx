import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Code2, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '../components/Logo';
import { GridBeamHeroBg } from '../components/lucian/GridBeamHeroBg';
import { LucianEmailSignInForm } from '../components/lucian/LucianEmailSignInForm';
import { LucianGoogleSignInButton } from '../components/lucian/LucianGoogleSignInButton';
import { LucianPasswordResetForm } from '../components/lucian/LucianPasswordResetForm';
import { LucianSignUpPasswordForm } from '../components/lucian/LucianSignUpPasswordForm';
import { SlidingPillTabs, type SlidingTabOption } from '../components/lucian/SlidingPillTabs';
import { ThemeToggleButton } from '../components/lucian/ThemeToggleButton';
import { useAuth } from '../context/AuthContext';
import { sanitizeRedirectPath } from '../services/supabaseClient';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_TAB_OPTIONS: readonly SlidingTabOption<'login' | 'register'>[] = [
  { id: 'login', label: 'Đăng nhập' },
  { id: 'register', label: 'Đăng ký' },
];

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
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [errorField, setErrorField] = useState<'email' | 'password' | 'both' | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (configured && !loading && user && mode !== 'reset') {
    return <Navigate to={redirectTarget} replace />;
  }

  const switchMode = (nextMode: AuthMode) => {
    setErrorMsg(null);
    setStatusMsg(null);
    setErrorField(null);
    setLoginSuccess(false);
    setRegisterSuccess(false);
    const next = new URLSearchParams(searchParams);
    if (nextMode === 'login') {
      next.delete('mode');
    } else {
      next.set('mode', nextMode);
    }
    setSearchParams(next, { replace: true });
  };

  const raiseLoginError = (msg: string, field: 'email' | 'password' | 'both') => {
    setErrorMsg(msg);
    setErrorField(field);
    setErrorNonce((n) => n + 1);
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    setErrorField(null);

    if (!EMAIL_REGEX.test(email.trim())) {
      raiseLoginError('Vui lòng nhập địa chỉ email hợp lệ.', 'email');
      return;
    }
    if (!password) {
      raiseLoginError('Vui lòng nhập mật khẩu.', 'password');
      return;
    }

    setSubmitting(true);
    const res = await signInWithPassword(email, password);
    setSubmitting(false);

    if (!res.ok) {
      raiseLoginError(res.error, 'password');
      return;
    }

    setLoginSuccess(true);
    navigate(redirectTarget, { replace: true });
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

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

    setRegisterSuccess(true);
    if (res.needsEmailConfirmation) {
      setStatusMsg(
        'Đăng ký thành công! Vui lòng mở hộp thư (hoặc thư mục Spam) và bấm link xác nhận để hoàn tất kích hoạt tài khoản.'
      );
      return;
    }

    navigate(redirectTarget, { replace: true });
  };

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

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
    setGoogleBusy(true);
    const res = await signInWithGoogle();
    if (!res.ok) {
      setGoogleBusy(false);
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
    login: 'Mở khóa toàn bộ lộ trình PRO192, Code Studio OpenJDK và AI Mentor.',
    register: 'Đăng ký nhanh để bảo mật tài khoản và không gian luyện đề PE.',
    forgot: 'Nhập email đã đăng ký, Supabase sẽ gửi liên kết đặt lại mật khẩu.',
    reset: 'Tạo mật khẩu mới tối thiểu 6 ký tự cho tài khoản của bạn.',
  };

  return (
    <div className="flex flex-1 bg-[var(--bg-canvas)] text-[var(--text-primary)] overflow-x-clip">
      <div className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:py-10">
        {/* Left column (Desktop Showcase) */}
        <div className="hidden lg:col-span-5 lg:block">
          <GridBeamHeroBg className="p-8">
            <div className="flex min-h-[470px] flex-col justify-between gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    to="/"
                    title="Về trang chủ JavaBrew"
                    className="rounded-lg focus-visible:outline-2"
                  >
                    <Logo subtitle="Night Coffee Lab" />
                  </Link>
                  <ThemeToggleButton />
                </div>

                <div className="space-y-3">
                  <h2 className="text-2xl font-bold leading-snug tracking-[-0.02em] text-[var(--text-primary)]">
                    Không gian học PRO192 và luyện đề PE tách biệt hoàn toàn phiền nhiễu.
                  </h2>
                  <p className="max-w-[44ch] text-xs leading-relaxed text-[var(--text-muted)]">
                    Đăng nhập để truy cập giáo trình 30 Slots JDK 8, kho 19 câu PE thật, Phòng thi
                    thử 85 phút và AI Mentor.
                  </p>
                </div>

                <ul className="space-y-3.5 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-text)]">
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        30 Slots PRO192 + 354 bài JavaGuide EN/VI
                      </div>
                      <div className="text-[var(--text-muted)]">
                        Ghi chú cá nhân, bookmark và AI tóm tắt theo bài học.
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--info-soft)] text-[var(--info-text)]">
                      <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        Code Studio OpenJDK &amp; Phòng thi thử PE1–PE5
                      </div>
                      <div className="text-[var(--text-muted)]">
                        Biên dịch đa tệp, Diff Clean Code và AI Giám khảo chấm chi tiết.
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--success-soft)] text-[var(--success-text)]">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        Bảo mật phiên đăng nhập qua Supabase Auth
                      </div>
                      <div className="text-[var(--text-muted)]">
                        Tự động gia hạn token an toàn, hỗ trợ Email &amp; Google OAuth.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="border-t border-[var(--border-default)] pt-4">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Về trang giới thiệu JavaBrew</span>
                </Link>
              </div>
            </div>
          </GridBeamHeroBg>
        </div>

        {/* Right column (Responsive Auth Card — fits cleanly down to 375px mobile) */}
        <div className="flex flex-col items-center justify-center lg:col-span-7">
          <div className="w-full max-w-[440px] space-y-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-overlay)] sm:p-7">
            {/* Compact top row (visible especially on mobile/tablet) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 lg:hidden">
                <Link
                  to="/"
                  className="rounded-lg focus-visible:outline-2"
                  title="Về trang chủ JavaBrew"
                >
                  <Logo />
                </Link>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                <ShieldCheck
                  className="h-3.5 w-3.5 text-[var(--success-text)]"
                  aria-hidden="true"
                />
                <span>Supabase Auth</span>
              </span>

              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggleButton />
                <Link
                  to="/"
                  aria-label="Về trang chủ"
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Trang chủ</span>
                </Link>
              </div>
            </div>

            {(mode === 'login' || mode === 'register') && (
              <SlidingPillTabs
                options={AUTH_TAB_OPTIONS}
                value={mode}
                onChange={switchMode}
                ariaLabel="Chuyển đổi Đăng nhập và Đăng ký"
                tone="accent"
                className="w-full"
              />
            )}

            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                {titleByMode[mode]}
              </h1>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {subtitleByMode[mode]}
              </p>
            </div>

            {!configured && (
              <div
                role="status"
                className="space-y-2 rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-3.5 text-xs text-[var(--accent-text)]"
              >
                <p className="font-semibold">Chưa cấu hình biến môi trường Supabase</p>
                <p className="leading-relaxed text-[var(--text-secondary)]">
                  Hãy thêm <code>VITE_SUPABASE_URL</code> và <code>VITE_SUPABASE_ANON_KEY</code>{' '}
                  vào <code>.env.local</code> hoặc Vercel Environment Variables để kích hoạt cổng
                  đăng nhập.
                </p>
                <div className="pt-0.5">
                  <Link
                    to="/dashboard"
                    className="font-semibold text-[var(--accent-text)] underline underline-offset-2"
                  >
                    Vào tạm Dashboard (chế độ chưa cấu hình Auth) →
                  </Link>
                </div>
              </div>
            )}

            {/* Show global alert banner for register / forgot / reset / google errors (login renders inline shake message) */}
            {errorMsg && mode !== 'login' && (
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

            {mode === 'login' && (
              <LucianEmailSignInForm
                email={email}
                onEmailChange={(v) => {
                  setEmail(v);
                  if (errorField === 'email' || errorField === 'both') setErrorMsg(null);
                }}
                password={password}
                onPasswordChange={(v) => {
                  setPassword(v);
                  if (errorField === 'password' || errorField === 'both') setErrorMsg(null);
                }}
                submitting={submitting}
                success={loginSuccess}
                errorField={errorField}
                errorMessage={errorMsg}
                errorNonce={errorNonce}
                disabled={!configured}
                onSubmit={(e) => void handleLoginSubmit(e)}
                onForgotPassword={() => switchMode('forgot')}
              />
            )}

            {mode === 'register' && (
              <LucianSignUpPasswordForm
                fullName={fullName}
                onFullNameChange={setFullName}
                email={email}
                onEmailChange={setEmail}
                password={password}
                onPasswordChange={setPassword}
                confirmPassword={confirmPassword}
                onConfirmPasswordChange={setConfirmPassword}
                submitting={submitting}
                success={registerSuccess}
                disabled={!configured}
                onSubmit={(e) => void handleRegisterSubmit(e)}
              />
            )}

            {mode === 'forgot' && (
              <LucianPasswordResetForm
                email={email}
                onEmailChange={setEmail}
                disabled={!configured}
                onSendReset={resetPasswordForEmail}
                onError={setErrorMsg}
                onStatus={setStatusMsg}
              />
            )}

            {mode === 'reset' && (
              <form
                onSubmit={(e) => void handleResetPasswordSubmit(e)}
                className="space-y-3.5 text-xs"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block font-medium text-[var(--text-secondary)]"
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="auth-confirm-password"
                    className="block font-medium text-[var(--text-secondary)]"
                  >
                    Nhập lại mật khẩu
                  </label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder="Nhập lại khớp mật khẩu trên"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:border-[var(--accent)] focus-visible:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !configured}
                  className="flex min-h-[46px] w-full items-center justify-center rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-contrast)] transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
                </button>
              </form>
            )}

            {configured && (mode === 'login' || mode === 'register') && (
              <>
                <div className="relative flex items-center py-0.5">
                  <div className="flex-grow border-t border-[var(--border-default)]" />
                  <span className="mx-3 shrink text-[11px] text-[var(--text-dim)]">hoặc</span>
                  <div className="flex-grow border-t border-[var(--border-default)]" />
                </div>

                <LucianGoogleSignInButton
                  busy={googleBusy}
                  disabled={submitting}
                  onClick={() => void handleGoogleLogin()}
                />
              </>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <div className="pt-1 text-center text-xs">
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
      </div>
    </div>
  );
}
