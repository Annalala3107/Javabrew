// Lucian UX/UI Prompt #086 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#086
import { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Square } from 'lucide-react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import './lucian-086.css';

interface StreamingAiBubbleProps {
  prompt: string;
  reply?: string;
  thinking?: boolean;
}

export function StreamingAiBubble({ prompt, reply = '', thinking = false }: StreamingAiBubbleProps) {
  const words = useMemo(() => reply.split(/(\s+)/).filter(Boolean), [reply]);
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    getPrefersReducedMotion() ? words.length : 0
  );
  const [stopped, setStopped] = useState(false);
  const [replaySeed, setReplaySeed] = useState(0);

  useEffect(() => {
    if (thinking) {
      setVisibleCount(0);
      setStopped(false);
      return;
    }

    if (getPrefersReducedMotion() || words.length === 0) {
      setVisibleCount(words.length);
      setStopped(false);
      return;
    }

    let cancelled = false;
    let count = 0;
    setVisibleCount(0);
    setStopped(false);

    const tick = () => {
      if (cancelled) return;
      count = Math.min(words.length, count + 2);
      setVisibleCount(count);
      if (count < words.length) {
        timer = window.setTimeout(tick, 32);
      }
    };

    let timer = window.setTimeout(tick, 28);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reply, thinking, words.length, replaySeed]);

  const isStreaming = !thinking && !stopped && visibleCount < words.length;
  const shownText = thinking
    ? ''
    : stopped
      ? `${words.slice(0, visibleCount).join('')}`
      : words.slice(0, visibleCount).join('');

  return (
    <div className={`ux u086-card ${thinking || isStreaming ? 'is-gen' : ''}`}>
      <div className="u086-q">Bạn hỏi: “{prompt}”</div>

      <div className="u086-a">
        <span className="u086-av" aria-hidden="true" />
        <div className="u086-body">
          {thinking ? (
            <span className="u086-dots" aria-label="AI đang suy nghĩ">
              <i />
              <i />
              <i />
            </span>
          ) : (
            <>
              <p className="whitespace-pre-wrap">
                <span className="u086-w">{shownText}</span>
                {isStreaming && <span className="u086-caret" aria-hidden="true" />}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={() => setStopped(true)}
                    className="u086-ctl"
                  >
                    <Square className="h-3 w-3" />
                    <span>Dừng</span>
                  </button>
                ) : (
                  reply && (
                    <button
                      type="button"
                      onClick={() => setReplaySeed((s) => s + 1)}
                      className="u086-ctl"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Đọc lại hiệu ứng</span>
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
