import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { DashboardSummary } from '../types';
import LoadingLogo from '../components/LoadingLogo';
import AnimatedNumber from '../components/AnimatedNumber';
import MonthNavigator from '../components/MonthNavigator';
import { FEATURE_PAYMENTS } from '../config/features';
import { YearMonth } from '../lib/yearMonth';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatCurrency = (value: number) => currencyFormatter.format(value);

interface DashboardProps {
  selectedYear: number;
  selectedMonth: number;
  setSelectedYear: (year: number) => void;
  setSelectedMonth: (month: number) => void;
  planningMonth?: YearMonth | null;
}

function Dashboard({
  selectedYear,
  selectedMonth,
  setSelectedYear,
  setSelectedMonth,
  planningMonth,
}: DashboardProps) {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api.dashboard
      .getSummary(selectedYear, selectedMonth)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedYear, selectedMonth]);

  const header = (
    <header className="page-header">
      <h1 className="page-title">Dashboard</h1>
      <MonthNavigator
        value={{ year: selectedYear, month: selectedMonth }}
        onChange={({ year, month }) => {
          setSelectedYear(year);
          setSelectedMonth(month);
        }}
        home={planningMonth}
      />
    </header>
  );

  if (error) {
    return (
      <div>
        {header}
        <div className="error-message">Erro: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        {header}
        <LoadingLogo />
      </div>
    );
  }

  const { summary, nextDueCard, lastEntries, sixMonthsData, monthInstallments } = data;
  const monthBalance = FEATURE_PAYMENTS ? summary.netBalance : summary.balance;

  const chartW = 400;
  const chartH = 200;
  const chartPadL = 8;
  const chartPadR = 8;
  const chartPadT = 12;
  const chartPadB = 32;
  const plotW = chartW - chartPadL - chartPadR;
  const plotH = chartH - chartPadT - chartPadB;
  const chartBaseY = chartPadT + plotH;
  const chartMaxY = Math.max(1, ...sixMonthsData.flatMap((m) => [m.income, m.expense]));
  const chartStepX = sixMonthsData.length > 1 ? plotW / (sixMonthsData.length - 1) : 0;

  function chartPoint(index: number, value: number) {
    const x = chartPadL + index * chartStepX;
    const y = chartBaseY - (value / chartMaxY) * plotH;
    return { x, y };
  }

  const incomePolyline = sixMonthsData
    .map((m, i) => {
      const { x, y } = chartPoint(i, m.income);
      return `${x},${y}`;
    })
    .join(' ');

  const expensePolyline = sixMonthsData
    .map((m, i) => {
      const { x, y } = chartPoint(i, m.expense);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div>
      {header}

      <div className={`dashboard-body ${loading ? 'is-refreshing' : ''}`} aria-busy={loading}>
        <div
          className="card card-bordered-left"
          style={{
            borderLeftColor:
              monthBalance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)',
            marginBottom: 'var(--spacing-xl)',
          }}
        >
          <div className="stat-label">
            {FEATURE_PAYMENTS ? 'Saldo Líquido do Mês (c/ Parcelas)' : 'Saldo do Mês'}
          </div>
          <div
            className={`stat-value dashboard-net-value ${
              monthBalance >= 0 ? 'positive' : 'negative'
            }`}
          >
            <AnimatedNumber value={monthBalance} format={formatCurrency} duration={1200} />
          </div>
          <div className="stat-subvalue dashboard-summary-line">
            Ganhos: {formatCurrency(summary.totalIncome)} | Gastos:{' '}
            {formatCurrency(summary.totalExpense)}
            {FEATURE_PAYMENTS && <> | Parcelas: {formatCurrency(summary.totalInstallments)}</>}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">💰 Total Ganhos</div>
            <div className="stat-value positive">
              <AnimatedNumber value={summary.totalIncome} format={formatCurrency} delay={100} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">💸 Total Gastos</div>
            <div className="stat-value negative">
              <AnimatedNumber value={summary.totalExpense} format={formatCurrency} delay={200} />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">📊 Saldo</div>
            <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
              <AnimatedNumber value={summary.balance} format={formatCurrency} delay={300} />
            </div>
          </div>

          {FEATURE_PAYMENTS && (
            <div className="stat-card">
              <div className="stat-label">💳 Próximo Vencimento</div>
              {nextDueCard ? (
                <>
                  <div className="stat-value neutral" style={{ fontSize: '1.2rem' }}>
                    {nextDueCard.name}
                  </div>
                  <div className="stat-subvalue">
                    {nextDueCard.daysUntilDue <= 5 ? (
                      <span style={{ color: 'var(--accent-danger)' }}>
                        ⚠️ {nextDueCard.daysUntilDue} dias
                      </span>
                    ) : (
                      `${nextDueCard.daysUntilDue} dias`
                    )}
                  </div>
                </>
              ) : (
                <div className="stat-subvalue">Sem cartões</div>
              )}
            </div>
          )}
        </div>

        {FEATURE_PAYMENTS && monthInstallments.length > 0 && (
          <div className="table-container installments-summary-table">
            <h3
              className="chart-title"
              style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}
            >
              💳 Parcelas do mês
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Cartão</th>
                  <th>Parcela</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {monthInstallments.map((inst) => (
                  <tr key={inst.id}>
                    <td>{inst.description}</td>
                    <td>{inst.card?.name ?? '—'}</td>
                    <td>
                      {inst.currentMonthInstallment} / {inst.totalInstallments}
                    </td>
                    <td className="text-right" style={{ color: 'var(--accent-warning)' }}>
                      {formatCurrency(inst.installmentAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="chart-container">
          <h3 className="chart-title">📈 Ganhos vs Gastos (Últimos 6 meses)</h3>
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
          <svg
            className="line-chart"
            viewBox={`0 0 ${chartW} ${chartH}`}
            role="img"
            aria-label="Gráfico de linhas: ganhos e gastos nos últimos 6 meses">
            <line
              x1={chartPadL}
              y1={chartBaseY}
              x2={chartPadL + plotW}
              y2={chartBaseY}
              className="line-chart-axis"
            />
            <polyline points={incomePolyline} className="line-chart-line income" fill="none" />
            <polyline points={expensePolyline} className="line-chart-line expense" fill="none" />
            {sixMonthsData.map((month, index) => {
              const incomePt = chartPoint(index, month.income);
              const expensePt = chartPoint(index, month.expense);
              return (
                <g key={`${month.year}-${month.month}`}>
                  <circle
                    cx={incomePt.x}
                    cy={incomePt.y}
                    r={4}
                    className="line-chart-point income">
                    <title>{`${month.label} — Ganhos: ${formatCurrency(month.income)}`}</title>
                  </circle>
                  <circle
                    cx={expensePt.x}
                    cy={expensePt.y}
                    r={4}
                    className="line-chart-point expense">
                    <title>{`${month.label} — Gastos: ${formatCurrency(month.expense)}`}</title>
                  </circle>
                  <text x={incomePt.x} y={chartH - 6} className="line-chart-label">
                    {month.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="table-container">
          <h3 className="chart-title" style={{ padding: 'var(--spacing-md) var(--spacing-lg)' }}>
            📋 Últimos Lançamentos
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {lastEntries.length > 0 ? (
                lastEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      {entry.description}
                      {entry.isFixed && (
                        <span
                          style={{
                            marginLeft: 'var(--spacing-sm)',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          (Fixo)
                        </span>
                      )}
                    </td>
                    <td>{entry.category}</td>
                    <td>{new Date(entry.date).toLocaleDateString('pt-BR')}</td>
                    <td
                      className="text-right"
                      style={{
                        color:
                          entry.type === 'income'
                            ? 'var(--accent-primary)'
                            : 'var(--accent-danger)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                      }}
                    >
                      {entry.type === 'income' ? '+' : '-'} {formatCurrency(entry.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="empty-state">
                    Nenhum lançamento neste mês
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
