// Lucian UX/UI Prompt #404 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#404
import { useState, type FormEvent } from 'react';
import './lucian-404.css';

interface LucianSignUpPasswordFormProps {
  fullName: string;
  onFullNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  submitting: boolean;
  success: boolean;
  disabled?: boolean;
  onSubmit: (e: FormEvent) => void;
}

const STRENGTH_LABELS = ['', 'Yếu', 'Trung bình', 'Mạnh', 'Rất mạnh'] as const;

function computeStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0;
  const score =
    (value.length >= 6 ? 1 : 0) +
    (/\d/.test(value) ? 1 : 0) +
    (/[A-Za-z]/.test(value) ? 1 : 0) +
    (value.length >= 10 || /[^A-Za-z0-9\s]/.test(value) ? 1 : 0);
  return Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;
}

export function LucianSignUpPasswordForm({
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  submitting,
  success,
  disabled = false,
  onSubmit,
}: LucianSignUpPasswordFormProps) {
  const [focused, setFocused] = useState<'name' | 'email' | 'password' | 'confirm' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const lv = computeStrength(password);
  const hasMinLen = password.length >= 6;
  const hasLetterAndDigit = /[A-Za-z]/.test(password) && /\d/.test(password);
  const matchesConfirm = hasMinLen && password === confirmPassword;
  const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isAwake = hasEmail && hasMinLen && matchesConfirm;

  return (
    <div className="ux u404" data-lv={lv}>
      <form className="u404-w" onSubmit={onSubmit} noValidate>
        <div
          className={[
            'u404-f',
            focused === 'name' ? 'is-f' : '',
            focused === 'name' || fullName.length > 0 ? 'is-up' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-fullname"
            className="u404-in"
            type="text"
            autoComplete="name"
            value={fullName}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused((f) => (f === 'name' ? null : f))}
            onChange={(e) => onFullNameChange(e.target.value)}
          />
          <label htmlFor="auth-fullname">Họ và tên (tùy chọn)</label>
        </div>

        <div
          className={[
            'u404-f',
            focused === 'email' ? 'is-f' : '',
            focused === 'email' || email.length > 0 ? 'is-up' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-email"
            className="u404-in"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            value={email}
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused((f) => (f === 'email' ? null : f))}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <label htmlFor="auth-email">Email</label>
        </div>

        <div
          className={[
            'u404-f u404-pw',
            focused === 'password' ? 'is-f' : '',
            focused === 'password' || password.length > 0 ? 'is-up' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-password"
            className="u404-in"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused((f) => (f === 'password' ? null : f))}
            onChange={(e) => onPasswordChange(e.target.value)}
            aria-describedby="u404-rule-len u404-rule-mix u404-rule-match"
          />
          <label htmlFor="auth-password">Mật khẩu</label>
          <button
            type="button"
            className="u404-eye"
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

        <div className="u404-st">
          <div
            className="u404-bars"
            role="meter"
            aria-label="Độ mạnh mật khẩu"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={lv}
            aria-valuetext={STRENGTH_LABELS[lv] || 'Chưa nhập'}
          >
            {[0, 1, 2, 3].map((idx) => (
              <i key={idx} className={idx < lv ? 'is-on' : undefined} />
            ))}
          </div>
          <em>{STRENGTH_LABELS[lv]}</em>
        </div>

        <div
          className={[
            'u404-f u404-pw',
            focused === 'confirm' ? 'is-f' : '',
            focused === 'confirm' || confirmPassword.length > 0 ? 'is-up' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <input
            id="auth-confirm-password"
            className="u404-in"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onFocus={() => setFocused('confirm')}
            onBlur={() => setFocused((f) => (f === 'confirm' ? null : f))}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
          <label htmlFor="auth-confirm-password">Nhập lại mật khẩu</label>
        </div>

        <ul className="u404-rules">
          <li id="u404-rule-len" className={hasMinLen ? 'is-ok' : undefined}>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="8" />
              <path d="M5.6 9.3l2.3 2.3 4.6-4.8" />
            </svg>
            <span>Tối thiểu 6 ký tự</span>
          </li>
          <li id="u404-rule-mix" className={hasLetterAndDigit ? 'is-ok' : undefined}>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="8" />
              <path d="M5.6 9.3l2.3 2.3 4.6-4.8" />
            </svg>
            <span>Có chữ cái &amp; số</span>
          </li>
          <li id="u404-rule-match" className={matchesConfirm ? 'is-ok' : undefined}>
            <svg viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="8" />
              <path d="M5.6 9.3l2.3 2.3 4.6-4.8" />
            </svg>
            <span>Khớp mật khẩu nhập lại</span>
          </li>
        </ul>

        <button
          type="submit"
          disabled={disabled || submitting}
          className={[
            'u404-go',
            isAwake ? 'is-awake' : '',
            success ? 'is-ok' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span>{submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}</span>
          <svg viewBox="0 0 22 22" aria-hidden="true">
            <path d="M5.5 11.5l4 4L17 7.5" />
          </svg>
        </button>
      </form>
      <p className="u404-live" role="status">
        {isAwake ? 'Mật khẩu hợp lệ, sẵn sàng tạo tài khoản' : ''}
      </p>
    </div>
  );
}
