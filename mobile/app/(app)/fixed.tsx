import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ChoiceModal } from '@/components/ChoiceModal';
import { SheetModal } from '@/components/SheetModal';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import { FEATURE_PAYMENTS } from '@/src/config/features';
import { api } from '@/src/lib/api';
import { ensureCategoryExists } from '@/src/lib/ensureCategory';
import { computePlanningMonth } from '@/src/lib/yearMonth';
import { confirmDestructive, toastMessage } from '@/src/utils/alerts';
import type { Category, FixedExpense, FixedIncome } from '@/src/types';

const PAYMENT_METHODS = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

/** Valor em pt-BR: vírgula decimal e opcionalmente ponto de milhar. */
function parsePtBrAmount(input: string): number {
  const s = input.trim();
  if (!s) return NaN;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > lastDot) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(s.replace(/,/g, ''));
}

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

type PropagateCtx = { kind: 'income' | 'expense'; id: number } | null;

export default function FixedScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [planYear, setPlanYear] = useState(new Date().getFullYear());
  const [planMonth, setPlanMonth] = useState(new Date().getMonth() + 1);
  const [fixedIncomes, setFixedIncomes] = useState<FixedIncome[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');
  const [editingItem, setEditingItem] = useState<FixedIncome | FixedExpense | null>(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    dayOfMonth: '',
    category: '',
    paymentMethod: 'PIX',
    active: true,
  });
  const [propagateCtx, setPropagateCtx] = useState<PropagateCtx>(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await api.settings.get();
        const p = computePlanningMonth(settings.payday);
        setPlanYear(p.year);
        setPlanMonth(p.month);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [incomes, expenses, incomeCats, expenseCats] = await Promise.all([
        api.fixedIncomes.getAll(),
        api.fixedExpenses.getAll(),
        api.categories.getAll('income'),
        api.categories.getAll('expense'),
      ]);
      setFixedIncomes(incomes ?? []);
      setFixedExpenses(expenses ?? []);
      setIncomeCategories(incomeCats ?? []);
      setExpenseCategories(expenseCats ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const monthLabel = new Date(planYear, planMonth - 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });

  async function runPropagate(choice: 'none' | 'from-month' | 'future-only') {
    if (!propagateCtx || choice === 'none') {
      setPropagateCtx(null);
      return;
    }
    const payload = { fromYear: planYear, fromMonth: planMonth, scope: choice as 'from-month' | 'future-only' };
    try {
      const result =
        propagateCtx.kind === 'income'
          ? await api.fixedIncomes.propagate(propagateCtx.id, payload)
          : await api.fixedExpenses.propagate(propagateCtx.id, payload);
      toastMessage('Propagação', `${result.updated} lançamento(s) atualizado(s).`);
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao propagar');
    } finally {
      setPropagateCtx(null);
    }
  }

  async function saveFixed() {
    try {
      const name = form.name.trim();
      const amount = parsePtBrAmount(form.amount);
      const dayOfMonth = parseInt(form.dayOfMonth.trim(), 10);

      if (!name) {
        toastMessage('Informe o nome');
        return;
      }
      if (Number.isNaN(amount) || amount <= 0) {
        toastMessage('Informe um valor válido maior que zero');
        return;
      }
      if (Number.isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
        toastMessage('Dia do mês deve ser entre 1 e 31');
        return;
      }

      const categoryList = modalType === 'income' ? incomeCategories : expenseCategories;
      const category = await ensureCategoryExists(api, form.category, modalType, categoryList);

      const data = {
        name,
        amount,
        dayOfMonth,
        category,
        paymentMethod: modalType === 'expense' ? form.paymentMethod : undefined,
        active: form.active,
      } as const;
      if (modalType === 'income') {
        if (editingItem) {
          await api.fixedIncomes.update(editingItem.id, data);
          setShowModal(false);
          await load();
          setPropagateCtx({ kind: 'income', id: editingItem.id });
        } else {
          await api.fixedIncomes.create(data);
          setShowModal(false);
          load();
          toastMessage('Ganho fixo criado');
        }
      } else {
        if (editingItem) {
          await api.fixedExpenses.update(editingItem.id, { ...data, paymentMethod: form.paymentMethod });
          setShowModal(false);
          await load();
          setPropagateCtx({ kind: 'expense', id: editingItem.id });
        } else {
          await api.fixedExpenses.create({ ...data, paymentMethod: form.paymentMethod });
          setShowModal(false);
          load();
          toastMessage('Gasto fixo criado');
        }
      }
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao salvar');
    }
  }

  async function toggleActive(type: 'income' | 'expense', id: number, current: boolean) {
    try {
      if (type === 'income') await api.fixedIncomes.update(id, { active: !current });
      else await api.fixedExpenses.update(id, { active: !current });
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function deleteFixed(type: 'income' | 'expense', id: number) {
    const ok = await confirmDestructive('Excluir item fixo', 'Tem certeza?');
    if (!ok) return;
    try {
      if (type === 'income') await api.fixedIncomes.delete(id);
      else await api.fixedExpenses.delete(id);
      load();
      toastMessage('Excluído');
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  function openNew(type: 'income' | 'expense') {
    setModalType(type);
    setEditingItem(null);
    setForm({
      name: '',
      amount: '',
      dayOfMonth: '',
      category: '',
      paymentMethod: FEATURE_PAYMENTS && type === 'expense' ? 'PIX' : '',
      active: true,
    });
    setShowModal(true);
  }

  function openEdit(type: 'income' | 'expense', item: FixedIncome | FixedExpense) {
    setModalType(type);
    setEditingItem(item);
    setForm({
      name: item.name,
      amount: item.amount.toString(),
      dayOfMonth: item.dayOfMonth.toString(),
      category: item.category,
      paymentMethod: (item as FixedExpense).paymentMethod || (FEATURE_PAYMENTS ? 'PIX' : ''),
      active: item.active,
    });
    setShowModal(true);
  }

  const totalIn = fixedIncomes.reduce((s, i) => s + i.amount, 0);
  const totalEx = fixedExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + theme.spacingMd }]}>
      <Text style={styles.pageTitle}>Fixos</Text>
      <Text style={styles.pageSubtitle}>Ganhos e gastos recorrentes</Text>
      <View style={styles.warnBox}>
        <Text style={styles.warnText}>
          Alterações aqui afetam apenas novos meses. Meses já gerados não são alterados automaticamente.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accentPrimary} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionRow}>
            <Text style={styles.h2}>Ganhos fixos ({formatBrl(totalIn)})</Text>
            <Pressable style={styles.btnSm} onPress={() => openNew('income')}>
              <Text style={styles.btnSmText}>+ Novo</Text>
            </Pressable>
          </View>
          {fixedIncomes.map((inc) => (
            <FixedRow
              key={inc.id}
              name={inc.name}
              meta={`Dia ${inc.dayOfMonth} · ${inc.category}`}
              amount={inc.amount}
              tone="income"
              active={inc.active}
              onToggle={() => toggleActive('income', inc.id, inc.active)}
              onEdit={() => openEdit('income', inc)}
              onDelete={() => deleteFixed('income', inc.id)}
            />
          ))}
          {!fixedIncomes.length ? <Text style={styles.empty}>Nenhum ganho fixo</Text> : null}

          <View style={[styles.sectionRow, { marginTop: theme.spacingLg }]}>
            <Text style={styles.h2}>Gastos fixos ({formatBrl(totalEx)})</Text>
            <Pressable style={styles.btnSm} onPress={() => openNew('expense')}>
              <Text style={styles.btnSmText}>+ Novo</Text>
            </Pressable>
          </View>
          {fixedExpenses.map((ex) => (
            <FixedRow
              key={ex.id}
              name={ex.name}
              meta={`Dia ${ex.dayOfMonth} · ${ex.category}${FEATURE_PAYMENTS && ex.paymentMethod ? ` · ${ex.paymentMethod}` : ''}`}
              amount={ex.amount}
              tone="expense"
              active={ex.active}
              onToggle={() => toggleActive('expense', ex.id, ex.active)}
              onEdit={() => openEdit('expense', ex)}
              onDelete={() => deleteFixed('expense', ex.id)}
            />
          ))}
          {!fixedExpenses.length ? <Text style={styles.empty}>Nenhum gasto fixo</Text> : null}

          <View style={[styles.card, { marginTop: theme.spacingLg }]}>
            <Text style={styles.h2}>Resumo mensal</Text>
            <Text style={styles.meta}>Ganhos: {formatBrl(totalIn)}</Text>
            <Text style={styles.meta}>Gastos: {formatBrl(totalEx)}</Text>
            <Text style={[styles.meta, { color: theme.accentPrimary, marginTop: 8 }]}>
              Líquido fixo: {formatBrl(totalIn - totalEx)}
            </Text>
          </View>
        </ScrollView>
      )}

      <ChoiceModal
        visible={!!propagateCtx}
        title="Propagar alterações?"
        message={`Atualizar lançamentos mensais vinculados? Referência: ${monthLabel}`}
        options={[
          { id: 'none', label: 'Não propagar' },
          { id: 'from-month', label: `A partir de ${monthLabel}` },
          { id: 'future-only', label: 'Só meses futuros' },
        ]}
        onPick={(id) => runPropagate(id)}
        onCancel={() => setPropagateCtx(null)}
      />

      <SheetModal
        visible={showModal}
        title={editingItem ? 'Editar fixo' : modalType === 'income' ? 'Novo ganho fixo' : 'Novo gasto fixo'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setShowModal(false)}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={saveFixed}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </Pressable>
          </>
        }>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <Text style={styles.label}>Valor</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
        <Text style={styles.label}>Dia do mês (1–31)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={form.dayOfMonth}
          onChangeText={(t) => setForm({ ...form, dayOfMonth: t })}
        />
        <Text style={styles.label}>Categoria</Text>
        <CategoryPicker
          key={modalType}
          type={modalType}
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          categories={modalType === 'income' ? incomeCategories : expenseCategories}
        />
        {FEATURE_PAYMENTS && modalType === 'expense' ? (
          <>
            <Text style={[styles.label, { marginTop: 8 }]}>Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {PAYMENT_METHODS.map((pm) => (
                <Pressable
                  key={pm}
                  style={[styles.pmChip, form.paymentMethod === pm && styles.pmChipActive]}
                  onPress={() => setForm({ ...form, paymentMethod: pm })}>
                  <Text style={[styles.pmText, form.paymentMethod === pm && styles.pmTextActive]}>{pm}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Ativo</Text>
          <Switch value={form.active} onValueChange={(v) => setForm({ ...form, active: v })} />
        </View>
      </SheetModal>
    </View>
    </TabScreenTransition>
  );
}

function FixedRow({
  name,
  meta,
  amount,
  tone,
  active,
  onToggle,
  onEdit,
  onDelete,
}: {
  name: string;
  meta: string;
  amount: number;
  tone: 'income' | 'expense';
  active: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const border = tone === 'income' ? theme.accentPrimary : theme.accentDanger;
  const color = tone === 'income' ? theme.accentPrimary : theme.accentDanger;
  return (
    <View style={[styles.card, { opacity: active ? 1 : 0.55, borderLeftWidth: 4, borderLeftColor: border }]}>
      <Text style={styles.entryName}>
        {name}
        {!active ? <Text style={styles.inactive}> (Inativo)</Text> : null}
      </Text>
      <Text style={styles.meta}>{meta}</Text>
      <Text style={[styles.amount, { color }]}>{tone === 'income' ? '+' : '-'} {formatBrl(amount)}</Text>
      <View style={styles.rowActions}>
        <View style={styles.switchRow}>
          <Text style={styles.small}>Ativo</Text>
          <Switch value={active} onValueChange={onToggle} />
        </View>
        <Pressable onPress={onEdit}>
          <Text style={styles.link}>Editar</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={[styles.link, { color: theme.accentDanger }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgPrimary, paddingHorizontal: theme.spacingLg },
    pageTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: theme.textPrimary },
    pageSubtitle: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.textSecondary, marginTop: 4 },
    warnBox: {
      backgroundColor: theme.bgTertiary,
      padding: theme.spacingMd,
      borderRadius: theme.radiusMd,
      marginTop: theme.spacingMd,
      marginBottom: theme.spacingMd,
    },
    warnText: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textSecondary },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacingSm },
    h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 16, color: theme.textPrimary, flex: 1 },
    btnSm: { backgroundColor: theme.accentPrimary, paddingHorizontal: theme.spacingMd, paddingVertical: theme.spacingSm, borderRadius: theme.radiusMd },
    btnSmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: theme.onAccent },
    card: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingMd,
      marginBottom: theme.spacingSm,
    },
    entryName: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: theme.textPrimary },
    inactive: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted },
    meta: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted, marginTop: 4 },
    amount: { fontFamily: FontFamily.displayBold, fontSize: 16, marginTop: 6 },
    rowActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacingMd, marginTop: theme.spacingSm, flexWrap: 'wrap' },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    small: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textSecondary },
    link: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.accentPrimary },
    empty: { fontFamily: FontFamily.ui, color: theme.textMuted, marginBottom: theme.spacingMd },
    label: { fontFamily: FontFamily.uiMedium, fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    input: {
      fontFamily: FontFamily.ui,
      fontSize: 16,
      color: theme.textPrimary,
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      padding: theme.spacingMd,
      marginBottom: theme.spacingSm,
    },
    catListBox: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      backgroundColor: theme.bgTertiary,
      marginBottom: theme.spacingSm,
      overflow: 'hidden',
    },
    catRow: { paddingVertical: theme.spacingSm, paddingHorizontal: theme.spacingSm, borderBottomWidth: 1, borderBottomColor: theme.border },
    catRowActive: { backgroundColor: theme.bgSecondary },
    catText: { fontFamily: FontFamily.ui, color: theme.textPrimary },
    catEmptyBox: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      padding: theme.spacingMd,
      marginBottom: theme.spacingSm,
      backgroundColor: theme.bgTertiary,
    },
    catEmptyText: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textSecondary, marginBottom: theme.spacingSm },
    btnAddCat: {
      marginTop: theme.spacingSm,
      alignSelf: 'flex-start',
      backgroundColor: theme.accentPrimary,
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      borderRadius: theme.radiusMd,
    },
    btnAddCatText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: theme.onAccent },
    pmChip: {
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      marginRight: theme.spacingSm,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pmChipActive: { borderColor: theme.accentPrimary },
    pmText: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textSecondary },
    pmTextActive: { color: theme.accentPrimary },
    btnGhost: { paddingHorizontal: theme.spacingLg, paddingVertical: theme.spacingMd },
    btnGhostText: { fontFamily: FontFamily.ui, color: theme.textSecondary },
    btnPrimary: {
      backgroundColor: theme.accentPrimary,
      paddingHorizontal: theme.spacingLg,
      paddingVertical: theme.spacingMd,
      borderRadius: theme.radiusMd,
    },
    btnPrimaryText: { fontFamily: FontFamily.uiSemiBold, color: theme.onAccent },
  })
);
