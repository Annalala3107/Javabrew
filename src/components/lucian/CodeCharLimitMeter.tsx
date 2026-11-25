// Lucian UX/UI Prompt #467 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#467
import { useEffect, useState } from 'react';
import './lucian-467.css';

interface CodeCharLimitMeterProps {
  current: number;
  max?: number;
  limitHitNonce?: number;
  className?: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 12;
const numberFormatter = new Intl.NumberFormat('vi-VN');

export function CodeCharLimitMeter({
  current,
  max = 10_000,
  limitHitNonce = 0,
  className = '',
}: CodeCharLimitMeterProps) {
  const [nudging, setNudging] = useState(false);

  useEffect(() => {
    if (limitHitNonce <= 0) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    setNudging(true);
    const timer = window.setTimeout(() => setNudging(false), 320);
    return () => window.clearTimeout(timer);
  }, [limitHitNonce]);

  const safeCurrent = Math.max(0, current);
  const left = max - safeCurrent;
  const ratio = max > 0 ? Math.min(1, safeCurrent / max) : 0;
  const dash = `${(CIRCUMFERENCE * ratio).toFixed(2)} ${CIRCUMFERENCE.toFixed(2)}`;
  const state = left <= 0 ? 'over' : ratio >= 0.85 ? 'warn' : 'ok';

  const ringText = left <= 0 ? 'MAX' : left < 1000 ? String(left) : '85%+';
  const liveMessage =
    state === 'over'
      ? `Đã đạt giới hạn tối đa ${numberFormatter.format(max)} ký tự.`
      : state === 'warn'
        ? `Còn lại ${numberFormatter.format(left)} ký tự trong giới hạn ${numberFormatter.format(max)}.`
        : '';

  return (
    <div
      data-testid="code-char-limit-meter"
      role="meter"
      aria-label="Giới hạn ký tự mã nguồn"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(safeCurrent, max)}
      className={`ux u467-inline ${state === 'warn' ? 'is-warn' : state === 'over' ? 'is-over' : ''} ${className}`}
    >
      <span className={`u467-rg ${nudging ? 'is-nudge' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 30 30">
          <circle className="bg" cx="15" cy="15" r="12" />
          <circle className="fg" cx="15" cy="15" r="12" style={{ strokeDasharray: dash }} />
        </svg>
        <b>{ringText}</b>
      </span>

      <span className="u467-meta">
        {numberFormatter.format(safeCurrent)} / {numberFormatter.format(max)} ký tự
      </span>

      <p className="u467-live" role="status" aria-live="polite">
        {liveMessage}
      </p>
    </div>
  );
}
