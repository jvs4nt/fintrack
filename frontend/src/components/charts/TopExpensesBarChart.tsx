import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthEntry } from '../../types';
import { ChartTooltip } from './ChartTooltip';
import { chartColors, truncateLabel } from './chartTokens';

type BarRow = {
  id: number;
  shortLabel: string;
  description: string;
  category: string;
  amount: number;
};

type Props = {
  entries: MonthEntry[];
};

export function TopExpensesBarChart({ entries }: Props) {
  const rows = useMemo<BarRow[]>(
    () =>
      entries.map((e) => ({
        id: e.id,
        shortLabel: truncateLabel(e.description),
        description: e.description,
        category: e.category,
        amount: e.amount,
      })),
    [entries]
  );

  if (!rows.length) {
    return <p className="chart-empty-state">Nenhum gasto neste mês</p>;
  }

  const chartHeight = Math.max(160, rows.length * 36 + 24);

  return (
    <div
      className="recharts-bar-chart-wrap"
      role="img"
      aria-label="Gráfico de barras: maiores gastos do mês"
    >
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          layout="vertical"
          data={rows}
          margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
        >
          <XAxis type="number" hide domain={[0, 'dataMax']} />
          <YAxis
            type="category"
            dataKey="shortLabel"
            width={108}
            tick={{ fill: chartColors.textSecondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as BarRow | undefined;
              if (!active || !row) return null;
              return (
                <ChartTooltip
                  active={active}
                  payload={payload}
                  label={row.description}
                  secondaryLabel={row.category}
                  valueLabel="Valor"
                />
              );
            }}
          />
          <Bar
            dataKey="amount"
            name="Valor"
            fill={chartColors.expense}
            radius={[0, 4, 4, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
