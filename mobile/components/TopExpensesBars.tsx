import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import type { MonthEntry } from '@/src/types';

type Props = {
  entries: MonthEntry[];
};

function truncate(text: string, maxLen = 28): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function TopExpensesBars({ entries }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const maxAmount = useMemo(
    () => Math.max(1, ...entries.map((e) => e.amount)),
    [entries]
  );

  if (!entries.length) {
    return <Text style={styles.empty}>Nenhum gasto neste mês</Text>;
  }

  return (
    <View style={styles.wrap}>
      {entries.map((entry) => {
        const widthPct = (entry.amount / maxAmount) * 100;
        const isSelected = selectedId === entry.id;
        return (
          <Pressable
            key={entry.id}
            onPress={() => setSelectedId(isSelected ? null : entry.id)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`${entry.description}, ${formatBrl(entry.amount)}`}
          >
            <Text style={styles.label} numberOfLines={1}>
              {truncate(entry.description)}
            </Text>
            <View style={styles.track}>
              <View
                style={[
                  styles.bar,
                  { width: `${widthPct}%`, backgroundColor: theme.accentDanger },
                ]}
              />
            </View>
            {isSelected ? (
              <Text style={styles.detail}>
                {entry.category} · {formatBrl(entry.amount)}
              </Text>
            ) : (
              <Text style={styles.amountHint}>{formatBrl(entry.amount)}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    wrap: {
      marginVertical: theme.spacingMd,
      gap: theme.spacingMd,
    },
    empty: {
      fontFamily: FontFamily.ui,
      fontSize: 14,
      color: theme.textSecondary,
      marginVertical: theme.spacingMd,
    },
    row: {
      gap: theme.spacingXs,
    },
    label: {
      fontFamily: FontFamily.ui,
      fontSize: 13,
      color: theme.textPrimary,
    },
    track: {
      height: 10,
      borderRadius: 4,
      backgroundColor: theme.bgTertiary,
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      borderRadius: 4,
      minWidth: 4,
    },
    amountHint: {
      fontFamily: FontFamily.display,
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'right',
    },
    detail: {
      fontFamily: FontFamily.ui,
      fontSize: 12,
      color: theme.textSecondary,
    },
  })
);
