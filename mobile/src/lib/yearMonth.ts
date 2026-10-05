/** Helpers de ano/mês — espelha frontend/src/lib/yearMonth.ts. */
export interface YearMonth {
  year: number;
  month: number;
}

const currentYear = new Date().getFullYear();
const MIN_YEAR = 2024;

/** Anos navegáveis (seletor de ano em Meses e setas do Dashboard). */
export const YEARS = Array.from(
  { length: Math.max(1, currentYear + 5 - MIN_YEAR + 1) },
  (_, i) => MIN_YEAR + i
);
const MAX_YEAR = YEARS[YEARS.length - 1];

export function shiftYearMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function isNavigableYear(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

export function clampToNavigable(ym: YearMonth): YearMonth {
  if (ym.year < MIN_YEAR) return { year: MIN_YEAR, month: 1 };
  if (ym.year > MAX_YEAR) return { year: MAX_YEAR, month: 12 };
  return ym;
}

export function isSameYearMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year === b.year && a.month === b.month;
}

/** Mês de planejamento: passou do payday → mês seguinte. Regra em spec/CONVENTIONS.md. */
export function computePlanningMonth(payday: number, today = new Date()): YearMonth {
  const offset = today.getDate() > payday ? 1 : 0;
  return shiftYearMonth({ year: today.getFullYear(), month: today.getMonth() + 1 }, offset);
}

export function formatYearMonth({ year, month }: YearMonth): string {
  return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
