import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { MonthEntry, Installment } from '../types';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [installments, setInstallments] = useState<any[]>([]); // Parcelas do mês têm formato específico do backend
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
      // Sincronizar fixos
      await api.months.syncFixed(selectedYear, selectedMonth);

      // Carregar lançamentos
      const entriesData = await api.months.getEntries(selectedYear, selectedMonth);
      setEntries(entriesData || []);

      // Carregar parcelas do mês
      const installmentsData = await api.installments.getByMonth(selectedYear, selectedMonth);
      setInstallments(installmentsData || []);
    } catch (err) {
      console.error('Erro ao carregar mês:', err);
    } finally {
      setLoading(false);
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
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  // Excluir lançamento
  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await api.months.deleteEntry(id);
        loadMonthData();
      } catch (err: any) {
        alert('Erro ao excluir: ' + err.message);
      }
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

  // Categorias para seleção
  const categories = [
    'Trabalho',
    'Extra',
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Vestuário',
    'Serviços',
    'Investimento',
    'Outros',
  ];

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Meses</h1>
        <p className="page-subtitle">Gerencie seus lançamentos mensais</p>
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
        <div className="loading">Carregando...</div>
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
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
                        {inst.card.name} • Parcela {inst.currentMonthInstallment} de{' '}
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
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
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
