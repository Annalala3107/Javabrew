// Lucian UX/UI Prompt #439 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#439
import { useEffect, useRef, useState } from 'react';
import './lucian-439.css';

interface SkeletonCardProps {
  variant?: 'route' | 'article' | 'list';
}

export function SkeletonCard({ variant = 'article' }: SkeletonCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let onscreen = true;
    const sync = () => {
      setPaused(!onscreen || document.hidden);
    };

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        onscreen = entries[0]?.isIntersecting ?? true;
        sync();
      });
      io.observe(el);
    }

    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  if (variant === 'route') {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Đang tải trang"
        className={`ux u439-sk mx-auto w-full max-w-7xl space-y-4 p-6 ${paused ? 'is-paused' : ''}`}
      >
        <i className="u439-bone h-24 w-full" />
        <i className="u439-bone h-64 w-full" />
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Đang tải danh sách"
        className={`ux u439-sk space-y-2 ${paused ? 'is-paused' : ''}`}
      >
        <i className="u439-bone h-11 w-full" />
        <i className="u439-bone h-11 w-full" />
        <i className="u439-bone h-11 w-full" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Đang tải nội dung bài học"
      className={`ux u439-sk space-y-3 ${paused ? 'is-paused' : ''}`}
    >
      <i className="u439-bone h-7 w-3/4" />
      <i className="u439-bone h-4 w-full" />
      <i className="u439-bone h-4 w-5/6" />
      <i className="u439-bone h-40 w-full" />
    </div>
  );
}
