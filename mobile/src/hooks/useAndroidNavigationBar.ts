import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

/** Edge-to-edge: barra escura + botões claros; fundo vem da tab bar estendida. */
export function applyAndroidNavigationBar() {
  if (Platform.OS !== 'android') return;
  try {
    NavigationBar.setStyle('dark');
  } catch {
    // setStyle exige enforceContrast: false no build nativo
  }
  void NavigationBar.setButtonStyleAsync('light').catch(() => {});
}

/** Aplica no mount (layout raiz). */
export function useAndroidNavigationBar() {
  useEffect(() => {
    applyAndroidNavigationBar();
  }, []);
}

/** Reaplica ao focar o grupo (app) — alguns fluxos resetam a barra do sistema. */
export function useAndroidNavigationBarOnFocus() {
  useFocusEffect(
    useCallback(() => {
      applyAndroidNavigationBar();
    }, []),
  );
}
