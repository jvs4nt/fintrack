import { useEffect, useRef, useState } from 'react';

interface CountUpOptions {
  /** Duração em ms. */
  duration?: number;
  /** Atraso antes de começar, em ms (útil para escalonar vários números). */
  delay?: number;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Anima de 0 até `target` na montagem e, depois, do valor atual até cada novo `target`.
 * Com "reduzir movimento" ativo no sistema, retorna o valor final direto.
 */
export function useCountUp(target: number, { duration = 1000, delay = 0 }: CountUpOptions = {}): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const valueRef = useRef(value);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;

    if (prefersReducedMotion()) {
      valueRef.current = target;
      setValue(target);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (now: number) => {
      if (start === null) start = now + delay;
      const progress = Math.min(Math.max((now - start) / duration, 0), 1);
      const next = progress === 1 ? target : from + (target - from) * easeOutQuart(progress);

      valueRef.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, delay]);

  return value;
}

export default useCountUp;
