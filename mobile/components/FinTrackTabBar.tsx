import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/src/theme/ThemeContext';

export const TAB_CONTENT_HEIGHT = 56;

/** Altura total da tab bar (conteúdo + área do gesto/nav bar do sistema). */
export function useTabBarTotalHeight() {
  const insets = useSafeAreaInsets();
  const bottomInset = getNavigationBarInset(insets.bottom);
  return TAB_CONTENT_HEIGHT + bottomInset;
}

/** Inset inferior: safe area ou fallback mínimo no Android (APK às vezes reporta 0). */
export function getNavigationBarInset(safeBottom: number) {
  if (safeBottom > 0) return safeBottom;
  return Platform.OS === 'android' ? 24 : 0;
}

type FinTrackTabBarProps = BottomTabBarProps & {
  iosBlur?: boolean;
};

export function FinTrackTabBar({ iosBlur = false, insets: tabInsets, ...props }: FinTrackTabBarProps) {
  const { theme, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = getNavigationBarInset(insets.bottom);
  const barBg = iosBlur ? theme.glassBg : theme.bgSecondary;

  return (
    <View
      style={[
        styles.wrapper,
        {
          minHeight: TAB_CONTENT_HEIGHT + bottomInset,
          borderTopColor: iosBlur ? theme.glassBorder : theme.border,
          backgroundColor: barBg,
        },
      ]}>
      {iosBlur ? <BlurView tint={scheme} intensity={88} style={StyleSheet.absoluteFill} /> : null}
      <BottomTabBar
        {...props}
        insets={{
          top: tabInsets.top,
          right: tabInsets.right,
          left: tabInsets.left,
          bottom: 0,
        }}
        style={{
          height: TAB_CONTENT_HEIGHT,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          paddingTop: 0,
          paddingBottom: 0,
        }}
      />
      {/* Faixa do gesto / nav bar do sistema — só cor, ícones ficam acima */}
      <View
        pointerEvents="none"
        style={{
          height: bottomInset,
          backgroundColor: barBg,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
