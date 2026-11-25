// Lucian UX/UI Prompt #307 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#307
import { useEffect, useRef, useState } from 'react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-307.css';

export interface KeywordItem {
  text: string;
  color?: string;
}

interface TypewriterKeywordProps {
  words: KeywordItem[];
  className?: string;
}

export function TypewriterKeyword({ words, className = '' }: TypewriterKeywordProps) {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState(words[0]?.text ?? '');
  const [isTyping, setIsTyping] = useState(false);
  const holdRef = useRef(false);

  const currentItem = words[index] ?? words[0];

  useEffect(() => {
    if (words.length <= 1) return;
    if (getPrefersReducedMotion()) {
      setDisplayText(words[0].text);
      setIsTyping(false);
      return;
    }

    let cancelled = false;
    let timer = 0;
    let curIndex = 0;
    let currentStr = words[0].text;

    const schedule = (fn: () => void, ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const nextCycle = () => {
      schedule(() => {
        if (holdRef.current || document.hidden) {
          nextCycle();
          return;
        }
        const nextIdx = (curIndex + 1) % words.length;
        const targetChars = Array.from(words[nextIdx].text);
        setIsTyping(true);

        const eraseStep = () => {
          const chars = Array.from(currentStr);
          if (chars.length > 0) {
            chars.pop();
            currentStr = chars.join('');
            setDisplayText(currentStr);
            schedule(eraseStep, 42);
            return;
          }
          curIndex = nextIdx;
          setIndex(nextIdx);
          let charIdx = 0;
          schedule(function typeStep() {
            charIdx += 1;
            currentStr = targetChars.slice(0, charIdx).join('');
            setDisplayText(currentStr);
            if (charIdx < targetChars.length) {
              schedule(typeStep, 58 + Math.random() * 45);
            } else {
              setIsTyping(false);
              nextCycle();
            }
          }, 180);
        };

        eraseStep();
      }, 2400);
    };

    nextCycle();

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => {
      if (mq?.matches) {
        cancelled = true;
        window.clearTimeout(timer);
        setIndex(0);
        setDisplayText(words[0].text);
        setIsTyping(false);
      }
    };
    mq?.addEventListener?.('change', onMotionChange);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      mq?.removeEventListener?.('change', onMotionChange);
    };
  }, [words]);

  return (
    <span
      className={`ux u307-inline ${isTyping ? 'is-typing' : ''} ${className}`}
      style={{ '--c': currentItem?.color || 'var(--ux-accent)' } as React.CSSProperties}
      onPointerEnter={() => {
        holdRef.current = true;
      }}
      onPointerLeave={() => {
        holdRef.current = false;
      }}
    >
      <span className="u307-sr">{currentItem?.text}</span>
      <span className="u307-b" aria-hidden="true">
        <span className="u307-w">{displayText}</span>
        <span className="u307-caret" />
      </span>
    </span>
  );
}
