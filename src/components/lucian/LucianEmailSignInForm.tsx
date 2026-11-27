// Lucian UX/UI Prompt #403 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#403
import { useEffect, useState, type FormEvent } from 'react';
import './lucian-403.css';

interface LucianEmailSignInFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  submitting: boolean;
  success: boolean;
  errorField: 'email' | 'password' | 'both' | null;
  errorMessage: string | null;
  errorNonce: number;
  disabled?: boolean;
  onSubmit: (e: FormEvent) => void;
  onForgotPassword: () => void;
}

export function LucianEmailSignInForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  submitting,
  success,
  errorField,
  errorMessage,
  errorNonce,
  disabled = false,
  onSubmit,
  onForgotPassword,
}: LucianEmailSignInFormProps) {
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!errorField || errorNonce === 0) return;
    setShake(false);
    const frame = window.requestAnimationFrame(() => setShake(true));
    const timer = window.setTimeout(() => setShake(false), 480);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [errorField, errorNonce]);

  const emailErr = Boolean(errorMessage && (errorField === 'email' || errorField === 'both'));
  const passErr = Boolean(errorMessage && (errorField === 'password' || errorField === 'both'));

  return (
    <div className="ux u403">
      <form className="u403-form" onSubmit={onSubmit} noValidate>
        <div
          className={[
            'u403-f',
            focused === 'email' ? 'is-f' : '',
            focused === 'email' || email.length > 0 ? 'is-up' : '',
            emailErr ? 'is-err' : '',
            emailErr && shake ? 'is-shake' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-email"
            className="u403-in"
            type="email"
            autoComplete="email"
            spellCheck={false}
            value={email}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused((f) => (f === 'email' ? null : f))}
            onChange={(e) => onEmailChange(e.target.value)}
            aria-invalid={emailErr ? 'true' : undefined}
            aria-describedby={errorMessage ? 'u403-err-msg' : undefined}
          />
          <label htmlFor="auth-email">Email</label>
        </div>

        <div
          className={[
            'u403-f u403-pw',
            focused === 'password' ? 'is-f' : '',
            focused === 'password' || password.length > 0 ? 'is-up' : '',
            passErr ? 'is-err' : '',
            passErr && shake ? 'is-shake' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-password"
            className="u403-in"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused((f) => (f === 'password' ? null : f))}
            onChange={(e) => onPasswordChange(e.target.value)}
            aria-invalid={passErr ? 'true' : undefined}
            aria-describedby={errorMessage ? 'u403-err-msg' : undefined}
          />
          <label htmlFor="auth-password">Mật khẩu</label>
          <button
            type="button"
            className="u403-eye"
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <g className="lid">
                <path d="M2 10s3-5.2 8-5.2S18 10 18 10s-3 5.2-8 5.2S2 10 2 10z" />
                <circle cx="10" cy="10" r="2.4" />
              </g>
              <g className="lash">
                <path d="M3 10.4c2 2.4 4.4 3.4 7 3.4s5-1 7-3.4M6 13l-1 1.6M10 14v1.8M14 13l1 1.6" />
              </g>
            </svg>
          </button>
        </div>

        <div className="u403-aux">
          <span className="text-[11px] text-[var(--text-dim)]">Bảo mật qua phiên Supabase</span>
          <button type="button" onClick={onForgotPassword} className="u403-forgot">
            Quên mật khẩu?
          </button>
        </div>

        <p
          id="u403-err-msg"
          role={errorMessage ? 'alert' : undefined}
          aria-live="polite"
          className={['u403-msg', errorMessage ? 'is-on' : ''].filter(Boolean).join(' ')}
        >
          {errorMessage || ''}
        </p>

        <button
          type="submit"
          disabled={disabled || submitting || success}
          aria-busy={submitting ? 'true' : undefined}
          className={[
            'u403-go',
            submitting ? 'is-busy' : '',
            success ? 'is-ok' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span>Đăng nhập ngay</span>
          <i aria-hidden="true" />
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <path d="M5.5 11.5l4 4L17 7.5" />
          </svg>
        </button>
      </form>
      <p className="u403-live" role="status">
        {submitting ? 'Đang kiểm tra đăng nhập…' : success ? 'Đăng nhập thành công' : ''}
      </p>
    </div>
  );
}
