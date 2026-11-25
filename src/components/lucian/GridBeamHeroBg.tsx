// Lucian UX/UI Prompt #226 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#226
import { useEffect, useRef, type ReactNode } from 'react';
import './lucian-226.css';

interface GridBeamHeroBgProps {
  children: ReactNode;
  className?: string;
}

interface Beam {
  v: boolean;
  l: number;
  p: number;
  d: number;
  sp: number;
  len: number;
  c: string;
}

export function GridBeamHeroBg({ children, className = '' }: GridBeamHeroBgProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const cv = canvasRef.current;
    if (!root || !cv) return;

    const cx = cv.getContext?.('2d');
    if (!cx) return;

    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reduced = mq?.matches ?? false;
    const cell = 36;
    let width = Math.max(320, root.clientWidth || 960);
    let height = Math.max(240, root.clientHeight || 420);
    let dpr = Math.min(2, window.devicePixelRatio || 1);
    let beams: Beam[] = [];
    let acc = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const colors = ['245,158,11', '56,189,248', '34,197,94'];

    const syncCanvasSize = () => {
      width = Math.max(320, root.clientWidth || 960);
      height = Math.max(240, root.clientHeight || 420);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = width * dpr;
      cv.height = height * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = () => {
      const v = Math.random() < 0.5;
      const maxTracks = Math.max(2, Math.floor((v ? width : height) / cell) - 1);
      const line = (1 + Math.floor(Math.random() * maxTracks)) * cell - 1;
      const dir = Math.random() < 0.5 ? 1 : -1;
      beams.push({
        v,
        l: line,
        p: dir > 0 ? -60 : (v ? height : width) + 60,
        d: dir,
        sp: 95 + Math.random() * 80,
        len: 55 + Math.random() * 45,
        c: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    const draw = () => {
      cx.clearRect(0, 0, width, height);
      beams.forEach((b) => {
        const x0 = b.v ? b.l : b.p - b.d * b.len;
        const y0 = b.v ? b.p - b.d * b.len : b.l;
        const x1 = b.v ? b.l : b.p;
        const y1 = b.v ? b.p : b.l;
        const g = cx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, `rgba(${b.c},0)`);
        g.addColorStop(1, `rgba(${b.c},.78)`);
        cx.strokeStyle = g;
        cx.lineWidth = 1.5;
        cx.beginPath();
        cx.moveTo(x0 + 0.5, y0 + 0.5);
        cx.lineTo(x1 + 0.5, y1 + 0.5);
        cx.stroke();
        cx.fillStyle = `rgba(${b.c},.95)`;
        cx.shadowColor = `rgba(${b.c},.8)`;
        cx.shadowBlur = 7;
        cx.beginPath();
        cx.arc(x1 + 0.5, y1 + 0.5, 1.8, 0, Math.PI * 2);
        cx.fill();
        cx.shadowBlur = 0;
      });
    };

    const stopLoop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!root.isConnected || !visible || document.hidden || reduced) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      acc += dt;
      if (acc > 0.55 && beams.length < 7) {
        acc = 0;
        spawn();
      }
      beams.forEach((b) => {
        b.p += b.d * b.sp * dt;
      });
      beams = beams.filter((b) => {
        const lim = (b.v ? height : width) + 70;
        return b.d > 0 ? b.p < lim : b.p > -70;
      });
      draw();
      raf = requestAnimationFrame(frame);
    };

    const startLoop = () => {
      if (!raf && visible && !document.hidden && !reduced) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    syncCanvasSize();
    if (!reduced) {
      for (let i = 0; i < 4; i++) {
        spawn();
        beams[i].p = (beams[i].v ? height : width) * (0.2 + i * 0.18);
      }
      draw();
      startLoop();
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(syncCanvasSize);
      ro.observe(root);
    }

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        visible = entries[0]?.isIntersecting ?? true;
        if (visible) startLoop();
        else stopLoop();
      });
      io.observe(root);
    }

    const onVisibility = () => {
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onPointerMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      root.style.setProperty('--mx', `${(e.clientX - r.left).toFixed(0)}px`);
      root.style.setProperty('--my', `${(e.clientY - r.top).toFixed(0)}px`);
    };
    const onPointerLeave = () => {
      root.style.setProperty('--mx', '-240px');
      root.style.setProperty('--my', '-240px');
    };
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerleave', onPointerLeave);

    const onMotionChange = () => {
      reduced = mq?.matches ?? false;
      if (reduced) {
        stopLoop();
        cx.clearRect(0, 0, width, height);
      } else {
        startLoop();
      }
    };
    mq?.addEventListener?.('change', onMotionChange);

    return () => {
      stopLoop();
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerleave', onPointerLeave);
      mq?.removeEventListener?.('change', onMotionChange);
    };
  }, []);

  return (
    <div ref={rootRef} className={`ux u226 ${className}`}>
      <div className="u226-gd" aria-hidden="true" />
      <div className="u226-gl" aria-hidden="true" />
      <canvas ref={canvasRef} className="u226-cv" aria-hidden="true" />
      <div className="u226-glow" aria-hidden="true" />
      <div className="u226-glow-2" aria-hidden="true" />
      <div className="u226-inner">{children}</div>
    </div>
  );
}
