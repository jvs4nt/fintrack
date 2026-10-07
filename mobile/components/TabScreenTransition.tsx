import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReduceMotion } from '@/src/hooks/useReduceMotion';

const DURATION_MS = 220;
const OFFSET_Y = 8;
const SCALE_FROM = 0.985;

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Anima entrada ao focar a aba (Tabs mantêm telas montadas).
 * Não usa `animation` nas Tabs do Expo SDK 54 (bugs conhecidos com shift/fade).
 */
export function TabScreenTransition({ children, style }: Props) {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  useFocusEffect(
    useCallback(() => {
      if (reduceMotion) {
        opacity.value = 1;
        translateY.value = 0;
        scale.value = 1;
        return () => {};
      }

      opacity.value = 0;
      translateY.value = OFFSET_Y;
      scale.value = SCALE_FROM;
      const timing = { duration: DURATION_MS, easing: Easing.out(Easing.cubic) };
      opacity.value = withTiming(1, timing);
      translateY.value = withTiming(0, timing);
      scale.value = withTiming(1, timing);

      return () => {
        opacity.value = 0;
        translateY.value = OFFSET_Y;
        scale.value = SCALE_FROM;
      };
    }, [opacity, translateY, scale, reduceMotion])
  );

  return (
    <Animated.View style={[{ flex: 1 }, style, animatedStyle]}>{children}</Animated.View>
  );
}
