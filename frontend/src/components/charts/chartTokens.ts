/** Cores alinhadas a App.css :root (tema escuro FinTrack). */
export const chartColors = {
  income: '#00e5a0',
  expense: '#ff4d6d',
  textSecondary: '#8b8b9e',
  border: '#2a2a3a',
  tooltipBg: '#14141f',
  tooltipBorder: '#2a2a3a',
};

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (value: number) => currencyFormatter.format(value);

export function truncateLabel(text: string, maxLen = 24): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}
