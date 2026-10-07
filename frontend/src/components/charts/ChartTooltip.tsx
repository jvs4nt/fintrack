import type { TooltipProps } from 'recharts';
import { chartColors, formatCurrency } from './chartTokens';

type ValueType = number | string;

type FintrackTooltipProps = TooltipProps<ValueType, string> & {
  valueLabel?: string;
  secondaryLabel?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueLabel,
  secondaryLabel,
}: FintrackTooltipProps) {
  if (!active || !payload?.length) return null;

  const primary = payload[0];
  const value = primary?.value;
  const numericValue = typeof value === 'number' ? value : Number(value);

  return (
    <div
      className="recharts-fintrack-tooltip"
      style={{
        background: chartColors.tooltipBg,
        border: `1px solid ${chartColors.tooltipBorder}`,
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
        color: '#e8e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
      }}
    >
      {label != null && label !== '' && (
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(label)}</div>
      )}
      {secondaryLabel && (
        <div style={{ color: chartColors.textSecondary, marginBottom: 4 }}>{secondaryLabel}</div>
      )}
      {valueLabel && !Number.isNaN(numericValue) && (
        <div>
          <span style={{ color: chartColors.textSecondary }}>{valueLabel}: </span>
          {formatCurrency(numericValue)}
        </div>
      )}
      {!valueLabel &&
        payload.map((entry) => {
          const v = typeof entry.value === 'number' ? entry.value : Number(entry.value);
          if (Number.isNaN(v)) return null;
          return (
            <div key={String(entry.dataKey)} style={{ marginTop: 2 }}>
              <span style={{ color: entry.color ?? chartColors.textSecondary }}>
                {entry.name}:{' '}
              </span>
              {formatCurrency(v)}
            </div>
          );
        })}
    </div>
  );
}
