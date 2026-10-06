/**
 * FinTrack — paleta escura (Dark Finance) e clara, em paridade com frontend/src/App.css
 * (`:root` e `:root[data-theme='light']`). Use via `useTheme()` / `createThemedStyles`
 * de `@/src/theme/ThemeContext`, nunca importando a paleta direto nas telas.
 */

const layout = {
  spacingXs: 4,
  spacingSm: 8,
  spacingMd: 16,
  spacingLg: 24,
  spacingXl: 32,

  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 12,
  radiusXl: 16,
} as const;

export interface AppTheme {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  border: string;
  borderLight: string;
  accentPrimary: string;
  accentPrimaryDark: string;
  accentDanger: string;
  accentDangerDark: string;
  accentWarning: string;
  accentWarningDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  /** Texto/ícone sobre fundo `accentPrimary` (botões primários). */
  onAccent: string;
  /** Fundo sutil de destaque (chips, pills ativos). */
  accentSoft: string;
  /** Fundo atrás de modais e sheets. */
  overlay: string;
  /** Tab bar translúcida no iOS (sobre BlurView). */
  glassBg: string;
  glassBorder: string;

  spacingXs: number;
  spacingSm: number;
  spacingMd: number;
  spacingLg: number;
  spacingXl: number;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
  radiusXl: number;
}

export const darkTheme: AppTheme = {
  bgPrimary: '#0a0a0f',
  bgSecondary: '#111118',
  bgTertiary: '#1a1a24',
  border: '#2a2a38',
  borderLight: '#3a3a48',
  accentPrimary: '#00e5a0',
  accentPrimaryDark: '#00b37d',
  accentDanger: '#ff4d6d',
  accentDangerDark: '#e63956',
  accentWarning: '#ffc107',
  accentWarningDark: '#ff9800',
  textPrimary: '#e8e8f0',
  textSecondary: '#7a7a9a',
  textMuted: '#4a4a5a',
  onAccent: '#0a0a0f',
  accentSoft: '#1a1a24',
  overlay: 'rgba(0,0,0,0.65)',
  glassBg: 'rgba(17,17,24,0.55)',
  glassBorder: 'rgba(42,42,56,0.65)',
  ...layout,
};

/** Neutro quente (não branco puro) + verde mais escuro para contraste AA. */
export const lightTheme: AppTheme = {
  bgPrimary: '#f2f1ec',
  bgSecondary: '#fafaf7',
  bgTertiary: '#e9e7e0',
  border: '#dcd9cf',
  borderLight: '#c9c5b9',
  accentPrimary: '#067a55',
  accentPrimaryDark: '#05634a',
  accentDanger: '#c8314b',
  accentDangerDark: '#a82840',
  accentWarning: '#9a5b00',
  accentWarningDark: '#7d4a00',
  textPrimary: '#1d2420',
  textSecondary: '#59615b',
  textMuted: '#8a908a',
  onAccent: '#ffffff',
  accentSoft: 'rgba(6,122,85,0.09)',
  overlay: 'rgba(29,36,32,0.4)',
  glassBg: 'rgba(250,250,247,0.7)',
  glassBorder: 'rgba(29,36,32,0.1)',
  ...layout,
};

/** @deprecated — usado só pelos componentes de template (`Themed.tsx`); use `useTheme()`. */
export default {
  light: {
    text: lightTheme.textPrimary,
    background: lightTheme.bgPrimary,
    tint: lightTheme.accentPrimary,
    tabIconDefault: lightTheme.textMuted,
    tabIconSelected: lightTheme.accentPrimary,
  },
  dark: {
    text: darkTheme.textPrimary,
    background: darkTheme.bgPrimary,
    tint: darkTheme.accentPrimary,
    tabIconDefault: darkTheme.textMuted,
    tabIconSelected: darkTheme.accentPrimary,
  },
};
