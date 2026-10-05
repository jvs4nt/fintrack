import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
  delay?: number;
}

/** Número com contagem animada; leitores de tela recebem só o valor final. */
function AnimatedNumber({ value, format, duration, delay }: AnimatedNumberProps) {
  const animated = useCountUp(value, { duration, delay });

  return (
    <>
      <span className="animated-number" aria-hidden>
        {format(animated)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}

export default AnimatedNumber;
