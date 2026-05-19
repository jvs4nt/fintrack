import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { FixedIncome, FixedExpense } from '../types';

// Página de Fixos - Ganhos e Gastos Recorrentes
function Fixed() {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [editingItem, setEditingItem] = useState<FixedIncome | FixedExpense | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    dayOfMonth: '',
    category: '',
    paymentMethod: '',
    active: true,
  });

  // Categorias
  const incomeCategories = ['Trabalho', 'Extra', 'Investimento', 'Aluguel', 'Outros'];
  const expenseCategories = [
    'Moradia',
    'Alimentação',
    'Transporte',
    'Saúde',
    'Educação',
    'Entretenimento',
    'Vestuário',
    'Serviços',
    'Assinaturas',
    'Outros',
  ];

  const paymentMethods = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

  // Carregar dados
  useEffect(() => {
    loadFixedData();
  }, []);

  async function loadFixedData() {
    setLoading(true);
    try {
      const [incomes, expenses] = await Promise.all([
        api.fixedIncomes.getAll(),
        api.fixedExpenses.getAll(),
      ]);
      setFixedIncomes(incomes || []);
      setFixedExpenses(expenses || []);
    } catch (err) {
      console.error('Erro ao carregar fixos:', err);
    } finally {
      setLoading(false);
    }
  }

  // Abrir modal para novo item
  const handleNew = (type: 'income' | 'expense') => {
    setModalType(type);
    setEditingItem(null);
    setFormData({
      name: '',
      amount: '',
      dayOfMonth: '',
      category: '',
      paymentMethod: type === 'expense' ? 'PIX' : '',
      active: true,
    });
    setShowModal(true);
  };

  // Abrir modal para editar
  const handleEdit = (type: 'income' | 'expense', item: FixedIncome | FixedExpense) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      dayOfMonth: item.dayOfMonth.toString(),
      category: item.category,
      paymentMethod: (item as FixedExpense).paymentMethod || '',
      active: item.active,
    });
    setShowModal(true);
  };

  // Salvar item
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        dayOfMonth: parseInt(formData.dayOfMonth),
      };

      if (modalType === 'income') {
        if (editingItem) {
          await api.fixedIncomes.update(editingItem.id, data);
        } else {
          await api.fixedIncomes.create(data);
        }
      } else {
        if (editingItem) {
          await api.fixedExpenses.update(editingItem.id, data);
        } else {
          await api.fixedExpenses.create(data);
        }
      }

      setShowModal(false);
      loadFixedData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  // Toggle ativo/inativo
  const toggleActive = async (type: 'income' | 'expense', id: number, currentActive: boolean) => {
    try {
      if (type === 'income') {
        await api.fixedIncomes.update(id, { active: !currentActive });
      } else {
        await api.fixedExpenses.update(id, { active: !currentActive });
      }
      loadFixedData();
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  // Excluir item
  const handleDelete = async (type: 'income' | 'expense', id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este item fixo?')) {
      try {
        if (type === 'income') {
          await api.fixedIncomes.delete(id);
        } else {
          await api.fixedExpenses.delete(id);
        }
        loadFixedData();
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
  const totalIncomes = fixedIncomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Fixos</h1>
        <p className="page-subtitle">
          Gerencie seus ganhos e gastos recorrentes
        </p>
      </header>

      <div
        style={{
          background: 'var(--bg-tertiary)',
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--spacing-xl)',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}
      >
        ⚠️ Alterações aqui afetam apenas novos meses. Meses já gerados não são alterados
        automaticamente.
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {/* Ganhos Fixos */}
          <section>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>
                💰 Ganhos Fixos
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 'var(--spacing-sm)' }}>
                  ({formatCurrency(totalIncomes)})
                </span>
              </h2>
              <button className="btn btn-primary btn-sm" onClick={() => handleNew('income')}>
                + Novo Ganho
              </button>
            </div>

            <div className="entries-list">
              {fixedIncomes.length > 0 ? (
                fixedIncomes.map((income) => (
                  <div
                    key={income.id}
                    className="entry-item card-bordered-left income"
                    style={{ opacity: income.active ? 1 : 0.5 }}
                  >
                    <div className="entry-info">
                      <span className="entry-name">
                        {income.name}
                        {!income.active && (
                          <span
                            style={{
                              marginLeft: 'var(--spacing-sm)',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            (Inativo)
                          </span>
                        )}
                      </span>
                      <span className="entry-meta">
                        Dia {income.dayOfMonth} • {income.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <span className="entry-amount income">+ {formatCurrency(income.amount)}</span>
                      <label style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={income.active}
                          onChange={() => toggleActive('income', income.id, income.active)}
                          style={{ marginRight: 'var(--spacing-xs)' }}
                        />
                        Ativo
                      </label>
                      <div className="entry-actions">
                        <button className="btn-icon" onClick={() => handleEdit('income', income)}>
                          ✏️
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete('income', income.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💰</div>
                  <p>Nenhum ganho fixo cadastrado</p>
                </div>
              )}
            </div>
          </section>

          {/* Gastos Fixos */}
          <section style={{ marginTop: 'var(--spacing-xl)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>
                💸 Gastos Fixos
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginLeft: 'var(--spacing-sm)' }}>
                  ({formatCurrency(totalExpenses)})
                </span>
              </h2>
              <button className="btn btn-primary btn-sm" onClick={() => handleNew('expense')}>
                + Novo Gasto
              </button>
            </div>

            <div className="entries-list">
              {fixedExpenses.length > 0 ? (
                fixedExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="entry-item card-bordered-left expense"
                    style={{ opacity: expense.active ? 1 : 0.5 }}
                  >
                    <div className="entry-info">
                      <span className="entry-name">
                        {expense.name}
                        {!expense.active && (
                          <span
                            style={{
                              marginLeft: 'var(--spacing-sm)',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            (Inativo)
                          </span>
                        )}
                      </span>
                      <span className="entry-meta">
                        Dia {expense.dayOfMonth} • {expense.category}
                        {expense.paymentMethod && ` • ${expense.paymentMethod}`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <span className="entry-amount expense">- {formatCurrency(expense.amount)}</span>
                      <label style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={expense.active}
                          onChange={() => toggleActive('expense', expense.id, expense.active)}
                          style={{ marginRight: 'var(--spacing-xs)' }}
                        />
                        Ativo
                      </label>
                      <div className="entry-actions">
                        <button className="btn-icon" onClick={() => handleEdit('expense', expense)}>
                          ✏️
                        </button>
                        <button className="btn-icon" onClick={() => handleDelete('expense', expense.id)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">💸</div>
                  <p>Nenhum gasto fixo cadastrado</p>
                </div>
              )}
            </div>
          </section>

          {/* Resumo */}
          <section style={{ marginTop: 'var(--spacing-xl)' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--spacing-md)' }}>
                📊 Resumo Mensal
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 'var(--spacing-lg)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total Ganhos
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {formatCurrency(totalIncomes)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Total Gastos
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: 'var(--font-display)',
                      color: 'var(--accent-danger)',
                    }}
                  >
                    {formatCurrency(totalExpenses)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Saldo
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontFamily: 'var(--font-display)',
                      color:
                        totalIncomes - totalExpenses >= 0
                          ? 'var(--accent-primary)'
                          : 'var(--accent-danger)',
                    }}
                  >
                    {formatCurrency(totalIncomes - totalExpenses)}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingItem
                  ? `Editar ${modalType === 'income' ? 'Ganho' : 'Gasto'} Fixo`
                  : `Novo ${modalType === 'income' ? 'Ganho' : 'Gasto'} Fixo`}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder={
                      modalType === 'income' ? 'Ex: Salário, Freelance' : 'Ex: Aluguel, Netflix'
                    }
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
                    <label className="form-label">Dia do Mês</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.dayOfMonth}
                      onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                      required
                      placeholder="1-31"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Selecione</option>
                    {(modalType === 'income' ? incomeCategories : expenseCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {modalType === 'expense' && (
                  <div className="form-group">
                    <label className="form-label">Forma de Pagamento</label>
                    <select
                      className="form-select"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="">Selecione</option>
                      {paymentMethods.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    Ativo
                  </label>
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
                  {editingItem ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Fixed;
