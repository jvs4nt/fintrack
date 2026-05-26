import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useToast } from '../components/ToastProvider';
import { useConfirm } from '../components/ConfirmDialog';
import { Card, Installment } from '../types';
import LoadingLogo from '../components/LoadingLogo';

function Cards() {
  const api = useApi();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [loading, setLoading] = useState<boolean>(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [cardFormData, setCardFormData] = useState({
    name: '',
    lastFourDigits: '',
    color: '#6c19c9',
    closingDay: '',
    dueDay: '',
    limit: '',
  });
  const [installmentFormData, setInstallmentFormData] = useState({
    description: '',
    totalAmount: '',
    totalInstallments: '',
    firstPaymentDate: '',
    cardId: '',
  });

  // Cores predefinidas para cartões
  const cardColors = [
    '#6c19c9', // Roxo Nubank
    '#1a1a2e', // Preto
    '#1e3a5f', // Azul escuro
    '#0d4f3c', // Verde escuro
    '#5c1a1a', // Vermelho escuro
    '#1a4d5c', // Azul petróleo
  ];

  // Carregar dados
  useEffect(() => {
    loadCardsData();
  }, []);

  async function loadCardsData() {
    setLoading(true);
    try {
      const [cardsData, installmentsData] = await Promise.all([
        api.cards.getAll(),
        api.installments.getAll(),
      ]);
      setCards(cardsData || []);
      setInstallments(installmentsData || []);
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    } finally {
      setLoading(false);
    }
  }

  // Abrir modal de cartão
  const handleNewCard = () => {
    setEditingCard(null);
    setCardFormData({
      name: '',
      lastFourDigits: '',
      color: '#6c19c9',
      closingDay: '',
      dueDay: '',
      limit: '',
    });
    setShowCardModal(true);
  };

  // Editar cartão
  const handleEditCard = (card: Card) => {
    setEditingCard(card);
    setCardFormData({
      name: card.name,
      lastFourDigits: card.lastFourDigits || '',
      color: card.color,
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
      limit: card.limit.toString(),
    });
    setShowCardModal(true);
  };

  // Salvar cartão
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...cardFormData,
        closingDay: parseInt(cardFormData.closingDay),
        dueDay: parseInt(cardFormData.dueDay),
        limit: parseFloat(cardFormData.limit),
      };

      if (editingCard) {
        await api.cards.update(editingCard.id, data);
      } else {
        await api.cards.create(data);
      }

      setShowCardModal(false);
      loadCardsData();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  // Excluir cartão
  const handleDeleteCard = async (id: number) => {
    const ok = await confirm({
      title: 'Excluir cartão',
      message: 'Tem certeza que deseja excluir este cartão?',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.cards.delete(id);
      loadCardsData();
      toast.success('Cartão excluído.');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  // Abrir modal de parcelamento
  const handleNewInstallment = () => {
    setEditingInstallment(null);
    setInstallmentFormData({
      description: '',
      totalAmount: '',
      totalInstallments: '',
      firstPaymentDate: '',
      cardId: cards[0]?.id?.toString() || '',
    });
    setShowInstallmentModal(true);
  };

  // Editar parcelamento
  const handleEditInstallment = (inst: Installment) => {
    setEditingInstallment(inst);
    setInstallmentFormData({
      description: inst.description,
      totalAmount: inst.totalAmount.toString(),
      totalInstallments: inst.totalInstallments.toString(),
      firstPaymentDate: inst.firstPaymentDate,
      cardId: inst.cardId.toString(),
    });
    setShowInstallmentModal(true);
  };

  // Salvar parcelamento
  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...installmentFormData,
        totalAmount: parseFloat(installmentFormData.totalAmount),
        totalInstallments: parseInt(installmentFormData.totalInstallments),
        cardId: parseInt(installmentFormData.cardId),
      };

      if (editingInstallment) {
        await api.installments.update(editingInstallment.id, data);
      } else {
        await api.installments.create(data);
      }

      setShowInstallmentModal(false);
      loadCardsData();
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    }
  };

  // Excluir parcelamento
  const handleDeleteInstallment = async (id: number) => {
    const ok = await confirm({
      title: 'Excluir parcelamento',
      message: 'Tem certeza que deseja excluir este parcelamento?',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.installments.delete(id);
      loadCardsData();
      toast.success('Parcelamento excluído.');
    } catch (err: any) {
      toast.error('Erro ao excluir: ' + err.message);
    }
  };

  // Calcular dias até o vencimento
  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);

    if (dueDay < currentDay) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
    }

    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Formatador de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Cartões</h1>
        <p className="page-subtitle">Gerencie seus cartões de crédito e parcelamentos</p>
      </header>

      {loading ? (
        <LoadingLogo />
      ) : (
        <>
          {/* Grid de Cartões */}
          <section>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>💳 Meus Cartões</h2>
              <button className="btn btn-primary btn-sm" onClick={handleNewCard}>
                + Novo Cartão
              </button>
            </div>

            <div className="cards-grid">
              {cards.length > 0 ? (
                cards.map((card) => {
                  const daysUntilDue = getDaysUntilDue(card.dueDay);
                  const cardInstallments = installments.filter((i) => i.cardId === card.id);
                  const totalUsed = cardInstallments.reduce(
                    (sum, i) => sum + i.totalAmount - (i.currentInstallment - 1) * (i.totalAmount / i.totalInstallments),
                    0
                  );
                  const usedPercentage = (totalUsed / card.limit) * 100;

                  return (
                    <div
                      key={card.id}
                      className="credit-card"
                      style={{ borderLeft: `4px solid ${card.color}` }}
                    >
                      <div className="credit-card-header">
                        <div>
                          <div className="credit-card-name">{card.name}</div>
                          {card.lastFourDigits && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              **** {card.lastFourDigits}
                            </div>
                          )}
                        </div>
                        <div className="credit-card-limit">{formatCurrency(card.limit)}</div>
                      </div>

                      <div className="credit-card-number">
                        {card.lastFourDigits
                          ? `**** **** **** ${card.lastFourDigits}`
                          : '**** **** **** ****'}
                      </div>

                      <div className="credit-card-dates">
                        <div className="credit-card-date">
                          Fechamento
                          <span>Dia {card.closingDay}</span>
                        </div>
                        <div className="credit-card-date">
                          Vencimento
                          <span>Dia {card.dueDay}</span>
                        </div>
                      </div>

                      {daysUntilDue <= 5 && (
                        <div className="badge badge-danger" style={{ marginBottom: 'var(--spacing-md)' }}>
                          ⚠️ Vence em {daysUntilDue} dias
                        </div>
                      )}

                      {/* Barra de limite usado */}
                      <div style={{ marginTop: 'var(--spacing-md)' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                            marginBottom: 'var(--spacing-xs)',
                          }}
                        >
                          <span style={{ color: 'var(--text-secondary)' }}>Limite usado</span>
                          <span style={{ fontFamily: 'var(--font-display)' }}>
                            {formatCurrency(totalUsed)}
                          </span>
                        </div>
                        <div className="credit-card-limit-bar">
                          <div
                            className={`credit-card-limit-fill ${
                              usedPercentage > 80 ? 'danger' : usedPercentage > 50 ? 'warning' : ''
                            }`}
                            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Ações */}
                      <div
                        style={{
                          display: 'flex',
                          gap: 'var(--spacing-sm)',
                          marginTop: 'var(--spacing-lg)',
                        }}
                      >
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditCard(card)}>
                          ✏️ Editar
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCard(card.id)}>
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <div className="empty-state-icon">💳</div>
                  <p>Nenhum cartão cadastrado</p>
                </div>
              )}
            </div>
          </section>

          {/* Parcelamentos */}
          <section style={{ marginTop: 'var(--spacing-xl)' }}>
            <div className="flex-between" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1.2rem' }}>📦 Parcelamentos</h2>
              {cards.length > 0 && (
                <button className="btn btn-primary btn-sm" onClick={handleNewInstallment}>
                  + Novo Parcelamento
                </button>
              )}
            </div>

            <div className="entries-list">
              {installments.length > 0 ? (
                installments.map((inst) => {
                  const installmentAmount = inst.totalAmount / inst.totalInstallments;
                  const progress = (inst.currentInstallment / inst.totalInstallments) * 100;

                  return (
                    <div key={inst.id} className="entry-item card-bordered-left warning">
                      <div className="entry-info">
                        <span className="entry-name">{inst.description}</span>
                        <span className="entry-meta">
                          {inst.card?.name} • {inst.currentInstallment} de {inst.totalInstallments} parcelas
                        </span>
                        <div
                          style={{
                            width: '200px',
                            height: '4px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '2px',
                            marginTop: 'var(--spacing-sm)',
                          }}
                        >
                          <div
                            style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'var(--accent-warning)',
                              borderRadius: '2px',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-display)',
                              color: 'var(--accent-warning)',
                              fontWeight: 600,
                            }}
                          >
                            {formatCurrency(installmentAmount)}/mês
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Total: {formatCurrency(inst.totalAmount)}
                          </div>
                        </div>
                        <div className="entry-actions">
                          <button
                            className="btn-icon"
                            onClick={() => handleEditInstallment(inst)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleDeleteInstallment(inst.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <p>Nenhum parcelamento cadastrado</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Modal de Cartão */}
      {showCardModal && (
        <div className="modal-overlay" onClick={() => setShowCardModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
              </h3>
              <button className="modal-close" onClick={() => setShowCardModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaveCard}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Cartão</label>
                  <input
                    className="form-input"
                    type="text"
                    value={cardFormData.name}
                    onChange={(e) =>
                      setCardFormData({ ...cardFormData, name: e.target.value })
                    }
                    required
                    placeholder="Ex: Nubank Ultravioleta"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Últimos 4 Dígitos (opcional)</label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength={4}
                    value={cardFormData.lastFourDigits}
                    onChange={(e) =>
                      setCardFormData({ ...cardFormData, lastFourDigits: e.target.value })
                    }
                    placeholder="1234"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cor do Cartão</label>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                    {cardColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCardFormData({ ...cardFormData, color })}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: 'var(--radius-md)',
                          background: color,
                          border:
                            cardFormData.color === color
                              ? '3px solid var(--accent-primary)'
                              : '3px solid transparent',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Dia de Fechamento</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="31"
                      value={cardFormData.closingDay}
                      onChange={(e) =>
                        setCardFormData({ ...cardFormData, closingDay: e.target.value })
                      }
                      required
                      placeholder="1-31"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Dia de Vencimento</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="31"
                      value={cardFormData.dueDay}
                      onChange={(e) =>
                        setCardFormData({ ...cardFormData, dueDay: e.target.value })
                      }
                      required
                      placeholder="1-31"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Limite de Crédito</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    value={cardFormData.limit}
                    onChange={(e) =>
                      setCardFormData({ ...cardFormData, limit: e.target.value })
                    }
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCardModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCard ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Parcelamento */}
      {showInstallmentModal && (
        <div className="modal-overlay" onClick={() => setShowInstallmentModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInstallment ? 'Editar Parcelamento' : 'Novo Parcelamento'}
              </h3>
              <button className="modal-close" onClick={() => setShowInstallmentModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSaveInstallment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input
                    className="form-input"
                    type="text"
                    value={installmentFormData.description}
                    onChange={(e) =>
                      setInstallmentFormData({ ...installmentFormData, description: e.target.value })
                    }
                    required
                    placeholder="Ex: MacBook Pro, iPhone 15..."
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Valor Total</label>
                    <input
                      className="form-input"
                      type="number"
                      step="0.01"
                      value={installmentFormData.totalAmount}
                      onChange={(e) =>
                        setInstallmentFormData({
                          ...installmentFormData,
                          totalAmount: e.target.value,
                        })
                      }
                      required
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Parcelas</label>
                    <input
                      className="form-input"
                      type="number"
                      min="2"
                      max="48"
                      value={installmentFormData.totalInstallments}
                      onChange={(e) =>
                        setInstallmentFormData({
                          ...installmentFormData,
                          totalInstallments: e.target.value,
                        })
                      }
                      required
                      placeholder="12"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Data da 1ª Parcela</label>
                    <input
                      className="form-input"
                      type="date"
                      value={installmentFormData.firstPaymentDate}
                      onChange={(e) =>
                        setInstallmentFormData({
                          ...installmentFormData,
                          firstPaymentDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cartão</label>
                    <select
                      className="form-select"
                      value={installmentFormData.cardId}
                      onChange={(e) =>
                        setInstallmentFormData({ ...installmentFormData, cardId: e.target.value })
                      }
                      required
                    >
                      <option value="">Selecione</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInstallmentModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingInstallment ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cards;
