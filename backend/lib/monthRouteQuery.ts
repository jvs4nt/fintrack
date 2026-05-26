import { Request } from 'express';
import { routeParamInt } from '../types/auth';

export type ParsedYearMonth =
  | { ok: true; yearInt: number; monthInt: number }
  | { ok: false; error: string };

export function parseYearMonth(
  year: string | string[],
  month: string | string[]
): ParsedYearMonth {
  const yearInt = routeParamInt(year);
  const monthInt = routeParamInt(month);
  if (!Number.isFinite(yearInt) || !Number.isFinite(monthInt) || monthInt < 1 || monthInt > 12) {
    return { ok: false, error: 'Ano ou mês inválido' };
  }
  return { ok: true, yearInt, monthInt };
}

/** Default: sync on. Skip with `?sync=0` or `?sync=false`. */
export function shouldSyncFixed(req: Request): boolean {
  const raw = req.query.sync;
  const value = (Array.isArray(raw) ? raw[0] : raw)?.toString().toLowerCase();
  if (value === '0' || value === 'false') return false;
  return true;
}
