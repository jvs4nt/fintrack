import React from 'react';
import {
  YearMonth,
  formatYearMonth,
  isNavigableYear,
  isSameYearMonth,
  shiftYearMonth,
} from '../lib/yearMonth';

interface MonthNavigatorProps {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
  /** Mês de planejamento; quando diferente de `value`, mostra o atalho para voltar. */
  home?: YearMonth | null;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonthNavigator({ value, onChange, home }: MonthNavigatorProps) {
  const prev = shiftYearMonth(value, -1);
  const next = shiftYearMonth(value, 1);
  const homeTarget = home && !isSameYearMonth(home, value) ? home : null;

  return (
    <div className="month-nav">
      <button
        type="button"
        className="month-nav-btn"
        onClick={() => onChange(prev)}
        disabled={!isNavigableYear(prev.year)}
        aria-label={`Mês anterior: ${formatYearMonth(prev)}`}
      >
        <Chevron direction="left" />
      </button>
      <span className="month-nav-label" aria-live="polite">
        {formatYearMonth(value)}
      </span>
      <button
        type="button"
        className="month-nav-btn"
        onClick={() => onChange(next)}
        disabled={!isNavigableYear(next.year)}
        aria-label={`Próximo mês: ${formatYearMonth(next)}`}
      >
        <Chevron direction="right" />
      </button>
      {homeTarget && (
        <button
          type="button"
          className="month-nav-home"
          onClick={() => onChange(homeTarget)}
          title={`Voltar para ${formatYearMonth(homeTarget)}`}
        >
          Mês atual
        </button>
      )}
    </div>
  );
}

export default MonthNavigator;
