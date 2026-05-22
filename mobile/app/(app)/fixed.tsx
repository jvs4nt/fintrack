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
import { ChoiceModal } from '@/components/ChoiceModal';
import { SheetModal } from '@/components/SheetModal';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import { computePlanningMonth } from '@/src/hooks/usePlanningMonth';
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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

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
      const category = form.category.trim();
      const amount = parsePtBrAmount(form.amount);
      const dayOfMonth = parseInt(form.dayOfMonth.trim(), 10);

      if (!name) {
        toastMessage('Informe o nome');
        return;
      }
      if (!category) {
        toastMessage('Selecione uma categoria');
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
    setNewCategoryName('');
    setForm({
      name: '',
      amount: '',
      dayOfMonth: '',
      category: '',
      paymentMethod: type === 'expense' ? 'PIX' : '',
      active: true,
    });
    setShowModal(true);
  }

  function openEdit(type: 'income' | 'expense', item: FixedIncome | FixedExpense) {
    setModalType(type);
    setEditingItem(item);
    setNewCategoryName('');
    setForm({
      name: item.name,
      amount: item.amount.toString(),
      dayOfMonth: item.dayOfMonth.toString(),
      category: item.category,
      paymentMethod: (item as FixedExpense).paymentMethod || 'PIX',
      active: item.active,
    });
    setShowModal(true);
  }

  async function addQuickCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      toastMessage('Digite o nome da categoria');
      return;
    }
    setCreatingCategory(true);
    try {
      await api.categories.create({ name, type: modalType });
      setNewCategoryName('');
      const fresh = await api.categories.getAll(modalType);
      if (modalType === 'income') setIncomeCategories(fresh ?? []);
      else setExpenseCategories(fresh ?? []);
      setForm((f) => ({ ...f, category: name }));
      toastMessage('Categoria criada');
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Não foi possível criar');
    } finally {
      setCreatingCategory(false);
    }
  }

  const cats = modalType === 'income' ? incomeCategories : expenseCategories;
  const totalIn = fixedIncomes.reduce((s, i) => s + i.amount, 0);
  const totalEx = fixedExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + Theme.spacingMd }]}>
      <Text style={styles.pageTitle}>Fixos</Text>
      <Text style={styles.pageSubtitle}>Ganhos e gastos recorrentes</Text>
      <View style={styles.warnBox}>
        <Text style={styles.warnText}>
          Alterações aqui afetam apenas novos meses. Meses já gerados não são alterados automaticamente.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Theme.accentPrimary} style={{ marginTop: 24 }} />
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

          <View style={[styles.sectionRow, { marginTop: Theme.spacingLg }]}>
            <Text style={styles.h2}>Gastos fixos ({formatBrl(totalEx)})</Text>
            <Pressable style={styles.btnSm} onPress={() => openNew('expense')}>
              <Text style={styles.btnSmText}>+ Novo</Text>
            </Pressable>
          </View>
          {fixedExpenses.map((ex) => (
            <FixedRow
              key={ex.id}
              name={ex.name}
              meta={`Dia ${ex.dayOfMonth} · ${ex.category}${ex.paymentMethod ? ` · ${ex.paymentMethod}` : ''}`}
              amount={ex.amount}
              tone="expense"
              active={ex.active}
              onToggle={() => toggleActive('expense', ex.id, ex.active)}
              onEdit={() => openEdit('expense', ex)}
              onDelete={() => deleteFixed('expense', ex.id)}
            />
          ))}
          {!fixedExpenses.length ? <Text style={styles.empty}>Nenhum gasto fixo</Text> : null}

          <View style={[styles.card, { marginTop: Theme.spacingLg }]}>
            <Text style={styles.h2}>Resumo mensal</Text>
            <Text style={styles.meta}>Ganhos: {formatBrl(totalIn)}</Text>
            <Text style={styles.meta}>Gastos: {formatBrl(totalEx)}</Text>
            <Text style={[styles.meta, { color: Theme.accentPrimary, marginTop: 8 }]}>
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
        {cats.length === 0 ? (
          <View style={styles.catEmptyBox}>
            <Text style={styles.catEmptyText}>
              Nenhuma categoria de {modalType === 'income' ? 'ganho' : 'gasto'} ainda. Crie uma abaixo.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nome da nova categoria"
              placeholderTextColor={Theme.textMuted}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              editable={!creatingCategory}
            />
            <Pressable
              style={[styles.btnAddCat, creatingCategory && { opacity: 0.6 }]}
              onPress={addQuickCategory}
              disabled={creatingCategory}>
              <Text style={styles.btnAddCatText}>{creatingCategory ? 'Salvando…' : 'Adicionar categoria'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.catListBox}>
            {cats.map((c) => (
              <Pressable
                key={c.id}
                style={[styles.catRow, form.category === c.name && styles.catRowActive]}
                onPress={() => setForm({ ...form, category: c.name })}>
                <Text style={styles.catText}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {modalType === 'expense' ? (
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
  const border = tone === 'income' ? Theme.accentPrimary : Theme.accentDanger;
  const color = tone === 'income' ? Theme.accentPrimary : Theme.accentDanger;
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
          <Text style={[styles.link, { color: Theme.accentDanger }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.bgPrimary, paddingHorizontal: Theme.spacingLg },
  pageTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: Theme.textPrimary },
  pageSubtitle: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.textSecondary, marginTop: 4 },
  warnBox: {
    backgroundColor: Theme.bgTertiary,
    padding: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
    marginTop: Theme.spacingMd,
    marginBottom: Theme.spacingMd,
  },
  warnText: { fontFamily: FontFamily.ui, fontSize: 13, color: Theme.textSecondary },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacingSm },
  h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 16, color: Theme.textPrimary, flex: 1 },
  btnSm: { backgroundColor: Theme.accentPrimary, paddingHorizontal: Theme.spacingMd, paddingVertical: Theme.spacingSm, borderRadius: Theme.radiusMd },
  btnSmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: Theme.bgPrimary },
  card: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingSm,
  },
  entryName: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: Theme.textPrimary },
  inactive: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted },
  meta: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted, marginTop: 4 },
  amount: { fontFamily: FontFamily.displayBold, fontSize: 16, marginTop: 6 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacingMd, marginTop: Theme.spacingSm, flexWrap: 'wrap' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  small: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textSecondary },
  link: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.accentPrimary },
  empty: { fontFamily: FontFamily.ui, color: Theme.textMuted, marginBottom: Theme.spacingMd },
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
  catListBox: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgTertiary,
    marginBottom: Theme.spacingSm,
    overflow: 'hidden',
  },
  catRow: { paddingVertical: Theme.spacingSm, paddingHorizontal: Theme.spacingSm, borderBottomWidth: 1, borderBottomColor: Theme.border },
  catRowActive: { backgroundColor: Theme.bgSecondary },
  catText: { fontFamily: FontFamily.ui, color: Theme.textPrimary },
  catEmptyBox: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingSm,
    backgroundColor: Theme.bgTertiary,
  },
  catEmptyText: { fontFamily: FontFamily.ui, fontSize: 13, color: Theme.textSecondary, marginBottom: Theme.spacingSm },
  btnAddCat: {
    marginTop: Theme.spacingSm,
    alignSelf: 'flex-start',
    backgroundColor: Theme.accentPrimary,
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
  },
  btnAddCatText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: Theme.bgPrimary },
  pmChip: {
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    marginRight: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pmChipActive: { borderColor: Theme.accentPrimary },
  pmText: { fontFamily: FontFamily.ui, fontSize: 13, color: Theme.textSecondary },
  pmTextActive: { color: Theme.accentPrimary },
  btnGhost: { paddingHorizontal: Theme.spacingLg, paddingVertical: Theme.spacingMd },
  btnGhostText: { fontFamily: FontFamily.ui, color: Theme.textSecondary },
  btnPrimary: {
    backgroundColor: Theme.accentPrimary,
    paddingHorizontal: Theme.spacingLg,
    paddingVertical: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
  },
  btnPrimaryText: { fontFamily: FontFamily.uiSemiBold, color: Theme.bgPrimary },
});
