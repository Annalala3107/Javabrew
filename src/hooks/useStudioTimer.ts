import { useCallback, useEffect, useRef, useState } from 'react';

export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.trunc(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface UseStudioTimerOptions {
  initialSeconds: number;
  autoStart?: boolean;
  disabled?: boolean;
  onExpire?: () => void;
}

export function useStudioTimer({
  initialSeconds,
  autoStart = false,
  disabled = false,
  onExpire,
}: UseStudioTimerOptions) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [timerRunning, setTimerRunning] = useState(autoStart && !disabled);
  const onExpireRef = useRef(onExpire);
  const initialSecondsRef = useRef(initialSeconds);
  const autoStartRef = useRef(autoStart);
  const firedExpireRef = useRef(false);
  onExpireRef.current = onExpire;
  initialSecondsRef.current = initialSeconds;
  autoStartRef.current = autoStart;

  useEffect(() => {
    if (!timerRunning || disabled) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning, disabled]);

  useEffect(() => {
    if (secondsLeft === 0 && timerRunning && !disabled && !firedExpireRef.current) {
      firedExpireRef.current = true;
      setTimerRunning(false);
      onExpireRef.current?.();
    }
  }, [secondsLeft, timerRunning, disabled]);

  const toggleTimer = useCallback(() => {
    if (disabled) return;
    setTimerRunning((prev) => !prev);
  }, [disabled]);

  const resetTimer = useCallback(
    (nextSeconds = initialSecondsRef.current, shouldRun = autoStartRef.current) => {
      firedExpireRef.current = false;
      setSecondsLeft(Math.max(0, Math.trunc(nextSeconds)));
      setTimerRunning(Boolean(shouldRun));
    },
    []
  );

  return {
    secondsLeft,
    timerRunning,
    setTimerRunning,
    toggleTimer,
    resetTimer,
    formattedClock: formatClock(secondsLeft),
  };
}
