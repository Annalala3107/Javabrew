// Lucian UX/UI Prompt #008 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#008
import { useEffect, useRef, useState } from 'react';
import './lucian-008.css';

interface CopyCodeButtonProps {
  code: string;
  label?: string;
  copiedLabel?: string;
  ariaLabel?: string;
  onCopied?: () => void;
  className?: string;
}

export function CopyCodeButton({
  code,
  label = 'Sao chép',
  copiedLabel = 'Đã chép',
  ariaLabel = 'Sao chép đoạn mã',
  onCopied,
  className = '',
}: CopyCodeButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    return () => window.clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(code);
      }
    } catch {
      // Fallback safely ignored in non-HTTPS contexts
    }
    setCopied(true);
    onCopied?.();
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={ariaLabel}
      className={`ux u008-btn ${copied ? 'is-copied' : ''} ${className}`}
    >
      <span className="u008-ico" aria-hidden="true">
        <svg className="u008-cp" viewBox="0 0 24 24">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
          <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
        </svg>
        <svg className="u008-ok" viewBox="0 0 24 24">
          <path d="M5.5 12.5l4.2 4.2L18.5 8" />
        </svg>
      </span>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
