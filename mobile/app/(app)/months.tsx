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
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import { FEATURE_PAYMENTS } from '@/src/config/features';
import { useSelectedMonth } from '@/src/context/SelectedMonthContext';
import { api } from '@/src/lib/api';
import { ensureCategoryExists } from '@/src/lib/ensureCategory';
import { YEARS } from '@/src/lib/yearMonth';
import { confirmDestructive, toastMessage } from '@/src/utils/alerts';
import type { Category, InstallmentMonthView, MonthEntry } from '@/src/types';

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

const PAYMENT_METHODS = ['PIX', 'Débito', 'Crédito', 'Dinheiro', 'Boleto', 'Transferência'];

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function MonthsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { selected, setSelected, ready } = useSelectedMonth();
  const { year: selectedYear, month: selectedMonth } = selected;
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [installments, setInstallments] = useState<InstallmentMonthView[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
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

  const loadMonthData = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    try {
      const [entriesData, installmentsData, incomeCats, expenseCats] = await Promise.all([
        api.months.getEntries(selectedYear, selectedMonth),
        FEATURE_PAYMENTS
          ? api.installments.getByMonth(selectedYear, selectedMonth)
          : Promise.resolve([]),
        api.categories.getAll('income'),
        api.categories.getAll('expense'),
      ]);
      setEntries(entriesData ?? []);
      setInstallments(installmentsData ?? []);
      setIncomeCategories(incomeCats ?? []);
      setExpenseCategories(expenseCats ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth, ready]);

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
        paymentMethod:
          form.type === 'expense'
            ? form.paymentMethod || (FEATURE_PAYMENTS ? 'PIX' : undefined)
            : undefined,
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
  const formCategories = form.type === 'income' ? incomeCategories : expenseCategories;

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + theme.spacingMd }]}>
      <View style={styles.chrome}>
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Meses</Text>
            <Text style={styles.pageSubtitle}>Lançamentos do mês</Text>
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
                onPress={() => setSelected({ year: y, month: selectedMonth })}
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
              onPress={() => setSelected({ year: selectedYear, month: m.id })}
              style={[styles.tab, selectedMonth === m.id && styles.tabActive]}>
              <Text
                style={[styles.tabText, selectedMonth === m.id && styles.tabTextActive]}
                numberOfLines={2}>
                {m.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.contentArea}>
        {loading ? (
          <ActivityIndicator style={styles.loadingSpinner} color={theme.accentPrimary} />
        ) : (
          <ScrollView style={styles.contentScroll} contentContainerStyle={styles.scroll}>
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

          <Text style={[styles.h2, styles.sectionHeading]}>Gastos</Text>
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
              <Text style={[styles.h2, styles.sectionHeading]}>Parcelas do mês</Text>
              {installments.map((inst) => (
                <View key={inst.id} style={[styles.card, styles.borderWarning]}>
                  <Text style={styles.entryName}>{inst.description}</Text>
                  <Text style={styles.entryMeta}>
                    {inst.card?.name} · {inst.currentMonthInstallment}/{inst.totalInstallments}
                  </Text>
                  <Text style={{ color: theme.accentWarning, fontFamily: FontFamily.displayBold }}>
                    - {formatBrl(inst.installmentAmount)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <Text style={[styles.h2, styles.sectionHeading]}>Resumo</Text>
          <View style={styles.card}>
            <Row label="Total ganhos" value={formatBrl(totalIncome)} valueColor={theme.accentPrimary} />
            <Row label="Total gastos" value={formatBrl(totalExpense)} valueColor={theme.accentDanger} />
            {installments.length > 0 ? (
              <Row label="Parcelas" value={formatBrl(totalInstallments)} valueColor={theme.accentWarning} />
            ) : null}
            <Row label="Saldo" value={formatBrl(balance)} valueColor={balance >= 0 ? theme.accentPrimary : theme.accentDanger} bold />
            {installments.length > 0 ? (
              <Row
                label="Saldo c/ parcelas"
                value={formatBrl(balance - totalInstallments)}
                valueColor={balance - totalInstallments >= 0 ? theme.accentPrimary : theme.accentDanger}
                bold
              />
            ) : null}
          </View>
          </ScrollView>
        )}
      </View>

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
          placeholderTextColor={theme.textMuted}
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
          placeholderTextColor={theme.textMuted}
        />
        <Text style={styles.label}>Categoria</Text>
        <CategoryPicker
          key={form.type}
          type={form.type}
          value={form.category}
          onChange={(category) => setForm({ ...form, category })}
          categories={formCategories}
        />
        {FEATURE_PAYMENTS && form.type === 'expense' ? (
          <>
            <Text style={[styles.label, { marginTop: theme.spacingMd }]}>Forma de pagamento</Text>
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
        <Text style={[styles.label, { marginTop: theme.spacingMd }]}>Observações</Text>
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
  const styles = useStyles();
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
  const theme = useTheme();
  const styles = useStyles();
  const border = tone === 'income' ? theme.accentPrimary : theme.accentDanger;
  const amtColor = tone === 'income' ? theme.accentPrimary : theme.accentDanger;
  return (
    <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: border }]}>
      <View style={styles.entryTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.entryName}>{entry.description}</Text>
          <Text style={styles.entryMeta}>
            {entry.category} · {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
            {FEATURE_PAYMENTS && entry.paymentMethod ? ` · ${entry.paymentMethod}` : ''}
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
          <Text style={[styles.linkBtn, { color: theme.accentDanger }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgPrimary, paddingHorizontal: theme.spacingLg },
    chrome: { flexShrink: 0 },
    contentArea: { flex: 1, justifyContent: 'flex-start' },
    contentScroll: { flex: 1 },
    loadingSpinner: { alignSelf: 'flex-start', marginTop: theme.spacingMd },
    pageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: theme.spacingMd, gap: theme.spacingSm },
    pageTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: theme.textPrimary },
    pageSubtitle: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.textSecondary, marginTop: 4 },
    btnSecondary: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      paddingHorizontal: theme.spacingSm,
      paddingVertical: theme.spacingSm,
      alignSelf: 'flex-start',
    },
    btnSecondaryText: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textSecondary },
    yearRow: { marginBottom: theme.spacingSm },
    label: { fontFamily: FontFamily.uiMedium, fontSize: 13, color: theme.textSecondary, marginBottom: 6 },
    yearChip: {
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      borderRadius: theme.radiusMd,
      backgroundColor: theme.bgTertiary,
      marginRight: theme.spacingSm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    yearChipActive: { borderColor: theme.accentPrimary, backgroundColor: theme.bgSecondary },
    yearChipText: { fontFamily: FontFamily.ui, color: theme.textSecondary },
    yearChipTextActive: { color: theme.accentPrimary },
    monthTabs: { marginBottom: theme.spacingMd, flexGrow: 0 },
    monthTabsContent: {
      alignItems: 'flex-start',
      paddingVertical: theme.spacingXs,
    },
    tab: {
      minHeight: 48,
      minWidth: 80,
      maxWidth: 104,
      paddingHorizontal: theme.spacingSm,
      paddingVertical: theme.spacingSm,
      marginRight: theme.spacingSm,
      borderRadius: theme.radiusMd,
      backgroundColor: theme.bgTertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tabActive: { backgroundColor: theme.bgSecondary, borderWidth: 1, borderColor: theme.accentPrimary },
    tabText: {
      fontFamily: FontFamily.ui,
      color: theme.textSecondary,
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
      includeFontPadding: false,
    },
    tabTextActive: { color: theme.accentPrimary },
    scroll: { paddingBottom: theme.spacingXl * 3 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacingSm },
    sectionHeading: { marginTop: theme.spacingLg, marginBottom: theme.spacingSm },
    h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 17, color: theme.textPrimary },
    btnPrimarySm: {
      backgroundColor: theme.accentPrimary,
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      borderRadius: theme.radiusMd,
    },
    btnPrimarySmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: theme.onAccent },
    card: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingMd,
      marginBottom: theme.spacingSm,
    },
    borderWarning: { borderLeftWidth: 4, borderLeftColor: theme.accentWarning },
    entryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacingSm },
    entryName: { fontFamily: FontFamily.uiSemiBold, fontSize: 15, color: theme.textPrimary },
    entryMeta: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted, marginTop: 4 },
    entryActions: { flexDirection: 'row', gap: theme.spacingLg, marginTop: theme.spacingSm },
    linkBtn: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.accentPrimary },
    empty: { fontFamily: FontFamily.ui, color: theme.textMuted, marginBottom: theme.spacingMd },
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
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacingSm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    summaryLabel: { fontFamily: FontFamily.ui, color: theme.textSecondary },
    rowGap: { flexDirection: 'row', gap: theme.spacingSm, marginBottom: theme.spacingMd },
    typeChip: {
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeChipActive: { borderColor: theme.accentPrimary, backgroundColor: theme.bgTertiary },
    typeChipText: { fontFamily: FontFamily.ui, color: theme.textSecondary },
    typeChipTextActive: { color: theme.accentPrimary },
    catListBox: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      backgroundColor: theme.bgTertiary,
      marginBottom: theme.spacingSm,
      overflow: 'hidden',
    },
    catRow: { paddingVertical: theme.spacingSm, paddingHorizontal: theme.spacingSm, borderBottomWidth: 1, borderBottomColor: theme.border },
    catRowActive: { backgroundColor: theme.bgTertiary },
    catRowText: { fontFamily: FontFamily.ui, color: theme.textPrimary },
    pmChip: {
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      marginRight: theme.spacingSm,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pmChipActive: { borderColor: theme.accentPrimary },
    pmChipText: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textSecondary },
    pmChipTextActive: { color: theme.accentPrimary },
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
