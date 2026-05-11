import { useCallback, useEffect, useRef, useState } from 'react';

function playBeep() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // audio unavailable
  }
}

/**
 * Countdown timer with wall-clock semantics — the remaining time is derived
 * from `Date.now()` and an `endsAt` deadline, so background tabs and
 * suspended PWAs catch up correctly when they come back to the foreground
 * instead of pausing where setInterval left off.
 */
export function useTimer(initialSeconds: number) {
  const [baseSeconds, setBaseSeconds] = useState(initialSeconds);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [pausedRemaining, setPausedRemaining] = useState<number | null>(null);
  const [, forceTick] = useState(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setBaseSeconds(initialSeconds);
    setEndsAt(null);
    setPausedRemaining(null);
    completedRef.current = false;
  }, [initialSeconds]);

  const computeRemaining = useCallback((): number => {
    if (endsAt != null) {
      return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    }
    if (pausedRemaining != null) return pausedRemaining;
    return baseSeconds;
  }, [endsAt, pausedRemaining, baseSeconds]);

  const isRunning = endsAt != null;
  const seconds = computeRemaining();

  // Re-render once per second while running so the UI updates. The math
  // itself doesn't depend on the interval firing — it's derived from
  // Date.now() — so a throttled tab just catches up on the next render.
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // Fire onComplete (beep + caller hook) the first time we cross zero.
  useEffect(() => {
    if (!isRunning) return;
    if (seconds > 0) {
      completedRef.current = false;
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    playBeep();
    onCompleteRef.current?.();
    setEndsAt(null);
    setPausedRemaining(0);
  }, [isRunning, seconds]);

  // When the page comes back to the foreground, force a recompute so the
  // displayed seconds matches reality (the setInterval may have been
  // throttled or paused entirely while hidden).
  useEffect(() => {
    const refresh = () => forceTick((t) => t + 1);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const start = useCallback(() => {
    setEndsAt((prev) => {
      if (prev != null) return prev;
      const remaining = pausedRemaining ?? baseSeconds;
      if (remaining <= 0) return prev;
      completedRef.current = false;
      return Date.now() + remaining * 1000;
    });
    setPausedRemaining(null);
  }, [baseSeconds, pausedRemaining]);

  const pause = useCallback(() => {
    setEndsAt((prev) => {
      if (prev == null) return prev;
      const remaining = Math.max(0, Math.ceil((prev - Date.now()) / 1000));
      setPausedRemaining(remaining);
      return null;
    });
  }, []);

  const reset = useCallback(
    (newSeconds?: number) => {
      const next = newSeconds ?? initialSeconds;
      setBaseSeconds(next);
      setEndsAt(null);
      setPausedRemaining(null);
      completedRef.current = false;
    },
    [initialSeconds]
  );

  const setOnComplete = useCallback((cb: (() => void) | null) => {
    onCompleteRef.current = cb;
  }, []);

  const endsAtMs = endsAt;

  return { seconds, isRunning, start, pause, reset, setOnComplete, endsAt: endsAtMs };
}

/**
 * Wall-clock elapsed timer — accepts an optional `startedAt` so a resumed
 * workout counts from the original start instead of restarting at zero.
 */
export function useElapsedTimer(startedAt?: number) {
  const startRef = useRef<number>(startedAt ?? Date.now());
  const [elapsed, setElapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - startRef.current) / 1000))
  );

  useEffect(() => {
    if (startedAt != null) startRef.current = startedAt;
    setElapsed(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)));
  }, [startedAt]);

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startRef.current) / 1000)));
    const i = setInterval(tick, 1000);
    const refresh = () => tick();
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(i);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  return elapsed;
}
