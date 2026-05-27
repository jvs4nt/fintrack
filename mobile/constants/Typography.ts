import { Theme } from './Colors';

/** Nomes das famílias carregadas em `app/_layout.tsx` (Google Fonts via @expo-google-fonts) */
export const FontFamily = {
  display: 'DMMono_400Regular',
  /** DM Mono no pacote @expo-google-fonts/dm-mono deste projeto não expõe 700; 500 como destaque */
  displayBold: 'DMMono_500Medium',
  ui: 'Sora_400Regular',
  uiMedium: 'Sora_500Medium',
  uiSemiBold: 'Sora_600SemiBold',
  uiBold: 'Sora_700Bold',
} as const;

export const Typography = {
  pageTitle: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 28,
    color: Theme.textPrimary,
  },
  pageSubtitle: {
    fontFamily: FontFamily.ui,
    fontSize: 15,
    color: Theme.textSecondary,
  },
  logo: {
    fontFamily: FontFamily.displayBold,
    fontSize: 28,
    letterSpacing: -1,
    color: Theme.accentPrimary,
  },
  logoSuffix: {
    fontFamily: FontFamily.displayBold,
    fontSize: 28,
    letterSpacing: -1,
    color: Theme.textPrimary,
  },
  body: {
    fontFamily: FontFamily.ui,
    fontSize: 16,
    color: Theme.textPrimary,
  },
  caption: {
    fontFamily: FontFamily.ui,
    fontSize: 13,
    color: Theme.textSecondary,
  },
} as const;
