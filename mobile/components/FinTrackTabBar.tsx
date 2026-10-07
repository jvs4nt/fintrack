import { CommonActions } from '@react-navigation/native';
import type { BottomTabBarProps, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/Typography';
import { useReduceMotion } from '@/src/hooks/useReduceMotion';
import { useAppTheme } from '@/src/theme/ThemeContext';

export const TAB_CONTENT_HEIGHT = 56;

const INDICATOR_WIDTH = 28;
const INDICATOR_HEIGHT = 3;
const PILL_BG = 'rgba(0,229,160,0.12)';
const SPRING = { damping: 18, stiffness: 240, mass: 0.55 } as const;
const ITEM_TIMING = { duration: 220, easing: Easing.out(Easing.cubic) };

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

type TabOptions = BottomTabNavigationOptions & { href?: string | null };

function isVisibleTab(options: TabOptions) {
  if (options.href === null) return false;
  return typeof options.tabBarIcon === 'function';
}

function tabLabel(options: BottomTabNavigationOptions, routeName: string) {
  if (typeof options.tabBarLabel === 'string') return options.tabBarLabel;
  if (typeof options.title === 'string') return options.title;
  return routeName;
}

type FinTrackTabBarProps = BottomTabBarProps & {
  iosBlur?: boolean;
};

export function FinTrackTabBar({
  state,
  descriptors,
  navigation,
  iosBlur = false,
}: FinTrackTabBarProps) {
  const { theme, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const bottomInset = getNavigationBarInset(insets.bottom);
  const barBg = iosBlur ? theme.glassBg : theme.bgSecondary;
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const didPlaceIndicator = useRef(false);

  const visibleRoutes = useMemo(
    () =>
      state.routes.filter((route) =>
        isVisibleTab((descriptors[route.key]?.options ?? {}) as TabOptions)
      ),
    [state.routes, descriptors]
  );

  const focusedKey = state.routes[state.index]?.key;
  const focusedVisibleIndex = visibleRoutes.findIndex((route) => route.key === focusedKey);
  const itemWidth = visibleRoutes.length > 0 && barWidth > 0 ? barWidth / visibleRoutes.length : 0;

  useEffect(() => {
    if (focusedVisibleIndex < 0 || itemWidth <= 0) return;
    const x = focusedVisibleIndex * itemWidth + (itemWidth - INDICATOR_WIDTH) / 2;
    if (!didPlaceIndicator.current || reduceMotion) {
      indicatorX.value = x;
      didPlaceIndicator.current = true;
      return;
    }
    indicatorX.value = withSpring(x, SPRING);
  }, [focusedVisibleIndex, itemWidth, reduceMotion, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

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
      <View
        accessibilityRole="tablist"
        style={styles.row}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}>
        {itemWidth > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              { backgroundColor: theme.accentPrimary },
              indicatorStyle,
              Platform.OS === 'ios'
                ? { shadowColor: theme.accentPrimary, shadowOpacity: 0.85, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }
                : null,
            ]}
          />
        ) : null}
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = route.key === focusedKey;
          const color = focused ? theme.accentPrimary : theme.textMuted;
          const label = tabLabel(options, route.name);
          const icon = options.tabBarIcon?.({ focused, color, size: focused ? 24 : 22 });

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.dispatch({
                ...CommonActions.navigate(route),
                target: state.key,
              });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              reduceMotion={reduceMotion}
              accentColor={theme.accentPrimary}
              mutedColor={theme.textMuted}
              label={label}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}>
              {icon}
            </TabItem>
          );
        })}
      </View>
      <View pointerEvents="none" style={{ height: bottomInset, backgroundColor: barBg }} />
    </View>
  );
}

function TabItem({
  focused,
  reduceMotion,
  accentColor,
  mutedColor,
  label,
  accessibilityLabel,
  testID,
  onPress,
  onLongPress,
  children,
}: {
  focused: boolean;
  reduceMotion: boolean;
  accentColor: string;
  mutedColor: string;
  label: string;
  accessibilityLabel: string;
  testID?: string;
  onPress: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = focused ? 1 : 0;
      return;
    }
    progress.value = withTiming(focused ? 1 : 0, ITEM_TIMING);
  }, [focused, reduceMotion, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], [mutedColor, accentColor]),
  }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.item, pressed && !focused ? styles.itemPressed : null]}>
      <View style={styles.iconWrap}>
        <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
        <Animated.View style={iconStyle}>{children}</Animated.View>
      </View>
      <Animated.Text numberOfLines={1} style={[styles.label, labelStyle]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: TAB_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    zIndex: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 4,
    gap: 2,
  },
  itemPressed: {
    opacity: 0.72,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: PILL_BG,
  },
  label: {
    fontSize: 11,
    fontFamily: FontFamily.uiMedium,
    includeFontPadding: false,
  },
});
