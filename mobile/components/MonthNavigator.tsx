import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import {
  YearMonth,
  formatYearMonth,
  isNavigableYear,
  isSameYearMonth,
  shiftYearMonth,
} from '@/src/lib/yearMonth';

type MonthNavigatorProps = {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
  /** Mês de planejamento — habilita o atalho "Mês atual" quando o usuário navega para longe dele. */
  home?: YearMonth | null;
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function MonthNavigator({ value, onChange, home }: MonthNavigatorProps) {
  const theme = useTheme();
  const styles = useStyles();
  const prev = shiftYearMonth(value, -1);
  const next = shiftYearMonth(value, 1);
  const canPrev = isNavigableYear(prev.year);
  const canNext = isNavigableYear(next.year);
  const homeTarget = home && !isSameYearMonth(home, value) ? home : null;

  const go = (target: YearMonth) => {
    void Haptics.selectionAsync();
    onChange(target);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Pressable
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed, !canPrev && styles.disabled]}
          onPress={() => go(prev)}
          disabled={!canPrev}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Mês anterior: ${formatYearMonth(prev)}`}>
          <Ionicons name="chevron-back" size={20} color={theme.accentPrimary} />
        </Pressable>
        <Text style={styles.label} accessibilityLiveRegion="polite" numberOfLines={1}>
          {capitalize(formatYearMonth(value))}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed, !canNext && styles.disabled]}
          onPress={() => go(next)}
          disabled={!canNext}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Próximo mês: ${formatYearMonth(next)}`}>
          <Ionicons name="chevron-forward" size={20} color={theme.accentPrimary} />
        </Pressable>
      </View>
      {homeTarget ? (
        <Pressable
          style={({ pressed }) => [styles.home, pressed && styles.homePressed]}
          onPress={() => go(homeTarget)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Voltar para ${formatYearMonth(homeTarget)}`}>
          <Ionicons name="return-down-back" size={14} color={theme.accentPrimary} />
          <Text style={styles.homeText}>Mês atual</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    wrap: {
      marginBottom: theme.spacingLg,
      gap: theme.spacingSm,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingXs,
    },
    arrow: {
      width: 40,
      height: 40,
      borderRadius: theme.radiusMd,
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowPressed: {
      backgroundColor: theme.bgTertiary,
      transform: [{ scale: 0.94 }],
    },
    disabled: { opacity: 0.35 },
    label: {
      flex: 1,
      textAlign: 'center',
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 16,
      color: theme.textPrimary,
    },
    home: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: theme.spacingMd,
      borderRadius: 999,
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    homePressed: { opacity: 0.7 },
    homeText: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 13,
      color: theme.accentPrimary,
    },
  })
);
