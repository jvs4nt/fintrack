import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmDialog';
import { BudgetItem, Category, InstallmentMonthView, MonthEntry } from '../types';
import LoadingLogo from '../components/LoadingLogo';

// Meses do ano
const months = [
  { id: 1, name: 'Janeiro' },
  { id: 2, name: 'Fevereiro' },
  { id: 3, name: 'Março' },
  { id: 4, name: 'Abril' },
  { id: 5, name: 'Maio' },
  { id: 6, name: 'Junho' },
  { id: 7, name: 'Julho' },
  { id: 8, name: 'Agosto' },
  { id: 9, name: 'Setembro' },
  { id: 10, name: 'Outubro' },
  { id: 11, name: 'Novembro' },
  { id: 12, name: 'Dezembro' },
];

// Anos disponíveis
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

interface MonthsProps {
  selectedYear: number;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
}

function Months({ selectedYear, selectedMonth, setSelectedMonth, setSelectedYear }: MonthsProps) {
  const api = useApi();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [installments, setInstallments] = useState<InstallmentMonthView[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, string>>({});
  const [savingBudgets, setSavingBudgets] = useState(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<MonthEntry | null>(null);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    date: '',
    category: '',
    paymentMethod: '',
    note: '',
  });

  // Carregar dados do mês
  useEffect(() => {
    loadMonthData();
  }, [selectedYear, selectedMonth]);

  async function loadMonthData() {
    setLoading(true);
    try {
      const [entriesData, installmentsData, incomeCats, expenseCats, budgetData] =
        await Promise.all([
          api.months.getEntries(selectedYear, selectedMonth),
          api.installments.getByMonth(selectedYear, selectedMonth),
          api.categories.getAll('income'),
          api.categories.getAll('expense'),
          api.budgets.getByMonth(selectedYear, selectedMonth),
        ]);

      setEntries(entriesData || []);
      setInstallments(installmentsData || []);
      setIncomeCategories(incomeCats || []);
      setExpenseCategories(expenseCats || []);
      setBudgetItems(budgetData.budgets || []);

      const limits: Record<string, string> = {};
      for (const b of budgetData.budgets || []) {
        limits[b.category] = String(b.limit);
      }
      setBudgetLimits(limits);
    } catch (err) {
      console.error('Erro ao carregar mês:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncUpsert() {
    try {
      const result = await api.months.syncFixed(selectedYear, selectedMonth, 'upsert');
      toast.success(
        `Sync concluído: ${result.created} criado(s), ${result.updated} atualizado(s).`
      );
      loadMonthData();
    } catch (err: any) {
      toast.error('Erro ao sincronizar: ' + err.message);
    }
  }

  async function handleSaveBudgets() {
    setSavingBudgets(true);
    try {
      const budgets = expenseCategories
        .map((cat) => ({
          category: cat.name,
          limitAmount: parseFloat(budgetLimits[cat.name] || '0'),
        }))
        .filter((b) => b.limitAmount > 0);

      await api.budgets.save(selectedYear, selectedMonth, budgets);
      toast.success('Metas do mês salvas.');
      const budgetData = await api.budgets.getByMonth(selectedYear, selectedMonth);
      setBudgetItems(budgetData.budgets || []);
    } catch (err: any) {
      toast.error('Erro ao salvar metas: ' + err.message);
    } finally {
      setSavingBudgets(false);
    }
  }

  // Abrir modal para novo lançamento
  const handleNewEntry = () => {
    setEditingEntry(null);
    setFormData({
      type: 'expense',
      description: '',
      amount: '',
      date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
      category: '',
      paymentMethod: '',
      note: '',
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (entry: MonthEntry) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      description: entry.description,
      amount: entry.amount.toString(),
      date: entry.date,
      category: entry.category,
      paymentMethod: entry.paymentMethod || '',
      note: entry.note || '',
    });
    setShowModal(true);
  };

  // Salvar lançamento
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEntry) {
        await api.months.updateEntry(editingEntry.id, {
          ...formData,
          amount: parseFloat(formData.amount),
        });
      } else {
        await api.months.createEntry({
          ...formData,
          amount: parseFloat(formData.amount),
          year: selectedYear,
          month: selectedMonth,
        });
      }
      setShowModal(false);
      loadMonthData();
      toast.success(editingEntry ? 'Lançamento atualizado.' : 'Lançamento criado.');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Excluir lançamento',
      message: 'Tem certeza que deseja excluir este lançamento?',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.months.deleteEntry(id);
      loadMonthData();
      toast.success('Lançamento excluído.');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calcular totais
  const incomes = entries.filter((e) => e.type === 'income');
  const expenses = entries.filter((e) => e.type === 'expense');
  const totalIncome = incomes.reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalInstallments = installments.reduce((sum, i) => sum + i.installmentAmount, 0);

  const formCategories =
    formData.type === 'income' ? incomeCategories : expenseCategories;

  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] ?? 0) + e.amount;
  }

  return (
    <div>
      <header className="page-header">
        <div className="flex-between">
          <div>
            <h1 className="page-title">Meses</h1>
            <p className="page-subtitle">Gerencie seus lançamentos mensais</p>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleSyncUpsert}>
            Sincronizar fixos
          </button>
        </div>
      </header>

      {/* Seletor de Ano e Mês */}
      <div className="tabs-container">
        <div className="year-selector">
          <label>
            Ano:
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="month-selector">
          <label>
            Mês:
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {months.map((month) => (
                <option key={month.id} value={month.id}>
                  {month.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tabs-list">
          {months.map((month) => (
            <button
              key={month.id}
              className={`tab-button ${selectedMonth === month.id ? 'active' : ''}`}
              onClick={() => setSelectedMonth(month.id)}
            >
              {month.name.substring(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingLogo />
      ) : (
        <>
          {/* Ganhos */}
          <section>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>💰 Ganhos</h2>
              <button className="btn btn-primary btn-sm" onClick={handleNewEntry}>
                + Novo
              </button>
            </div>

            <div className="entries-list">
              {incomes.length > 0 ? (
                incomes.map((entry) => (
                  <div key={entry.id} className="entry-item card-bordered-left income">
                    <div className="entry-info">
                      <span className="entry-name">{entry.description}</span>
                      <span className="entry-meta">
                        {entry.category} • {new Date(entry.date).toLocaleDateString('pt-BR')}
                        {entry.isFixed && ' • (Fixo)'}
                      </span>
                    </div>
                    <div className="entry-amount-row">
                      <span className="entry-amount income">
                        + {formatCurrency(entry.amount)}
                      </span>
                      <div className="entry-actions">
                        <button className="btn-icon" onClick={() => handleEdit(entry)}>
                          ✏️
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(entry.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <p>Nenhum ganho neste mês</p>
                </div>
              )}
            </div>
          </section>

          {/* Gastos */}
          <section style={{ marginTop: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>💸 Gastos</h2>

            <div className="entries-list">
              {expenses.length > 0 ? (
                expenses.map((entry) => (
                  <div key={entry.id} className="entry-item card-bordered-left expense">
                    <div className="entry-info">
                      <span className="entry-name">{entry.description}</span>
                      <span className="entry-meta">
                        {entry.category} • {new Date(entry.date).toLocaleDateString('pt-BR')}
                        {entry.paymentMethod && ` • ${entry.paymentMethod}`}
                        {entry.isFixed && ' • (Fixo)'}
                      </span>
                    </div>
                    <div className="entry-amount-row">
                      <span className="entry-amount expense">
                        - {formatCurrency(entry.amount)}
                      </span>
                      <div className="entry-actions">
                        <button className="btn-icon" onClick={() => handleEdit(entry)}>
                          ✏️
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete(entry.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <p>Nenhum gasto neste mês</p>
                </div>
              )}
            </div>
          </section>

          {/* Parcelas do Mês */}
          {installments.length > 0 && (
            <section style={{ marginTop: 'var(--spacing-xl)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>
                📦 Parcelas do Mês
              </h2>

              <div className="entries-list">
                {installments.map((inst, index) => (
                  <div key={`${inst.id}-${index}`} className="entry-item card-bordered-left warning">
                    <div className="entry-info">
                      <span className="entry-name">{inst.description}</span>
                      <span className="entry-meta">
                        {inst.card?.name} • Parcela {inst.currentMonthInstallment} de{' '}
                        {inst.totalInstallments}
                      </span>
                    </div>
                    <span className="entry-amount" style={{ color: 'var(--accent-warning)' }}>
                      - {formatCurrency(inst.installmentAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Metas do mês */}
          <section className="budget-section card" style={{ padding: 'var(--spacing-lg)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>🎯 Metas do mês</h2>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveBudgets}
                disabled={savingBudgets}
              >
                {savingBudgets ? 'Salvando...' : 'Salvar metas'}
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
              Defina limites por categoria de despesa. Alertas em 80% e 100%.
            </p>
            {expenseCategories.map((cat) => {
              const spent = spentByCategory[cat.name] ?? 0;
              const limit = parseFloat(budgetLimits[cat.name] || '0');
              const percent = limit > 0 ? (spent / limit) * 100 : 0;
              const status =
                limit <= 0 ? 'ok' : percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok';
              const existing = budgetItems.find((b) => b.category === cat.name);

              return (
                <div key={cat.id} className="budget-item">
                  <div className="budget-item-header">
                    <span>{cat.name}</span>
                    <span>
                      {formatCurrency(spent)}
                      {limit > 0 ? ` / ${formatCurrency(limit)} (${Math.round(percent)}%)` : ''}
                    </span>
                  </div>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Limite (R$)"
                    value={budgetLimits[cat.name] ?? ''}
                    onChange={(e) =>
                      setBudgetLimits({ ...budgetLimits, [cat.name]: e.target.value })
                    }
                    style={{ marginBottom: 'var(--spacing-xs)' }}
                  />
                  {limit > 0 && (
                    <div className="budget-progress">
                      <div
                        className={`budget-progress-fill ${existing?.status ?? status}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Resumo do Mês */}
          <section style={{ marginTop: 'var(--spacing-xl)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-md)' }}>📊 Resumo</h2>

            <div className="table-container">
              <table className="table">
                <tbody>
                  <tr>
                    <td>Total Ganhos</td>
                    <td className="text-right" style={{ color: 'var(--accent-primary)' }}>
                      {formatCurrency(totalIncome)}
                    </td>
                  </tr>
                  <tr>
                    <td>Total Gastos</td>
                    <td className="text-right" style={{ color: 'var(--accent-danger)' }}>
                      {formatCurrency(totalExpense)}
                    </td>
                  </tr>
                  {installments.length > 0 && (
                    <tr>
                      <td>Parcelas de Cartão</td>
                      <td className="text-right" style={{ color: 'var(--accent-warning)' }}>
                        {formatCurrency(totalInstallments)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="table-summary">Saldo</td>
                    <td
                      className={`text-right table-summary ${
                        balance >= 0 ? 'balance-positive' : 'balance-negative'
                      }`}
                    >
                      {formatCurrency(balance)}
                    </td>
                  </tr>
                  {installments.length > 0 && (
                    <tr>
                      <td className="table-summary">Saldo c/ Parcelas</td>
                      <td
                        className={`text-right table-summary ${
                          balance - totalInstallments >= 0 ? 'balance-positive' : 'balance-negative'
                        }`}
                      >
                        {formatCurrency(balance - totalInstallments)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Modal de Lançamento */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingEntry ? 'Editar Lançamento' : 'Novo Lançamento'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  >
                    <option value="income">Ganho</option>
                    <option value="expense">Gasto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                    placeholder="Ex: Salário, Aluguel..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input
                      className="form-input"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {formCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.type === 'expense' && (
                    <div className="form-group">
                      <label className="form-label">Forma de Pagamento</label>
                      <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={(e) =>
                          setFormData({ ...formData, paymentMethod: e.target.value })
                        }
                      >
                        <option value="">Selecione</option>
                        <option value="PIX">PIX</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Boleto">Boleto</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea
                    className="form-input"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Opcional"
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEntry ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Months;
