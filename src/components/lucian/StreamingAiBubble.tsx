// Lucian UX/UI Prompt #086 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#086
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, RotateCcw, Settings, Square } from 'lucide-react';
import { getPrefersReducedMotion } from '../../hooks/useMotion';
import { MarkdownRenderer } from '../MarkdownRenderer';
import './lucian-086.css';

interface StreamingAiBubbleProps {
  prompt: string;
  reply?: string;
  thinking?: boolean;
  streaming?: boolean;
  liveStreamed?: boolean;
  allowJavaRun?: boolean;
  tone?: 'ai' | 'offline' | 'error';
  badgeLabel?: string;
  onOpenSettings?: () => void;
  onAbortStream?: () => void;
}

export function StreamingAiBubble({
  prompt,
  reply = '',
  thinking = false,
  streaming = false,
  liveStreamed = false,
  allowJavaRun = false,
  tone = 'ai',
  badgeLabel,
  onOpenSettings,
  onAbortStream,
}: StreamingAiBubbleProps) {
  const words = useMemo(() => reply.split(/(\s+)/).filter(Boolean), [reply]);
  const skipAnimation =
    tone === 'error' ||
    Boolean(streaming) ||
    Boolean(liveStreamed) ||
    getPrefersReducedMotion();
  const [visibleCount, setVisibleCount] = useState<number>(() =>
    skipAnimation ? words.length : 0
  );
  const [stopped, setStopped] = useState(false);
  const [replaySeed, setReplaySeed] = useState(0);
  const timerRef = useRef<number>(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    window.clearTimeout(timerRef.current);

    if (thinking) {
      stoppedRef.current = false;
      setVisibleCount(0);
      setStopped(false);
      return;
    }

    if (
      tone === 'error' ||
      streaming ||
      (liveStreamed && replaySeed === 0) ||
      getPrefersReducedMotion() ||
      words.length === 0
    ) {
      stoppedRef.current = false;
      setVisibleCount(words.length);
      setStopped(false);
      return;
    }

    let cancelled = false;
    let count = 0;
    stoppedRef.current = false;
    setVisibleCount(0);
    setStopped(false);

    const tick = () => {
      if (cancelled || stoppedRef.current) return;
      count = Math.min(words.length, count + 2);
      setVisibleCount(count);
      if (count < words.length && !stoppedRef.current) {
        timerRef.current = window.setTimeout(tick, 32);
      }
    };

    timerRef.current = window.setTimeout(tick, 28);
    return () => {
      cancelled = true;
      window.clearTimeout(timerRef.current);
    };
  }, [reply, thinking, streaming, liveStreamed, tone, words.length, replaySeed]);

  const handleStop = () => {
    if (streaming && onAbortStream) {
      onAbortStream();
      return;
    }
    stoppedRef.current = true;
    window.clearTimeout(timerRef.current);
    setStopped(true);
  };

  const handleShowAll = () => {
    stoppedRef.current = false;
    window.clearTimeout(timerRef.current);
    setStopped(false);
    setVisibleCount(words.length);
  };

  const isLocalAnimating = !thinking && !streaming && !stopped && visibleCount < words.length;
  const isActivelyStreaming = Boolean(streaming) || isLocalAnimating;
  const shownText = thinking
    ? ''
    : streaming
      ? reply
      : words.slice(0, visibleCount).join('');
  const showThinkingDots = thinking || (streaming && reply.length === 0);

  return (
    <div
      className={[
        'ux u086-card',
        showThinkingDots || isActivelyStreaming ? 'is-gen' : '',
        tone === 'error' ? 'is-err' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="u086-q">Bạn hỏi: “{prompt}”</div>
        {badgeLabel && (
          <span
            className={[
              'rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold',
              tone === 'error'
                ? 'border border-[var(--danger)]/35 bg-[var(--danger-soft)] text-[var(--danger-text)]'
                : tone === 'offline'
                  ? 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
                  : 'border border-[var(--info)]/35 bg-[var(--info-soft)] text-[var(--info-text)]',
            ].join(' ')}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      <div className="u086-a">
        <span className="u086-av" aria-hidden="true" />
        <div className="u086-body">
          {showThinkingDots ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="u086-dots" aria-label="AI đang suy nghĩ">
                <i />
                <i />
                <i />
              </span>
              {streaming && onAbortStream && (
                <button type="button" onClick={onAbortStream} className="u086-ctl">
                  <Square className="h-3 w-3" />
                  <span>Dừng</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="u086-w">
                <MarkdownRenderer
                  content={shownText}
                  currentRel="studio/ai-mentor.md"
                  compact
                  allowJavaRun={allowJavaRun}
                />
                {isActivelyStreaming && <span className="u086-caret" aria-hidden="true" />}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {streaming ? (
                  onAbortStream && (
                    <button type="button" onClick={handleStop} className="u086-ctl">
                      <Square className="h-3 w-3" />
                      <span>Dừng</span>
                    </button>
                  )
                ) : isLocalAnimating ? (
                  <>
                    <button type="button" onClick={handleStop} className="u086-ctl">
                      <Square className="h-3 w-3" />
                      <span>Dừng</span>
                    </button>
                    <button type="button" onClick={handleShowAll} className="u086-ctl">
                      <Eye className="h-3 w-3" />
                      <span>Hiện toàn bộ</span>
                    </button>
                  </>
                ) : (
                  <>
                    {stopped && visibleCount < words.length && (
                      <button type="button" onClick={handleShowAll} className="u086-ctl">
                        <Eye className="h-3 w-3" />
                        <span>Hiện toàn bộ</span>
                      </button>
                    )}
                    {reply && tone !== 'error' && (
                      <button
                        type="button"
                        onClick={() => setReplaySeed((s) => s + 1)}
                        className="u086-ctl"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Đọc lại hiệu ứng</span>
                      </button>
                    )}
                    {onOpenSettings && (tone === 'error' || tone === 'offline') && (
                      <button type="button" onClick={onOpenSettings} className="u086-ctl">
                        <Settings className="h-3 w-3" />
                        <span>{tone === 'error' ? 'Mở Cài đặt Key' : 'Cài đặt Gemini Key'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
