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
import { CategoryPicker } from '@/components/CategoryPicker';
import { SheetModal } from '@/components/SheetModal';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import { ensureCategoryExists } from '@/src/lib/ensureCategory';
import { computePlanningMonth } from '@/src/hooks/usePlanningMonth';
import { confirmDestructive, toastMessage } from '@/src/utils/alerts';
import type { BudgetItem, Category, InstallmentMonthView, MonthEntry } from '@/src/types';

const MONTHS = [
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

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

const PAYMENT_METHODS = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function MonthsScreen() {
  const insets = useSafeAreaInsets();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [initDone, setInitDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [installments, setInstallments] = useState<InstallmentMonthView[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, string>>({});
  const [savingBudgets, setSavingBudgets] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MonthEntry | null>(null);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    description: '',
    amount: '',
    date: '',
    category: '',
    paymentMethod: '',
    note: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const settings = await api.settings.get();
        const { year, month } = computePlanningMonth(settings.payday);
        setSelectedYear(year);
        setSelectedMonth(month);
      } catch {
        /* keep defaults */
      } finally {
        setInitDone(true);
      }
    })();
  }, []);

  const loadMonthData = useCallback(async () => {
    if (!initDone) return;
    setLoading(true);
    try {
      const [entriesData, installmentsData, incomeCats, expenseCats, budgetData] = await Promise.all([
        api.months.getEntries(selectedYear, selectedMonth),
        api.installments.getByMonth(selectedYear, selectedMonth),
        api.categories.getAll('income'),
        api.categories.getAll('expense'),
        api.budgets.getByMonth(selectedYear, selectedMonth),
      ]);
      setEntries(entriesData ?? []);
      setInstallments(installmentsData ?? []);
      setIncomeCategories(incomeCats ?? []);
      setExpenseCategories(expenseCats ?? []);
      setBudgetItems(budgetData.budgets ?? []);
      const limits: Record<string, string> = {};
      for (const b of budgetData.budgets ?? []) {
        limits[b.category] = String(b.limit);
      }
      setBudgetLimits(limits);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, initDone]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  async function handleSyncUpsert() {
    try {
      const result = await api.months.syncFixed(selectedYear, selectedMonth, 'upsert');
      toastMessage('Sync concluído', `${result.created} criado(s), ${result.updated} atualizado(s).`);
      loadMonthData();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao sincronizar');
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
      toastMessage('Metas salvas');
      const budgetData = await api.budgets.getByMonth(selectedYear, selectedMonth);
      setBudgetItems(budgetData.budgets ?? []);
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao salvar metas');
    } finally {
      setSavingBudgets(false);
    }
  }

  function openNewEntry() {
    setEditingEntry(null);
    setForm({
      type: 'expense',
      description: '',
      amount: '',
      date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
      category: '',
      paymentMethod: '',
      note: '',
    });
    setShowEntryModal(true);
  }

  function openEdit(entry: MonthEntry) {
    setEditingEntry(entry);
    setForm({
      type: entry.type,
      description: entry.description,
      amount: entry.amount.toString(),
      date: entry.date,
      category: entry.category,
      paymentMethod: entry.paymentMethod || '',
      note: entry.note || '',
    });
    setShowEntryModal(true);
  }

  async function saveEntry() {
    try {
      const amount = parseFloat(form.amount);
      if (Number.isNaN(amount)) {
        toastMessage('Valor inválido');
        return;
      }

      const category = await ensureCategoryExists(
        api,
        form.category,
        form.type,
        formCategories
      );

      const payload = {
        ...form,
        category,
        amount,
        paymentMethod: form.type === 'expense' ? form.paymentMethod || 'PIX' : undefined,
      };

      if (editingEntry) {
        await api.months.updateEntry(editingEntry.id, payload);
      } else {
        await api.months.createEntry({
          ...payload,
          year: selectedYear,
          month: selectedMonth,
        });
      }
      setShowEntryModal(false);
      loadMonthData();
      toastMessage(editingEntry ? 'Atualizado' : 'Criado');
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao salvar');
    }
  }

  async function deleteEntry(id: number) {
    const ok = await confirmDestructive('Excluir lançamento', 'Tem certeza?');
    if (!ok) return;
    try {
      await api.months.deleteEntry(id);
      loadMonthData();
      toastMessage('Excluído');
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : 'Falha ao excluir');
    }
  }

  const incomes = entries.filter((e) => e.type === 'income');
  const expenses = entries.filter((e) => e.type === 'expense');
  const totalIncome = incomes.reduce((s, e) => s + e.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalInstallments = installments.reduce((s, i) => s + i.installmentAmount, 0);
  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    spentByCategory[e.category] = (spentByCategory[e.category] ?? 0) + e.amount;
  }
  const formCategories = form.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + Theme.spacingMd }]}>
      <View style={styles.pageHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Meses</Text>
          <Text style={styles.pageSubtitle}>Lançamentos e metas do mês</Text>
        </View>
        <Pressable style={styles.btnSecondary} onPress={handleSyncUpsert}>
          <Text style={styles.btnSecondaryText}>Sincronizar fixos</Text>
        </Pressable>
      </View>

      <View style={styles.yearRow}>
        <Text style={styles.label}>Ano</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {YEARS.map((y) => (
            <Pressable
              key={y}
              onPress={() => setSelectedYear(y)}
              style={[styles.yearChip, selectedYear === y && styles.yearChipActive]}>
              <Text style={[styles.yearChipText, selectedYear === y && styles.yearChipTextActive]}>{y}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.monthTabs}
        contentContainerStyle={styles.monthTabsContent}>
        {MONTHS.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setSelectedMonth(m.id)}
            style={[styles.tab, selectedMonth === m.id && styles.tabActive]}>
            <Text
              style={[styles.tabText, selectedMonth === m.id && styles.tabTextActive]}
              numberOfLines={2}>
              {m.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Theme.accentPrimary} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.sectionRow}>
            <Text style={styles.h2}>Ganhos</Text>
            <Pressable style={styles.btnPrimarySm} onPress={openNewEntry}>
              <Text style={styles.btnPrimarySmText}>+ Novo</Text>
            </Pressable>
          </View>
          {incomes.length ? (
            incomes.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                tone="income"
                onEdit={() => openEdit(entry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          ) : (
            <Text style={styles.empty}>Nenhum ganho neste mês</Text>
          )}

          <Text style={[styles.h2, { marginTop: Theme.spacingLg }]}>Gastos</Text>
          {expenses.length ? (
            expenses.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                tone="expense"
                onEdit={() => openEdit(entry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))
          ) : (
            <Text style={styles.empty}>Nenhum gasto neste mês</Text>
          )}

          {installments.length > 0 ? (
            <>
              <Text style={[styles.h2, { marginTop: Theme.spacingLg }]}>Parcelas do mês</Text>
              {installments.map((inst) => (
                <View key={inst.id} style={[styles.card, styles.borderWarning]}>
                  <Text style={styles.entryName}>{inst.description}</Text>
                  <Text style={styles.entryMeta}>
                    {inst.card?.name} · {inst.currentMonthInstallment}/{inst.totalInstallments}
                  </Text>
                  <Text style={{ color: Theme.accentWarning, fontFamily: FontFamily.displayBold }}>
                    - {formatBrl(inst.installmentAmount)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={[styles.card, { marginTop: Theme.spacingLg }]}>
            <View style={styles.sectionRow}>
              <Text style={styles.h2}>Metas do mês</Text>
              <Pressable
                style={[styles.btnPrimarySm, savingBudgets && { opacity: 0.6 }]}
                onPress={handleSaveBudgets}
                disabled={savingBudgets}>
                <Text style={styles.btnPrimarySmText}>{savingBudgets ? '...' : 'Salvar metas'}</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Limites por categoria de despesa (80% / 100%)</Text>
            {expenseCategories.map((cat) => {
              const spent = spentByCategory[cat.name] ?? 0;
              const limit = parseFloat(budgetLimits[cat.name] || '0');
              const percent = limit > 0 ? (spent / limit) * 100 : 0;
              const existing = budgetItems.find((b) => b.category === cat.name);
              const derivedStatus =
                limit <= 0 ? 'ok' : percent >= 100 ? 'exceeded' : percent >= 80 ? 'warning' : 'ok';
              const displayStatus = existing?.status ?? derivedStatus;
              const barColor =
                displayStatus === 'exceeded'
                  ? Theme.accentDanger
                  : displayStatus === 'warning'
                    ? Theme.accentWarning
                    : Theme.accentPrimary;

              return (
                <View key={cat.id} style={{ marginBottom: Theme.spacingMd }}>
                  <View style={styles.budgetHeader}>
                    <Text style={styles.entryName}>{cat.name}</Text>
                    <Text style={styles.entryMeta}>
                      {formatBrl(spent)}
                      {limit > 0 ? ` / ${formatBrl(limit)} (${Math.round(percent)}%)` : ''}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder="Limite (R$)"
                    placeholderTextColor={Theme.textMuted}
                    value={budgetLimits[cat.name] ?? ''}
                    onChangeText={(t) => setBudgetLimits({ ...budgetLimits, [cat.name]: t })}
                  />
                  {limit > 0 ? (
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%`, backgroundColor: barColor }]} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <Text style={[styles.h2, { marginTop: Theme.spacingLg }]}>Resumo</Text>
          <View style={styles.card}>
            <Row label="Total ganhos" value={formatBrl(totalIncome)} valueColor={Theme.accentPrimary} />
            <Row label="Total gastos" value={formatBrl(totalExpense)} valueColor={Theme.accentDanger} />
            {installments.length > 0 ? (
              <Row label="Parcelas" value={formatBrl(totalInstallments)} valueColor={Theme.accentWarning} />
            ) : null}
            <Row label="Saldo" value={formatBrl(balance)} valueColor={balance >= 0 ? Theme.accentPrimary : Theme.accentDanger} bold />
            {installments.length > 0 ? (
              <Row
                label="Saldo c/ parcelas"
                value={formatBrl(balance - totalInstallments)}
                valueColor={balance - totalInstallments >= 0 ? Theme.accentPrimary : Theme.accentDanger}
                bold
              />
            ) : null}
          </View>
        </ScrollView>
      )}

      <SheetModal
        visible={showEntryModal}
        title={editingEntry ? 'Editar lançamento' : 'Novo lançamento'}
        onClose={() => setShowEntryModal(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setShowEntryModal(false)}>
              <Text style={styles.btnGhostText}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={saveEntry}>
              <Text style={styles.btnPrimaryText}>Salvar</Text>
            </Pressable>
          </>
        }>
        <Text style={styles.label}>Tipo</Text>
        <View style={styles.rowGap}>
          {(['income', 'expense'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setForm({ ...form, type: t, category: '' })}
              style={[styles.typeChip, form.type === t && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, form.type === t && styles.typeChipTextActive]}>
                {t === 'income' ? 'Ganho' : 'Gasto'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          value={form.description}
          onChangeText={(d) => setForm({ ...form, description: d })}
          placeholder="Ex: Salário, Mercado"
          placeholderTextColor={Theme.textMuted}
        />
        <Text style={styles.label}>Valor</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={form.amount}
          onChangeText={(d) => setForm({ ...form, amount: d })}
        />
        <Text style={styles.label}>Data (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={(d) => setForm({ ...form, date: d })}
          placeholder="2026-05-01"
          placeholderTextColor={Theme.textMuted}
        />
        <Text style={styles.label}>Categoria</Text>
        <CategoryPicker
          key={form.type}
          type={form.type}
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          categories={formCategories}
        />
        {form.type === 'expense' ? (
          <>
            <Text style={[styles.label, { marginTop: Theme.spacingMd }]}>Forma de pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {PAYMENT_METHODS.map((pm) => (
                <Pressable
                  key={pm}
                  onPress={() => setForm({ ...form, paymentMethod: pm })}
                  style={[styles.pmChip, form.paymentMethod === pm && styles.pmChipActive]}>
                  <Text style={[styles.pmChipText, form.paymentMethod === pm && styles.pmChipTextActive]}>{pm}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}
        <Text style={[styles.label, { marginTop: Theme.spacingMd }]}>Observações</Text>
        <TextInput
          style={[styles.input, { minHeight: 72 }]}
          multiline
          value={form.note}
          onChangeText={(d) => setForm({ ...form, note: d })}
        />
      </SheetModal>
    </View>
    </TabScreenTransition>
  );
}

function Row({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: string;
  valueColor: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, bold && { fontFamily: FontFamily.uiSemiBold }]}>{label}</Text>
      <Text style={{ fontFamily: FontFamily.displayBold, color: valueColor }}>{value}</Text>
    </View>
  );
}

function EntryRow({
  entry,
  tone,
  onEdit,
  onDelete,
}: {
  entry: MonthEntry;
  tone: 'income' | 'expense';
  onEdit: () => void;
  onDelete: () => void;
}) {
  const border = tone === 'income' ? Theme.accentPrimary : Theme.accentDanger;
  const amtColor = tone === 'income' ? Theme.accentPrimary : Theme.accentDanger;
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: border }]}>
      <View style={styles.entryTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.entryName}>{entry.description}</Text>
          <Text style={styles.entryMeta}>
            {entry.category} · {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
            {entry.paymentMethod ? ` · ${entry.paymentMethod}` : ''}
            {entry.isFixed ? ' · (Fixo)' : ''}
          </Text>
        </View>
        <Text style={{ fontFamily: FontFamily.displayBold, color: amtColor }}>
          {tone === 'income' ? '+' : '-'} {formatBrl(entry.amount)}
        </Text>
      </View>
      <View style={styles.entryActions}>
        <Pressable onPress={onEdit}>
          <Text style={styles.linkBtn}>Editar</Text>
        </Pressable>
        <Pressable onPress={onDelete}>
          <Text style={[styles.linkBtn, { color: Theme.accentDanger }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.bgPrimary, paddingHorizontal: Theme.spacingLg },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Theme.spacingMd, gap: Theme.spacingSm },
  pageTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: Theme.textPrimary },
  pageSubtitle: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.textSecondary, marginTop: 4 },
  btnSecondary: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    paddingHorizontal: Theme.spacingSm,
    paddingVertical: Theme.spacingSm,
    alignSelf: 'flex-start',
  },
  btnSecondaryText: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textSecondary },
  yearRow: { marginBottom: Theme.spacingSm },
  label: { fontFamily: FontFamily.uiMedium, fontSize: 13, color: Theme.textSecondary, marginBottom: 6 },
  yearChip: {
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgTertiary,
    marginRight: Theme.spacingSm,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  yearChipActive: { borderColor: Theme.accentPrimary, backgroundColor: Theme.bgSecondary },
  yearChipText: { fontFamily: FontFamily.ui, color: Theme.textSecondary },
  yearChipTextActive: { color: Theme.accentPrimary },
  monthTabs: { marginBottom: Theme.spacingMd },
  monthTabsContent: {
    alignItems: 'center',
    paddingVertical: Theme.spacingXs,
  },
  tab: {
    minHeight: 48,
    minWidth: 80,
    maxWidth: 104,
    paddingHorizontal: Theme.spacingSm,
    paddingVertical: Theme.spacingSm,
    marginRight: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgTertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Theme.bgSecondary, borderWidth: 1, borderColor: Theme.accentPrimary },
  tabText: {
    fontFamily: FontFamily.ui,
    color: Theme.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabTextActive: { color: Theme.accentPrimary },
  scroll: { paddingBottom: Theme.spacingXl * 3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacingSm },
  h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 17, color: Theme.textPrimary },
  btnPrimarySm: {
    backgroundColor: Theme.accentPrimary,
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
  },
  btnPrimarySmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: Theme.bgPrimary },
  card: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingSm,
  },
  borderWarning: { borderLeftWidth: 4, borderLeftColor: Theme.accentWarning },
  entryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.spacingSm },
  entryName: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: Theme.textPrimary },
  entryMeta: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted, marginTop: 4 },
  entryActions: { flexDirection: 'row', gap: Theme.spacingLg, marginTop: Theme.spacingSm },
  linkBtn: { fontFamily: FontFamily.ui, fontSize: 14, color: Theme.accentPrimary },
  empty: { fontFamily: FontFamily.ui, color: Theme.textMuted, marginBottom: Theme.spacingMd },
  hint: { fontFamily: FontFamily.ui, fontSize: 12, color: Theme.textMuted, marginBottom: Theme.spacingMd },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 },
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
  progressTrack: {
    height: 6,
    backgroundColor: Theme.bgTertiary,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Theme.spacingSm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  summaryLabel: { fontFamily: FontFamily.ui, color: Theme.textSecondary },
  rowGap: { flexDirection: 'row', gap: Theme.spacingSm, marginBottom: Theme.spacingMd },
  typeChip: {
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  typeChipActive: { borderColor: Theme.accentPrimary, backgroundColor: Theme.bgTertiary },
  typeChipText: { fontFamily: FontFamily.ui, color: Theme.textSecondary },
  typeChipTextActive: { color: Theme.accentPrimary },
  catListBox: {
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.bgTertiary,
    marginBottom: Theme.spacingSm,
    overflow: 'hidden',
  },
  catRow: { paddingVertical: Theme.spacingSm, paddingHorizontal: Theme.spacingSm, borderBottomWidth: 1, borderBottomColor: Theme.border },
  catRowActive: { backgroundColor: Theme.bgTertiary },
  catRowText: { fontFamily: FontFamily.ui, color: Theme.textPrimary },
  pmChip: {
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    marginRight: Theme.spacingSm,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  pmChipActive: { borderColor: Theme.accentPrimary },
  pmChipText: { fontFamily: FontFamily.ui, fontSize: 13, color: Theme.textSecondary },
  pmChipTextActive: { color: Theme.accentPrimary },
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
