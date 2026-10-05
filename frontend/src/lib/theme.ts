/**
 * Tema da UI. A aplicação inicial roda num script inline em `index.html` (antes do CSS/React)
 * para evitar flash do tema errado — manter `STORAGE_KEY`, valores e cores em sincronia com ele.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const STORAGE_KEY = 'fintrack-theme';
export const DEFAULT_PREFERENCE: ThemePreference = 'dark';

const THEME_COLOR: Record<ResolvedTheme, string> = {
  dark: '#0a0a0f',
  light: '#f2f1ec',
};

const systemQuery = () => window.matchMedia('(prefers-color-scheme: light)');

export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* storage bloqueado — usa padrão */
  }
  return DEFAULT_PREFERENCE;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference !== 'system') return preference;
  return systemQuery().matches ? 'light' : 'dark';
}

const TRANSITION_CLASS = 'theme-transition';
const TRANSITION_MS = 250;
let transitionTimer: number | undefined;

export function applyTheme(theme: ResolvedTheme, options: { animate?: boolean } = {}): void {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;

  if (options.animate) {
    root.classList.add(TRANSITION_CLASS);
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
  }

  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function savePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    /* storage bloqueado — vale só para a sessão */
  }
}

export function subscribeToSystemTheme(onChange: () => void): () => void {
  const query = systemQuery();
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
