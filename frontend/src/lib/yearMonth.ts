export interface YearMonth {
  year: number;
  month: number;
}

const currentYear = new Date().getFullYear();

/** Anos navegáveis (mesma faixa do seletor de ano em Meses). */
export const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
const MIN_YEAR = YEARS[0];
const MAX_YEAR = YEARS[YEARS.length - 1];

export function shiftYearMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function isNavigableYear(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
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
