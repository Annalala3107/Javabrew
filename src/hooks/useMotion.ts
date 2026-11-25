import { useEffect, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

let pluginsRegistered = false;
function ensureGsapPlugins() {
  if (!pluginsRegistered && typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger, useGSAP);
    pluginsRegistered = true;
  }
}

export function getPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(getPrefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  return reduced;
}

interface RevealSectionOptions {
  selector?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  scrollTrigger?: boolean;
  start?: string;
  disabled?: boolean;
  dependencies?: unknown[];
}

/**
 * GSAP progressive entrance / scroll reveal respecting prefers-reduced-motion
 * and animating only compositor properties (transform, opacity).
 */
export function useRevealSection(
  scopeRef: RefObject<HTMLElement | null>,
  {
    selector = '[data-reveal]',
    y = 16,
    duration = 0.42,
    stagger = 0.06,
    scrollTrigger = false,
    start = 'top 88%',
    disabled = false,
    dependencies = [],
  }: RevealSectionOptions = {}
) {
  useGSAP(
    () => {
      if (disabled || typeof window === 'undefined' || /jsdom/i.test(window.navigator?.userAgent || '')) {
        return;
      }
      ensureGsapPlugins();
      const root = scopeRef.current;
      if (!root) return;
      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      if (targets.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (scrollTrigger) {
          gsap.from(targets, {
            opacity: 0,
            y,
            duration,
            stagger: Math.min(stagger, 0.08),
            ease: 'power2.out',
            clearProps: 'opacity,transform',
            scrollTrigger: {
              trigger: root,
              start,
              once: true,
            },
          });
        } else {
          gsap.from(targets, {
            opacity: 0,
            y,
            duration,
            stagger: Math.min(stagger, 0.08),
            ease: 'power2.out',
            clearProps: 'opacity,transform',
          });
        }
      });

      return () => {
        mm.revert();
      };
    },
    { scope: scopeRef, dependencies: [disabled, ...dependencies] }
  );
}
