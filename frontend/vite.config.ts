import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Host do proxy `/api/` em dev: origin de VITE_API_BASE_URL ou backend local. */
function resolveDevApiProxyTarget(env: Record<string, string>): string {
  const raw = (env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
  if (raw && /^https?:\/\//.test(raw)) {
    try {
      const withPath = raw.endsWith('/api') ? raw : `${raw}/api`;
      return new URL(withPath).origin;
    } catch {
      /* fallback */
    }
  }
  return 'http://localhost:3333';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = resolveDevApiProxyTarget(env);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // `/api/` — não usar `/api` sozinho: casaria com `/api-docs` (página SPA)
        '/api/': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
