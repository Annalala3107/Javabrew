// Lucian UX/UI Prompt #471 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#471
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-471.css';

interface CommandKButtonProps {
  onClick: () => void;
  label?: string;
}

export function CommandKButton({ onClick, label = 'Tìm nhanh' }: CommandKButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [isMac, setIsMac] = useState(false);
  const [down, setDown] = useState(false);
  const [modDown, setModDown] = useState(false);
  const [keyDown, setKeyDown] = useState(false);
  const [askK, setAskK] = useState(false);
  const [hit, setHit] = useState(false);

  useEffect(() => {
    const plat =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ||
      navigator.platform ||
      navigator.userAgent ||
      '';
    setIsMac(/mac|iphone|ipad|ipod/i.test(plat));
  }, []);

  useEffect(() => {
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(fn, ms);
      timers.push(id);
    };

    const onKey = (e: KeyboardEvent) => {
      const rm = getPrefersReducedMotion();
      if (e.type === 'keydown') {
        if (e.key === 'Meta' || e.key === 'Control') {
          if (!e.repeat) {
            setModDown(true);
            setAskK(true);
          }
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !e.altKey && !e.shiftKey) {
          setAskK(false);
          setModDown(true);
          setKeyDown(true);
          setHit(true);
          later(() => {
            setKeyDown(false);
            setModDown(false);
            setHit(false);
          }, rm ? 60 : 240);
        }
      } else if (e.key === 'Meta' || e.key === 'Control') {
        setModDown(false);
        setAskK(false);
      }
    };

    const onBlur = () => {
      setDown(false);
      setModDown(false);
      setKeyDown(false);
      setAskK(false);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    window.addEventListener('blur', onBlur);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  const triggerVisual = () => {
    const rm = getPrefersReducedMotion();
    if (!rm && btnRef.current) {
      const rp = document.createElement('span');
      rp.className = 'u471-rp';
      rp.style.left = '82%';
      rp.style.top = '50%';
      btnRef.current.appendChild(rp);
      window.setTimeout(() => rp.remove(), 720);
    }
    setHit(true);
    window.setTimeout(() => setHit(false), 380);
    onClick();
  };

  return (
    <span className="ux u471-wrap">
      <button
        ref={btnRef}
        type="button"
        onClick={triggerVisual}
        onPointerDown={() => {
          setDown(true);
          setModDown(true);
          setKeyDown(true);
        }}
        onPointerUp={() => {
          setDown(false);
          setModDown(false);
          setKeyDown(false);
        }}
        onPointerLeave={() => {
          setDown(false);
          setModDown(false);
          setKeyDown(false);
        }}
        aria-label="Tìm nhanh (Ctrl+K)"
        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        className={`u471-b ${down ? 'is-down' : ''} ${hit ? 'is-hit is-pop' : ''}`}
      >
        <svg className="u471-ic" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.5 15.5 4.5 4.5" />
        </svg>
        <span className="u471-l hidden sm:inline">{label}</span>
        <span className="u471-ks hidden sm:inline-flex" aria-hidden="true">
          <kbd className={`u471-k ${isMac ? '' : 'is-wide'} ${modDown ? 'is-down' : ''}`}>
            <span className="u471-t">{isMac ? '⌘' : 'Ctrl'}</span>
          </kbd>
          <kbd
            className={`u471-k ${keyDown ? 'is-down' : ''} ${askK ? 'is-ask' : ''}`}
          >
            <span className="u471-t">K</span>
          </kbd>
        </span>
      </button>
    </span>
  );
}
