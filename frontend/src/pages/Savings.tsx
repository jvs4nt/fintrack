import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { Saving } from '../types';

// Tipos de investimento com cores
const savingTypes: Record<string, { label: string; color: string }> = {
  poupanca: { label: 'Poupança', color: '#00e5a0' },
  cdb: { label: 'CDB', color: '#00bcd4' },
  tesouro: { label: 'Tesouro Direto', color: '#ff9800' },
  acoes: { label: 'Ações', color: '#9c27b0' },
  fiis: { label: 'FIIs', color: '#e91e63' },
  cripto: { label: 'Criptomoedas', color: '#ffc107' },
  outros: { label: 'Outros', color: '#7a7a9a' },
};

// Página de Reservas e Investimentos
function Savings() {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [selectedSaving, setSelectedSaving] = useState<Saving | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    type: 'poupanca',
    amount: '',
  });
  const [updateAmount, setUpdateAmount] = useState<string>('');

  // Carregar dados
  useEffect(() => {
    loadSavingsData();
  }, []);

  async function loadSavingsData() {
    setLoading(true);
    try {
      const data = await api.savings.getAll();
      setSavings(data || []);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
    } finally {
      setLoading(false);
    }
  }

  // Abrir modal de nova reserva
  const handleNew = () => {
    setFormData({
      name: '',
      institution: '',
      type: 'poupanca',
      amount: '',
    });
    setShowModal(true);
  };

  // Salvar reserva
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.savings.create({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setShowModal(false);
      loadSavingsData();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  // Abrir modal de atualização de valor
  const handleUpdateAmount = (saving: Saving) => {
    setSelectedSaving(saving);
    setUpdateAmount(saving.amount.toString());
    setShowUpdateModal(true);
  };

  // Confirmar atualização de valor
  const handleConfirmUpdate = async () => {
    if (!selectedSaving) return;
    try {
      await api.savings.updateAmount(selectedSaving.id, parseFloat(updateAmount));
      setShowUpdateModal(false);
      loadSavingsData();
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  // Excluir reserva
  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta reserva?')) {
      try {
        await api.savings.delete(id);
        loadSavingsData();
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

  // Formatador de data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Calcular total
  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0);

  // Calcular distribuição por tipo para o gráfico
  const distributionByType = savings.reduce((acc: Record<string, number>, saving) => {
    acc[saving.type] = (acc[saving.type] || 0) + saving.amount;
    return acc;
  }, {});

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Reservas</h1>
        <p className="page-subtitle">Acompanhe seu patrimônio guardado</p>
      </header>

      {/* Total Consolidado */}
      <div
        className="card"
        style={{
          borderLeft: '4px solid var(--accent-primary)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        <div className="stat-label">Patrimônio Total em Reservas</div>
        <div className="stat-value positive" style={{ fontSize: '2.5rem' }}>
          {formatCurrency(totalSavings)}
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          {/* Grid de Reservas */}
          <section>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>🏦 Minhas Reservas</h2>
              <button className="btn btn-primary btn-sm" onClick={handleNew}>
                + Nova Reserva
              </button>
            </div>

            <div className="savings-grid">
              {savings.length > 0 ? (
                savings.map((saving) => {
                  const typeInfo = savingTypes[saving.type] || savingTypes.outros;

                  return (
                    <div key={saving.id} className="saving-card">
                      <div className="saving-header">
                        <div>
                          <div className="saving-name">{saving.name}</div>
                          <div
                            className="saving-type"
                            style={{ color: typeInfo.color }}
                          >
                            {typeInfo.label}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 'var(--spacing-xs)',
                          }}
                        >
                          <button
                            className="btn-icon"
                            onClick={() => handleUpdateAmount(saving)}
                            title="Atualizar valor"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDelete(saving.id)}
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="saving-institution">{saving.institution}</div>

                      <div className="saving-amount">
                        {formatCurrency(saving.amount)}
                      </div>

                      {/* Histórico - Note: saving.history needs to be in types.ts or handled here */}
                      {(saving as any).history && (saving as any).history.length > 0 && (
                        <div className="saving-history">
                          <div className="saving-history-title">
                            📜 Últimas atualizações
                          </div>
                          <div className="saving-history-list">
                            {(saving as any).history.slice(0, 5).map((h: any, index: number) => (
                              <div key={index} className="saving-history-item">
                                <span>{formatDate(h.date)}</span>
                                <span className="amount">
                                  {formatCurrency(h.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">🏦</div>
                  <p>Nenhuma reserva cadastrada</p>
                </div>
              )}
            </div>
          </section>

          {/* Gráfico de Distribuição */}
          {savings.length > 0 && Object.keys(distributionByType).length > 0 && (
            <section style={{ marginTop: 'var(--spacing-xl)' }}>
              <h2 style={{ fontSize: '1.2rem', marginBottom: 'var(--spacing-lg)' }}>
                📊 Distribuição por Tipo
              </h2>

              <div className="chart-container">
                {/* Gráfico de Pizza CSS */}
                <div
                  className="pie-chart"
                  style={{
                    background: `conic-gradient(
                      ${Object.entries(distributionByType)
                        .map(([type, amount], index, arr) => {
                          const start = arr
                            .slice(0, index)
                            .reduce((sum, [, a]) => sum + a, 0);
                          const color =
                            savingTypes[type]?.color || savingTypes.outros.color;
                          return `${color} ${(start / totalSavings) * 100}% ${((start + amount) / totalSavings) * 100}%`;
                        })
                        .join(', ')}
                    )`,
                  }}
                />

                {/* Legenda */}
                <div className="pie-legend">
                  {Object.entries(distributionByType).map(([type, amount]) => {
                    const typeInfo = savingTypes[type] || savingTypes.outros;
                    const percentage = ((amount / totalSavings) * 100).toFixed(1);

                    return (
                      <div key={type} className="pie-legend-item">
                        <div
                          className="pie-legend-color"
                          style={{ background: typeInfo.color }}
                        />
                        <span>
                          {typeInfo.label}: {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Modal de Nova Reserva */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Nova Reserva</h3>
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
                    placeholder="Ex: Reserva de Emergência"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instituição</label>
                  <input
                    className="form-input"
                    type="text"
                    value={formData.institution}
                    onChange={(e) =>
                      setFormData({ ...formData, institution: e.target.value })
                    }
                    placeholder="Ex: Nubank, XP, Banco do Brasil"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    {Object.entries(savingTypes).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Valor Inicial</label>
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Atualização de Valor */}
      {showUpdateModal && selectedSaving && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Atualizar Valor - {selectedSaving.name}
              </h3>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Valor Atual</label>
                <div
                  style={{
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-display)',
                    color: 'var(--accent-primary)',
                    marginBottom: 'var(--spacing-md)',
                  }}
                >
                  {formatCurrency(selectedSaving.amount)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Novo Valor</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={updateAmount}
                  onChange={(e) => setUpdateAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginTop: 'var(--spacing-md)',
                }}
              >
                Esta atualização será registrada no histórico.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowUpdateModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmUpdate}
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Savings;
