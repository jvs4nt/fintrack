import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import type { DashboardSummary } from '@/src/types';

type Props = {
  data: DashboardSummary['sixMonthsData'];
  height?: number;
};

const PAD_L = 8;
const PAD_R = 8;
const PAD_T = 12;
const PAD_B = 28;

export function SixMonthLines({ data, height = 160 }: Props) {
  const theme = useTheme();
  const styles = useStyles();
  const chartW = Dimensions.get('window').width - theme.spacingLg * 2;

  const layout = useMemo(() => {
    if (!data?.length) return null;

    const plotW = chartW - PAD_L - PAD_R;
    const plotH = height - PAD_T - PAD_B;
    const baseY = PAD_T + plotH;
    const maxY = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
    const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;

    const point = (index: number, value: number) => ({
      x: PAD_L + index * stepX,
      y: baseY - (value / maxY) * plotH,
    });

    const incomePoints = data.map((d, i) => point(i, d.income));
    const expensePoints = data.map((d, i) => point(i, d.expense));

    const toPolyline = (pts: { x: number; y: number }[]) =>
      pts.map((p) => `${p.x},${p.y}`).join(' ');

    return {
      baseY,
      plotW,
      incomePolyline: toPolyline(incomePoints),
      expensePolyline: toPolyline(expensePoints),
      incomePoints,
      expensePoints,
    };
  }, [data, chartW, height]);

  if (!data?.length || !layout) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.accentPrimary }]} />
          <Text style={styles.legendText}>Ganhos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: theme.accentDanger }]} />
          <Text style={styles.legendText}>Gastos</Text>
        </View>
      </View>
      <Svg width={chartW} height={height}>
        <Line
          x1={PAD_L}
          y1={layout.baseY}
          x2={PAD_L + layout.plotW}
          y2={layout.baseY}
          stroke={theme.border}
          strokeWidth={1}
        />
        <Polyline
          points={layout.incomePolyline}
          fill="none"
          stroke={theme.accentPrimary}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Polyline
          points={layout.expensePolyline}
          fill="none"
          stroke={theme.accentDanger}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <React.Fragment key={`${d.year}-${d.month}`}>
            <Circle
              cx={layout.incomePoints[i].x}
              cy={layout.incomePoints[i].y}
              r={4}
              fill={theme.accentPrimary}
            />
            <Circle
              cx={layout.expensePoints[i].x}
              cy={layout.expensePoints[i].y}
              r={4}
              fill={theme.accentDanger}
            />
            <SvgText
              x={layout.incomePoints[i].x}
              y={height - 6}
              fill={theme.textMuted}
              fontSize={10}
              textAnchor="middle"
              fontFamily={FontFamily.ui}>
              {d.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    wrap: {
      marginVertical: theme.spacingMd,
    },
    legend: {
      flexDirection: 'row',
      gap: theme.spacingLg,
      marginBottom: theme.spacingSm,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacingSm,
    },
    legendSwatch: {
      width: 24,
      height: 3,
      borderRadius: 2,
    },
    legendText: {
      fontFamily: FontFamily.ui,
      fontSize: 12,
      color: theme.textSecondary,
    },
  })
);
