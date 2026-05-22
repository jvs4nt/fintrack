import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { PageShell } from '@/components/PageShell';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { SixMonthBars } from '@/components/SixMonthBars';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import { computePlanningMonth } from '@/src/hooks/usePlanningMonth';
import type { DashboardSummary, MonthEntry } from '@/src/types';

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [labelYm, setLabelYm] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await api.settings.get();
      const { year, month } = computePlanningMonth(settings.payday);
      setLabelYm(
        new Date(year, month - 1).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        })
      );
      const data = await api.dashboard.getSummary(year, month);
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading && !summary) {
    return (
      <TabScreenTransition>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Theme.accentPrimary} />
        </View>
      </TabScreenTransition>
    );
  }

  if (error && !summary) {
    return (
      <PageShell title="Dashboard" subtitle="Visão geral do mês">
        <Text style={styles.err}>Erro: {error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </PageShell>
    );
  }

  if (!summary) return null;

  const dash = summary;
  const { summary: s, nextDueCard, lastEntries, sixMonthsData, monthInstallments } = dash;

  return (
    <PageShell
      title="Dashboard"
      subtitle={labelYm}
      headerRight={
        <Pressable
          style={[styles.headerRefresh, loading && styles.headerRefreshDisabled]}
          onPress={() => void load()}
          disabled={loading}
          hitSlop={8}>
          {loading ? (
            <ActivityIndicator size="small" color={Theme.accentPrimary} />
          ) : (
            <Text style={styles.headerRefreshText}>Atualizar</Text>
          )}
        </Pressable>
      }>
      <View
        style={[
          styles.card,
          styles.cardHighlight,
          { borderLeftColor: s.netBalance >= 0 ? Theme.accentPrimary : Theme.accentDanger },
        ]}>
        <Text style={styles.statLabel}>Saldo líquido do mês (c/ parcelas)</Text>
        <Text style={[styles.heroValue, { color: s.netBalance >= 0 ? Theme.accentPrimary : Theme.accentDanger }]}>
          {formatBrl(s.netBalance)}
        </Text>
        <Text style={styles.muted}>
          Ganhos {formatBrl(s.totalIncome)} · Gastos {formatBrl(s.totalExpense)} · Parcelas{' '}
          {formatBrl(s.totalInstallments)}
        </Text>
      </View>

      <View style={styles.grid}>
        <StatMini label="Total ganhos" value={formatBrl(s.totalIncome)} color={Theme.accentPrimary} />
        <StatMini label="Total gastos" value={formatBrl(s.totalExpense)} color={Theme.accentDanger} />
        <StatMini
          label="Saldo"
          value={formatBrl(s.balance)}
          color={s.balance >= 0 ? Theme.accentPrimary : Theme.accentDanger}
        />
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Próximo vencimento</Text>
          {nextDueCard ? (
            <>
              <Text style={styles.statMid}>{nextDueCard.name}</Text>
              <Text style={[styles.muted, nextDueCard.daysUntilDue <= 5 && { color: Theme.accentDanger }]}>
                {nextDueCard.daysUntilDue <= 5 ? `⚠ ${nextDueCard.daysUntilDue} dias` : `${nextDueCard.daysUntilDue} dias`}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>Sem cartões</Text>
          )}
        </View>
      </View>

      {monthInstallments.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Parcelas do mês</Text>
          <View style={styles.tableCard}>
            {monthInstallments.map((inst) => (
              <View key={inst.id} style={styles.tableRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cellMain}>{inst.description}</Text>
                  <Text style={styles.muted}>
                    {inst.card?.name ?? '—'} · {inst.currentMonthInstallment}/{inst.totalInstallments}
                  </Text>
                </View>
                <Text style={{ fontFamily: FontFamily.displayBold, color: Theme.accentWarning }}>
                  {formatBrl(inst.installmentAmount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.sectionTitle}>Ganhos vs gastos (6 meses)</Text>
      <SixMonthBars data={sixMonthsData} />

      <Text style={styles.sectionTitle}>Últimos lançamentos</Text>
      <View style={styles.tableCard}>
        {lastEntries.length ? (
          lastEntries.map((entry: MonthEntry) => (
            <View key={entry.id} style={styles.tableRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cellMain}>
                  {entry.description}
                  {entry.isFixed ? <Text style={styles.fixTag}> (Fixo)</Text> : null}
                </Text>
                <Text style={styles.muted}>{entry.category}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.muted}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}</Text>
                <Text
                  style={{
                    fontFamily: FontFamily.displayBold,
                    color: entry.type === 'income' ? Theme.accentPrimary : Theme.accentDanger,
                  }}>
                  {entry.type === 'income' ? '+' : '-'} {formatBrl(entry.amount)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.muted}>Nenhum lançamento neste mês</Text>
        )}
      </View>
    </PageShell>
  );
}

function StatMini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statMid, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.bgPrimary,
  },
  err: {
    fontFamily: FontFamily.ui,
    color: Theme.accentDanger,
    marginBottom: Theme.spacingMd,
  },
  retry: {
    alignSelf: 'flex-start',
    marginTop: Theme.spacingMd,
    paddingVertical: Theme.spacingSm,
    paddingHorizontal: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.accentPrimary,
  },
  retryText: { fontFamily: FontFamily.uiSemiBold, color: Theme.accentPrimary },
  headerRefresh: {
    paddingVertical: Theme.spacingSm,
    paddingHorizontal: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.accentPrimary,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRefreshDisabled: { opacity: 0.65 },
  headerRefreshText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: Theme.accentPrimary },
  card: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingLg,
    marginBottom: Theme.spacingLg,
  },
  cardHighlight: { borderLeftWidth: 4 },
  statLabel: {
    fontFamily: FontFamily.ui,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  heroValue: {
    fontFamily: FontFamily.displayBold,
    fontSize: 30,
    marginVertical: Theme.spacingSm,
  },
  muted: {
    fontFamily: FontFamily.ui,
    fontSize: 12,
    color: Theme.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacingSm,
    marginBottom: Theme.spacingLg,
  },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingMd,
    minWidth: 140,
  },
  statMid: { fontFamily: FontFamily.displayBold, fontSize: 16, marginTop: 6, color: Theme.textPrimary },
  sectionTitle: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 16,
    color: Theme.textPrimary,
    marginBottom: Theme.spacingSm,
    marginTop: Theme.spacingSm,
  },
  tableCard: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingMd,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Theme.spacingSm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  cellMain: { fontFamily: FontFamily.uiSemiBold, fontSize: 14, color: Theme.textPrimary },
  fixTag: { fontFamily: FontFamily.ui, fontSize: 11, color: Theme.textSecondary },
});
