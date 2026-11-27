// Lucian UX/UI Prompt #405 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#405
import { useEffect, useRef, useState, type FormEvent } from 'react';
import './lucian-405.css';

interface LucianPasswordResetFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  disabled?: boolean;
  onSendReset: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onError: (msg: string | null) => void;
  onStatus: (msg: string | null) => void;
}

const COOLDOWN_SECONDS = 20;

export function LucianPasswordResetForm({
  email,
  onEmailChange,
  disabled = false,
  onSendReset,
  onError,
  onStatus,
}: LucianPasswordResetFormProps) {
  const [focused, setFocused] = useState(false);
  const [isErr, setIsErr] = useState(false);
  const [isShake, setIsShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const resendBtnRef = useRef<HTMLButtonElement>(null);
  const planeRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (!sent || secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [sent, secondsLeft]);

  useEffect(() => {
    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const launchPlane = (fromEl: HTMLElement | null) => {
    const plane = planeRef.current;
    const box = boxRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !plane || !box || !fromEl || typeof plane.animate !== 'function') return;

    const r = fromEl.getBoundingClientRect();
    const bb = box.getBoundingClientRect();
    const k = box.offsetWidth / (bb.width || 1);
    const x = (r.left + r.width / 2 - bb.left - bb.width / 2) * k;
    const y = (r.top + r.height / 2 - bb.top - bb.height / 2) * k;

    plane.animate(
      [
        { opacity: 0, transform: `translate(${x}px,${y}px) rotate(10deg) scale(.6)` },
        {
          opacity: 1,
          transform: `translate(${x + 10}px,${y - 18}px) rotate(-6deg) scale(1.1)`,
          offset: 0.2,
        },
        {
          opacity: 1,
          transform: `translate(${x + 70}px,${y - 70}px) rotate(-18deg) scale(1)`,
          offset: 0.6,
        },
        {
          opacity: 0,
          transform: `translate(${x + 150}px,${y - 150}px) rotate(-30deg) scale(.55)`,
        },
      ],
      { duration: 1000, easing: 'cubic-bezier(.3,.1,.4,1)' }
    );
  };

  const triggerSend = async (targetEmail: string, originBtn: HTMLElement | null) => {
    onError(null);
    onStatus(null);
    const clean = targetEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) {
      setIsErr(true);
      setIsShake(false);
      window.requestAnimationFrame(() => setIsShake(true));
      window.setTimeout(() => setIsShake(false), 480);
      onError('Vui lòng nhập email đã đăng ký để nhận liên kết đặt lại mật khẩu.');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    const res = await onSendReset(clean);
    setSubmitting(false);

    if (!res.ok) {
      onError(res.error);
      return;
    }

    launchPlane(originBtn);
    setSentEmail(clean);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(
      () => {
        setSent(true);
        setSecondsLeft(COOLDOWN_SECONDS);
        onStatus(
          'Đã gửi liên kết đặt lại mật khẩu tới email của bạn. Hãy kiểm tra hộp thư để tiếp tục.'
        );
      },
      reduced ? 0 : 420
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void triggerSend(email, sendBtnRef.current);
  };

  const dashOffset = ((62.8 * (COOLDOWN_SECONDS - secondsLeft)) / COOLDOWN_SECONDS).toFixed(1);
  const canResend = secondsLeft === 0 && !submitting && !disabled;

  return (
    <div ref={rootRef} className={['ux u405', sent ? 'is-sent' : ''].filter(Boolean).join(' ')}>
      <div ref={boxRef} className="u405-box">
        <form className="u405-a" onSubmit={handleSubmit} noValidate aria-hidden={sent}>
          <div
            className={[
              'u405-f',
              focused ? 'is-f' : '',
              focused || email.length > 0 ? 'is-up' : '',
              isErr ? 'is-err' : '',
              isShake ? 'is-shake' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <input
              ref={inputRef}
              id="auth-email"
              className="u405-in"
              type="email"
              autoComplete="email"
              spellCheck={false}
              tabIndex={sent ? -1 : 0}
              value={email}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(e) => {
                setIsErr(false);
                onEmailChange(e.target.value);
              }}
              aria-invalid={isErr ? 'true' : undefined}
            />
            <label htmlFor="auth-email">Email</label>
          </div>
          <button
            ref={sendBtnRef}
            type="submit"
            disabled={disabled || submitting || sent}
            tabIndex={sent ? -1 : 0}
            className="u405-send"
          >
            {submitting ? 'Đang gửi liên kết…' : 'Gửi link đặt lại mật khẩu'}
          </button>
        </form>

        <div className="u405-b" aria-hidden={!sent}>
          <svg className="u405-env" viewBox="0 0 72 60" aria-hidden="true">
            <rect className="bk" x="6" y="16" width="60" height="40" rx="6" />
            <g className="letter">
              <rect className="lt" x="14" y="6" width="44" height="34" rx="4" />
              <path className="ln" d="M21 15h22M21 21h30M21 27h18" />
            </g>
            <path
              className="fr"
              d="M6 22v28a6 6 0 0 0 6 6h48a6 6 0 0 0 6-6V22L38.6 40.6a4.5 4.5 0 0 1-5.2 0z"
            />
            <path
              className="fl"
              d="M8 17.5c-1.2-.9-.6-1.5.9-1.5h54.2c1.5 0 2.1.6.9 1.5L38.4 37a4 4 0 0 1-4.8 0z"
            />
          </svg>
          <b>Kiểm tra hộp thư của bạn</b>
          <span className="u405-to">
            <span className="u405-em">{sentEmail}</span>
            <button
              type="button"
              className="u405-chg"
              tabIndex={sent ? 0 : -1}
              onClick={() => {
                setSent(false);
                setSecondsLeft(0);
                window.setTimeout(() => {
                  inputRef.current?.focus({ preventScroll: true });
                  inputRef.current?.select();
                }, 180);
              }}
              aria-label="Đổi địa chỉ email"
            >
              Đổi email
            </button>
          </span>
          <button
            ref={resendBtnRef}
            type="button"
            className={['u405-re', canResend ? 'is-ready' : ''].filter(Boolean).join(' ')}
            disabled={!canResend}
            tabIndex={sent ? 0 : -1}
            aria-label={canResend ? 'Gửi lại email' : `Gửi lại sau ${secondsLeft} giây`}
            onClick={() => void triggerSend(sentEmail || email, resendBtnRef.current)}
          >
            <span className="u405-ring" aria-hidden="true">
              <svg viewBox="0 0 26 26">
                <circle className="tr" cx="13" cy="13" r="10" />
                <circle
                  className="pr"
                  cx="13"
                  cy="13"
                  r="10"
                  style={{ strokeDashoffset: canResend ? '0' : dashOffset }}
                />
              </svg>
              <em>{secondsLeft > 0 ? secondsLeft : ''}</em>
              <i />
            </span>
            <span className="u405-rl">
              {canResend ? 'Gửi lại' : `Gửi lại (${secondsLeft}s)`}
            </span>
          </button>
        </div>

        <span ref={planeRef} className="u405-plane" aria-hidden="true">
          <svg viewBox="0 0 30 30">
            <path className="p1" d="M3 14.2 27 4l-7.6 21.6-5.4-6.2z" />
            <path className="p2" d="M14 19.4 27 4 11.2 17.6l1.6 6.4z" />
          </svg>
        </span>
      </div>
      <p className="u405-live" role="status">
        {sent ? 'Đã gửi email đặt lại mật khẩu' : ''}
      </p>
    </div>
  );
}
