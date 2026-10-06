import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';

interface CountUpOptions {
  /** Duração em ms. */
  duration?: number;
  /** Atraso antes de começar, em ms (útil para escalonar vários números). */
  delay?: number;
  /** Ao mudar, recomeça a contagem do zero (ex.: a aba voltou a ficar em foco). */
  replayKey?: number;
}

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Anima de 0 até `target` na montagem e, depois, do valor atual até cada novo `target`.
 * Com "Reduzir movimento" ativo no sistema, retorna o valor final direto.
 * Espelha frontend/src/hooks/useCountUp.ts.
 */
export function useCountUp(
  target: number,
  { duration = 1000, delay = 0, replayKey = 0 }: CountUpOptions = {}
): number {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(() => (reduceMotion ? target : 0));
  const valueRef = useRef(value);
  const replayRef = useRef(replayKey);

  useEffect(() => {
    if (replayRef.current !== replayKey) {
      replayRef.current = replayKey;
      valueRef.current = 0;
    }
    const from = valueRef.current;
    if (from === target) {
      setValue(target);
      return;
    }

    if (reduceMotion) {
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
  }, [target, duration, delay, replayKey, reduceMotion]);

  return value;
}
