import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { ColorScheme, useAppTheme } from '@/src/theme/ThemeContext';

/** Edge-to-edge: fundo vem da tab bar estendida; botões contrastam com o tema. */
export function applyAndroidNavigationBar(scheme: ColorScheme) {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle(scheme === 'dark' ? 'dark' : 'light');
  } catch {
    // setStyle exige enforceContrast: false no build nativo
  }
  void NavigationBar.setButtonStyleAsync(scheme === 'dark' ? 'light' : 'dark').catch(() => {});
}

/** Aplica no mount (layout raiz) e quando o tema muda. */
export function useAndroidNavigationBar() {
  const { scheme } = useAppTheme();
  useEffect(() => {
    applyAndroidNavigationBar(scheme);
  }, [scheme]);
}

/** Reaplica ao focar o grupo (app) — alguns fluxos resetam a barra do sistema. */
export function useAndroidNavigationBarOnFocus() {
  const { scheme } = useAppTheme();
  useFocusEffect(
    useCallback(() => {
      applyAndroidNavigationBar(scheme);
    }, [scheme]),
  );
}
