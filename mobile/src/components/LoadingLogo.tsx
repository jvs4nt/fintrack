import { useEffect, useRef } from 'react';
import { Animated, ImageStyle, StyleSheet } from 'react-native';

type LoadingLogoProps = {
  size?: number;
  style?: ImageStyle;
};

const logoSource = require('../../assets/images/fintrack-logo.png');

export default function LoadingLogo({ size = 72, style }: LoadingLogoProps) {
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [scale]);

  return (
    <Animated.Image
      source={logoSource}
      accessibilityLabel="FinTrack"
      style={[styles.logo, { width: size, height: size, transform: [{ scale }] }, style]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
  },
});
