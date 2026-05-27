import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetModal } from '@/components/SheetModal';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import { confirmDestructive, toastMessage } from '@/src/utils/alerts';
import type { Card, Installment } from '@/src/types';

const CARD_COLORS = ['#6c19c9', '#1a1a2e', '#1e3a5f', '#0d4f3c', '#5c1a1a', '#1a4d5c'];

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function getDaysUntilDue(dueDay: number) {
  const today = new Date();
  const currentDay = today.getDate();
  let dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (dueDay < currentDay) {
    dueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
  }
  return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function installmentUsedOnCard(cardId: number, installments: Installment[]): number {
  return installments
    .filter((i) => i.cardId === cardId && i.status === 'active')
    .reduce((sum, i) => {
      const per = i.totalAmount / i.totalInstallments;
      return sum + (i.totalAmount - (i.currentInstallment - 1) * per);
    }, 0);
}

export default function CardsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Card[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [cardModal, setCardModal] = useState(false);
  const [instModal, setInstModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editingInst, setEditingInst] = useState<Installment | null>(null);
  const [cardForm, setCardForm] = useState({
    name: '',
    lastFourDigits: '',
    color: CARD_COLORS[0],
    closingDay: '',
    dueDay: '',
    limit: '',
  });
  const [instForm, setInstForm] = useState({
    description: '',
    totalAmount: '',
    totalInstallments: '',
    firstPaymentDate: '',
    cardId: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, i] = await Promise.all([api.cards.getAll(), api.installments.getAll()]);
      setCards(c ?? []);
      setInstallments(i ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveCard() {
    try {
      const data = {
        name: cardForm.name,
        lastFourDigits: cardForm.lastFourDigits || undefined,
        color: cardForm.color,
        closingDay: parseInt(cardForm.closingDay, 10),
        dueDay: parseInt(cardForm.dueDay, 10),
        limit: parseFloat(cardForm.limit),
      };
      if (editingCard) await api.cards.update(editingCard.id, data);
      else await api.cards.create(data);
      setCardModal(false);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function deleteCard(id: number) {
    const ok = await confirmDestructive('Excluir cartão', 'Tem certeza?');
    if (!ok) return;
    try {
      await api.cards.delete(id);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function saveInst() {
    try {
      const data = {
        description: instForm.description,
        totalAmount: parseFloat(instForm.totalAmount),
        totalInstallments: parseInt(instForm.totalInstallments, 10),
        firstPaymentDate: instForm.firstPaymentDate,
        cardId: parseInt(instForm.cardId, 10),
      };
      if (editingInst) await api.installments.update(editingInst.id, data);
      else await api.installments.create(data);
      setInstModal(false);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function deleteInst(id: number) {
    const ok = await confirmDestructive('Excluir parcelamento', 'Tem certeza?');
    if (!ok) return;
    try {
      await api.installments.delete(id);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + Theme.spacingMd }]}>
      <Text style={styles.title}>Cartões</Text>
      <Text style={styles.sub}>Crédito e parcelamentos</Text>

      {loading ? (
        <ActivityIndicator color={Theme.accentPrimary} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>Meus cartões</Text>
            <Pressable style={styles.btnSm} onPress={() => {
              setEditingCard(null);
              setCardForm({ name: '', lastFourDigits: '', color: CARD_COLORS[0], closingDay: '', dueDay: '', limit: '' });
              setCardModal(true);
            }}>
              <Text style={styles.btnSmText}>+ Novo</Text>
            </Pressable>
          </View>

          {cards.map((card) => {
            const days = getDaysUntilDue(card.dueDay);
            const used = installmentUsedOnCard(card.id, installments);
            const pct = card.limit > 0 ? (used / card.limit) * 100 : 0;
            return (
              <View key={card.id} style={[styles.cardVisual, { borderLeftColor: card.color }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardName}>{card.name}</Text>
                    {card.lastFourDigits ? (
                      <Text style={styles.cardDigits}>**** {card.lastFourDigits}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.cardLimit}>{formatBrl(card.limit)}</Text>
                </View>
                <Text style={styles.cardNumber}>
                  {card.lastFourDigits ? `**** **** **** ${card.lastFourDigits}` : '**** **** **** ****'}
                </Text>
                <Text style={styles.cardDates}>
                  Fechamento dia {card.closingDay} · Vencimento dia {card.dueDay}
                </Text>
                {days <= 5 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Vence em {days} dias</Text>
                  </View>
                ) : null}
                <Text style={styles.usedLabel}>Limite usado · {formatBrl(used)}</Text>
                <View style={styles.limitBar}>
                  <View
                    style={[
                      styles.limitFill,
                      { width: `${Math.min(pct, 100)}%` },
                      pct > 80 ? { backgroundColor: Theme.accentDanger } : pct > 50 ? { backgroundColor: Theme.accentWarning } : { backgroundColor: Theme.accentPrimary },
                    ]}
                  />
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => {
                      setEditingCard(card);
                      setCardForm({
                        name: card.name,
                        lastFourDigits: card.lastFourDigits || '',
                        color: card.color,
                        closingDay: String(card.closingDay),
                        dueDay: String(card.dueDay),
                        limit: String(card.limit),
                      });
                      setCardModal(true);
                    }}>
                    <Text style={styles.link}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteCard(card.id)}>
                    <Text style={[styles.link, { color: Theme.accentDanger }]}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {!cards.length ? <Text style={styles.empty}>Nenhum cartão</Text> : null}

          <View style={[styles.rowBetween, { marginTop: Theme.spacingLg }]}>
            <Text style={styles.h2}>Parcelamentos</Text>
            {cards.length > 0 ? (
              <Pressable
                style={styles.btnSm}
                onPress={() => {
                  setEditingInst(null);
                  setInstForm({
                    description: '',
                    totalAmount: '',
                    totalInstallments: '',
                    firstPaymentDate: '',
                    cardId: String(cards[0]?.id ?? ''),
                  });
                  setInstModal(true);
                }}>
                <Text style={styles.btnSmText}>+ Novo</Text>
              </Pressable>
            ) : null}
          </View>

          {installments.map((inst) => {
            const per = inst.totalAmount / inst.totalInstallments;
            const progress = (inst.currentInstallment / inst.totalInstallments) * 100;
            return (
              <View key={inst.id} style={[styles.instCard, { borderLeftColor: Theme.accentWarning }]}>
                <Text style={styles.cardName}>{inst.description}</Text>
                <Text style={styles.cardDigits}>
                  {inst.card?.name} · {inst.currentInstallment}/{inst.totalInstallments}
                </Text>
                <View style={styles.miniBar}>
                  <View style={[styles.miniFill, { width: `${progress}%` }]} />
                </View>
                <View style={styles.instRow}>
                  <Text style={{ fontFamily: FontFamily.displayBold, color: Theme.accentWarning }}>
                    {formatBrl(per)}/mês
                  </Text>
                  <Text style={styles.cardDigits}>Total {formatBrl(inst.totalAmount)}</Text>
                </View>
                <View style={styles.cardActions}>
                  <Pressable
                    onPress={() => {
                      setEditingInst(inst);
                      setInstForm({
                        description: inst.description,
                        totalAmount: String(inst.totalAmount),
                        totalInstallments: String(inst.totalInstallments),
                        firstPaymentDate: inst.firstPaymentDate,
                        cardId: String(inst.cardId),
                      });
                      setInstModal(true);
                    }}>
                    <Text style={styles.link}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteInst(inst.id)}>
                    <Text style={[styles.link, { color: Theme.accentDanger }]}>Excluir</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {!installments.length ? <Text style={styles.empty}>Nenhum parcelamento</Text> : null}
        </ScrollView>
      )}

      <SheetModal
        visible={cardModal}
        title={editingCard ? 'Editar cartão' : 'Novo cartão'}
        onClose={() => setCardModal(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setCardModal(false)}>
              <Text style={styles.muted}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnSm} onPress={saveCard}>
              <Text style={styles.btnSmText}>Salvar</Text>
            </Pressable>
          </>
        }>
        <Field label="Nome" value={cardForm.name} onChangeText={(t) => setCardForm({ ...cardForm, name: t })} />
        <Field label="Últimos 4 dígitos" value={cardForm.lastFourDigits} onChangeText={(t) => setCardForm({ ...cardForm, lastFourDigits: t })} maxLength={4} />
        <Text style={styles.label}>Cor</Text>
        <ScrollView horizontal style={{ marginBottom: 12 }}>
          {CARD_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCardForm({ ...cardForm, color: c })}
              style={[styles.colorDot, { backgroundColor: c }, cardForm.color === c && styles.colorDotActive]}
            />
          ))}
        </ScrollView>
        <Field label="Dia fechamento" value={cardForm.closingDay} onChangeText={(t) => setCardForm({ ...cardForm, closingDay: t })} keyboardType="number-pad" />
        <Field label="Dia vencimento" value={cardForm.dueDay} onChangeText={(t) => setCardForm({ ...cardForm, dueDay: t })} keyboardType="number-pad" />
        <Field label="Limite" value={cardForm.limit} onChangeText={(t) => setCardForm({ ...cardForm, limit: t })} keyboardType="decimal-pad" />
      </SheetModal>

      <SheetModal
        visible={instModal}
        title={editingInst ? 'Editar parcelamento' : 'Novo parcelamento'}
        onClose={() => setInstModal(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setInstModal(false)}>
              <Text style={styles.muted}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnSm} onPress={saveInst}>
              <Text style={styles.btnSmText}>Salvar</Text>
            </Pressable>
          </>
        }>
        <Field label="Descrição" value={instForm.description} onChangeText={(t) => setInstForm({ ...instForm, description: t })} />
        <Field label="Valor total" value={instForm.totalAmount} onChangeText={(t) => setInstForm({ ...instForm, totalAmount: t })} keyboardType="decimal-pad" />
        <Field label="Nº parcelas" value={instForm.totalInstallments} onChangeText={(t) => setInstForm({ ...instForm, totalInstallments: t })} keyboardType="number-pad" />
        <Field label="Primeira parcela (data)" value={instForm.firstPaymentDate} onChangeText={(t) => setInstForm({ ...instForm, firstPaymentDate: t })} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Cartão</Text>
        <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
          {cards.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.catRow, instForm.cardId === String(c.id) && styles.catRowActive]}
              onPress={() => setInstForm({ ...instForm, cardId: String(c.id) })}>
              <Text style={styles.cardName}>{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </SheetModal>
    </View>
    </TabScreenTransition>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  maxLength,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor={Theme.textMuted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.bgPrimary, paddingHorizontal: Theme.spacingLg },
  title: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: Theme.textPrimary },
  sub: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.textSecondary, marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacingSm },
  h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 17, color: Theme.textPrimary },
  btnSm: { backgroundColor: Theme.accentPrimary, paddingHorizontal: Theme.spacingMd, paddingVertical: Theme.spacingSm, borderRadius: Theme.radiusMd },
  btnSmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: Theme.bgPrimary },
  cardVisual: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderLeftWidth: 4,
    padding: Theme.spacingLg,
    marginBottom: Theme.spacingMd,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { fontFamily: FontFamily.uiSemiBold, fontSize: 16, color: Theme.textPrimary },
  cardDigits: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted, marginTop: 4 },
  cardLimit: { fontFamily: FontFamily.displayBold, color: Theme.accentPrimary },
  cardNumber: { fontFamily: FontFamily.displayBold, fontSize: 14, color: Theme.textSecondary, marginTop: Theme.spacingMd },
  cardDates: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted, marginTop: 8 },
  badge: { alignSelf: 'flex-start', backgroundColor: Theme.accentDangerDark, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 8 },
  badgeText: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textPrimary },
  usedLabel: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textSecondary, marginTop: Theme.spacingMd },
  limitBar: { height: 6, backgroundColor: Theme.bgTertiary, borderRadius: 3, marginTop: 4, overflow: 'hidden' },
  limitFill: { height: '100%', borderRadius: 3 },
  cardActions: { flexDirection: 'row', gap: Theme.spacingLg, marginTop: Theme.spacingMd },
  link: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.accentPrimary },
  empty: { fontFamily: FontFamily.ui, color: Theme.textMuted, marginVertical: Theme.spacingMd },
  instCard: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    borderLeftWidth: 4,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingSm,
  },
  miniBar: { height: 4, backgroundColor: Theme.bgTertiary, borderRadius: 2, marginTop: 8 },
  miniFill: { height: 4, backgroundColor: Theme.accentWarning, borderRadius: 2 },
  instRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  label: { fontFamily: FontFamily.uiMedium, fontSize: 13, color: Theme.textSecondary, marginBottom: 4 },
  input: {
    fontFamily: FontFamily.ui,
    fontSize: 16,
    color: Theme.textPrimary,
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingSm,
  },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginRight: 10, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: Theme.textPrimary },
  catRow: { paddingVertical: Theme.spacingSm, borderBottomWidth: 1, borderBottomColor: Theme.border },
  catRowActive: { backgroundColor: Theme.bgTertiary },
  btnGhost: { paddingHorizontal: Theme.spacingLg, paddingVertical: Theme.spacingMd },
  muted: { fontFamily: FontFamily.ui, color: Theme.textMuted },
});
