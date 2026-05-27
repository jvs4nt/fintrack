import { BottomTabBar } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Theme } from '@/constants/Colors';

export const TAB_CONTENT_HEIGHT = 56;

type FinTrackTabBarProps = BottomTabBarProps & {
  iosBlur?: boolean;
};

export function FinTrackTabBar({ iosBlur = false, insets: tabInsets, ...props }: FinTrackTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: insets.bottom,
          borderTopColor: iosBlur ? 'rgba(42,42,56,0.65)' : Theme.border,
          backgroundColor: iosBlur ? 'rgba(17,17,24,0.55)' : Theme.bgSecondary,
        },
      ]}>
      {iosBlur ? <BlurView tint="dark" intensity={88} style={StyleSheet.absoluteFill} /> : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
