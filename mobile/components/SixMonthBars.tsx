import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Theme } from '@/constants/Colors';
import type { DashboardSummary } from '@/src/types';

type Props = {
  data: DashboardSummary['sixMonthsData'];
  height?: number;
};

/** Gráfico leve de 6 meses (receita vs despesa) — cores alinhadas ao web */
export function SixMonthBars({ data, height = 140 }: Props) {
  if (!data?.length) return null;

  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => [d.income, d.expense])
  );
  const barW = 14;
  const gap = 10;
  const chartW = data.length * (barW * 2 + gap) + gap;
  const innerH = height - 28;

  return (
    <View style={styles.wrap}>
      <Svg width={chartW} height={height}>
        {data.map((d, i) => {
          const x0 = gap + i * (barW * 2 + gap);
          const hIncome = (d.income / maxVal) * innerH;
          const hExpense = (d.expense / maxVal) * innerH;
          const yBase = innerH + 8;
          return (
            <React.Fragment key={`${d.year}-${d.month}`}>
              <Rect
                x={x0}
                y={yBase - hIncome}
                width={barW}
                height={hIncome}
                rx={3}
                fill={Theme.accentPrimary}
              />
              <Rect
                x={x0 + barW + 2}
                y={yBase - hExpense}
                width={barW}
                height={hExpense}
                rx={3}
                fill={Theme.accentDanger}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: Theme.spacingMd,
  },
});
