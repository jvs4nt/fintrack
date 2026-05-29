/**
 * Dev: sempre `/api` (proxy Vite → alvo em vite.config, derivado de VITE_API_BASE_URL ou :3333).
 * Evita CORS/preflight OPTIONS ao apontar .env para API remota (Render).
 * Produção: URL absoluta de VITE_API_BASE_URL ou fallback local.
 */
export function resolveApiBase(): string {
  if (import.meta.env.DEV) {
    return '/api';
  }
  const fromEnv = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (fromEnv && /^https?:\/\//.test(fromEnv)) {
    return fromEnv;
  }
  return fromEnv || 'http://localhost:3333/api';
}
