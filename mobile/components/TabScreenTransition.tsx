import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const DURATION_MS = 240;
const OFFSET_Y = 10;

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Anima entrada ao focar a aba (Tabs mantêm telas montadas).
 * Não usa `animation` nas Tabs do Expo SDK 54 (bugs conhecidos com shift/fade).
 */
export function TabScreenTransition({ children, style }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0;
        return () => {};
      }

      opacity.value = 0;
      translateY.value = OFFSET_Y;
      opacity.value = withTiming(1, {
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration: DURATION_MS,
        easing: Easing.out(Easing.cubic),
      });

      return () => {
        opacity.value = 0;
        translateY.value = OFFSET_Y;
      };
    }, [opacity, translateY, reduceMotion])
  );

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>{children}</Animated.View>
  );
}
