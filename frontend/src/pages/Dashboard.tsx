import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { DashboardSummary } from '../types';
import LoadingLogo from '../components/LoadingLogo';
import AnimatedNumber from '../components/AnimatedNumber';
import MonthNavigator from '../components/MonthNavigator';
import { FEATURE_PAYMENTS } from '../config/features';
import { YearMonth } from '../lib/yearMonth';
import { SixMonthLineChart } from '../components/charts/SixMonthLineChart';
import { TopExpensesBarChart } from '../components/charts/TopExpensesBarChart';

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

  const { summary, nextDueCard, lastEntries, topExpenses, sixMonthsData, monthInstallments } =
    data;
  const monthBalance = FEATURE_PAYMENTS ? summary.netBalance : summary.balance;

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

        <div className="dashboard-charts-row">
          <div className="chart-container">
            <h3 className="chart-title">📈 Ganhos vs Gastos (Últimos 6 meses)</h3>
            <SixMonthLineChart data={sixMonthsData} />
          </div>
          <div className="chart-container">
            <h3 className="chart-title">💸 Maiores gastos do mês</h3>
            <TopExpensesBarChart entries={topExpenses} />
          </div>
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
