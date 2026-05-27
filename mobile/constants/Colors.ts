/**
 * FinTrack — Dark Finance (paridade com frontend/src/App.css :root)
 * Único tema; o web não possui light mode.
 */

export const Theme = {
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

export type ThemeColors = typeof Theme;

/** @deprecated — manter export default mínimo para código legado do template; use `Theme`. */
export default {
  light: {
    text: Theme.textPrimary,
    background: Theme.bgPrimary,
    tint: Theme.accentPrimary,
    tabIconDefault: Theme.textMuted,
    tabIconSelected: Theme.accentPrimary,
  },
  dark: {
    text: Theme.textPrimary,
    background: Theme.bgPrimary,
    tint: Theme.accentPrimary,
    tabIconDefault: Theme.textMuted,
    tabIconSelected: Theme.accentPrimary,
  },
};
