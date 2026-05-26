import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { DashboardSummary } from '../types';
import LoadingLogo from '../components/LoadingLogo';

interface DashboardProps {
  selectedYear: number;
  selectedMonth: number;
}

function Dashboard({ selectedYear, selectedMonth }: DashboardProps) {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [selectedYear, selectedMonth]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.dashboard.getSummary(selectedYear, selectedMonth);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div>
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do mês</p>
        </header>
        <LoadingLogo />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <header className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão geral do mês</p>
        </header>
        <div className="error-message">Erro: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, nextDueCard, lastEntries, sixMonthsData, monthInstallments } = data;

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">
          {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </header>

      <div
        className="card card-bordered-left"
        style={{
          borderLeftColor:
            summary.netBalance >= 0 ? 'var(--accent-primary)' : 'var(--accent-danger)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div className="stat-label">Saldo Líquido do Mês (c/ Parcelas)</div>
        <div
          className={`stat-value dashboard-net-value ${
            summary.netBalance >= 0 ? 'positive' : 'negative'
          }`}
        >
          {formatCurrency(summary.netBalance)}
        </div>
        <div className="stat-subvalue dashboard-summary-line">
          Ganhos: {formatCurrency(summary.totalIncome)} | Gastos:{' '}
          {formatCurrency(summary.totalExpense)} | Parcelas:{' '}
          {formatCurrency(summary.totalInstallments)}
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-label">💰 Total Ganhos</div>
          <div className="stat-value positive">
            {formatCurrency(summary.totalIncome)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">💸 Total Gastos</div>
          <div className="stat-value negative">{formatCurrency(summary.totalExpense)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">📊 Saldo</div>
          <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(summary.balance)}
          </div>
        </div>

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
      </div>

      {monthInstallments.length > 0 && (
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
        <div className="bar-chart">
          {sixMonthsData.map((month, index) => {
            const maxValue = Math.max(
              ...sixMonthsData.map((m) => Math.max(m.income, m.expense)),
              1
            );
            const incomeHeight = (month.income / maxValue) * 160;
            const expenseHeight = (month.expense / maxValue) * 160;

            return (
              <div key={index} className="bar-group">
                <div className="bars">
                  <div
                    className="bar income"
                    style={{ height: `${incomeHeight}px` }}
                    title={`Ganhos: ${formatCurrency(month.income)}`}
                  />
                  <div
                    className="bar expense"
                    style={{ height: `${expenseHeight}px` }}
                    title={`Gastos: ${formatCurrency(month.expense)}`}
                  />
                </div>
                <span className="bar-label">{month.label}</span>
              </div>
            );
          })}
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
  );
}

export default Dashboard;
