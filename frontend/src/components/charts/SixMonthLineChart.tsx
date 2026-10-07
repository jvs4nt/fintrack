import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardSummary } from '../../types';
import { ChartTooltip } from './ChartTooltip';
import { chartColors } from './chartTokens';

type Props = {
  data: DashboardSummary['sixMonthsData'];
};

export function SixMonthLineChart({ data }: Props) {
  if (!data.length) return null;

  const maxY = Math.max(1, ...data.flatMap((m) => [m.income, m.expense]));

  return (
    <>
      <div className="line-chart-legend">
        <span className="legend-item">
          <span className="legend-swatch income" aria-hidden />
          Ganhos
        </span>
        <span className="legend-item">
          <span className="legend-swatch expense" aria-hidden />
          Gastos
        </span>
      </div>
      <div
        className="recharts-line-chart-wrap"
        role="img"
        aria-label="Gráfico de linhas: ganhos e gastos nos últimos 6 meses"
      >
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: chartColors.textSecondary, fontSize: 10 }}
              axisLine={{ stroke: chartColors.border }}
              tickLine={false}
              dy={8}
            />
            <YAxis hide domain={[0, maxY]} />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="income"
              name="Ganhos"
              stroke={chartColors.income}
              strokeWidth={2.5}
              dot={{ r: 4, fill: chartColors.income, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="expense"
              name="Gastos"
              stroke={chartColors.expense}
              strokeWidth={2.5}
              dot={{ r: 4, fill: chartColors.expense, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
