import { StyleProp, Text, TextStyle } from 'react-native';
import { useCountUp } from '@/src/hooks/useCountUp';

type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  style?: StyleProp<TextStyle>;
  duration?: number;
  delay?: number;
  replayKey?: number;
};

/** Número com contagem animada; leitores de tela recebem só o valor final. */
export function AnimatedNumber({ value, format, style, duration, delay, replayKey }: AnimatedNumberProps) {
  const animated = useCountUp(value, { duration, delay, replayKey });

  return (
    <Text style={style} accessibilityLabel={format(value)}>
      {format(animated)}
    </Text>
  );
}
