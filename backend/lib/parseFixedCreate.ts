/**
 * Validação e parse de corpo para POST de fixos (ganho/gasto).
 * Evita `!amount` / `!dayOfMonth` — em JS, `!0` é true e gerava 400 enganoso.
 */
type Body = Record<string, unknown>;

function strField(body: Body, key: string): string {
  const v = body[key];
  return typeof v === 'string' ? v.trim() : '';
}

/** Aceita número JSON ou string pt-BR (ex.: "1.234,56"). */
export function parseAmountField(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value ?? '').trim();
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(s.replace(/,/g, ''));
}

export function parseDayField(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  return parseInt(String(value ?? '').trim(), 10);
}

export type FixedCreateBase = {
  name: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  active: boolean;
};

export function validateFixedCreateBase(body: Body): { ok: true; data: FixedCreateBase } | { ok: false; error: string } {
  const name = strField(body, 'name');
  const category = strField(body, 'category');
  const amount = parseAmountField(body.amount);
  const dayOfMonth = parseDayField(body.dayOfMonth);

  if (!name) return { ok: false, error: 'Nome é obrigatório.' };
  if (!category) return { ok: false, error: 'Categoria é obrigatória.' };
  if (Number.isNaN(amount) || amount <= 0) {
    return { ok: false, error: 'Informe um valor numérico maior que zero.' };
  }
  if (Number.isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { ok: false, error: 'Dia do mês deve ser entre 1 e 31.' };
  }

  const active = body.active === undefined ? true : Boolean(body.active);
  return { ok: true, data: { name, category, amount, dayOfMonth, active } };
}
