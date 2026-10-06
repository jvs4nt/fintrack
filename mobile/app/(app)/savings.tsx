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
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import { confirmDestructive, toastMessage } from '@/src/utils/alerts';
import type { Saving } from '@/src/types';

const SAVING_TYPES: Record<string, { label: string; color: string }> = {
  poupanca: { label: 'Poupança', color: '#00e5a0' },
  cdb: { label: 'CDB', color: '#00bcd4' },
  tesouro: { label: 'Tesouro Direto', color: '#ff9800' },
  acoes: { label: 'Ações', color: '#9c27b0' },
  fiis: { label: 'FIIs', color: '#e91e63' },
  cripto: { label: 'Criptomoedas', color: '#ffc107' },
  outros: { label: 'Outros', color: '#7a7a9a' },
};

type SavingWithHistory = Saving & {
  history?: { amount: number; date: string }[];
};

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export default function SavingsScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [savings, setSavings] = useState<SavingWithHistory[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [selected, setSelected] = useState<SavingWithHistory | null>(null);
  const [form, setForm] = useState({ name: '', institution: '', type: 'poupanca', amount: '' });
  const [updateAmount, setUpdateAmount] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.savings.getAll();
      setSavings((data ?? []) as SavingWithHistory[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = savings.reduce((s, x) => s + x.amount, 0);
  const distribution = savings.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + s.amount;
    return acc;
  }, {});

  async function handleCreate() {
    try {
      await api.savings.create({
        name: form.name,
        institution: form.institution,
        type: form.type,
        amount: parseFloat(form.amount),
      });
      setShowCreate(false);
      setForm({ name: '', institution: '', type: 'poupanca', amount: '' });
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function handleUpdateAmount() {
    if (!selected) return;
    try {
      await api.savings.updateAmount(selected.id, parseFloat(updateAmount));
      setShowUpdate(false);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  async function handleDelete(id: number) {
    const ok = await confirmDestructive('Excluir reserva', 'Tem certeza?');
    if (!ok) return;
    try {
      await api.savings.delete(id);
      load();
    } catch (e) {
      toastMessage('Erro', e instanceof Error ? e.message : '');
    }
  }

  const entries = Object.entries(distribution).filter(([, v]) => v > 0);

  return (
    <TabScreenTransition>
    <View style={[styles.root, { paddingTop: insets.top + theme.spacingMd }]}>
      <Text style={styles.title}>Reservas</Text>
      <Text style={styles.sub}>Patrimônio guardado</Text>

      <View style={[styles.hero, { borderLeftColor: theme.accentPrimary }]}>
        <Text style={styles.heroLabel}>Patrimônio total</Text>
        <Text style={styles.heroValue}>{formatBrl(total)}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.accentPrimary} style={{ marginTop: 24 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.h2}>Minhas reservas</Text>
            <Pressable style={styles.btnSm} onPress={() => setShowCreate(true)}>
              <Text style={styles.btnSmText}>+ Nova</Text>
            </Pressable>
          </View>

          {savings.map((s) => {
            const ti = SAVING_TYPES[s.type] || SAVING_TYPES.outros;
            return (
              <View key={s.id} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.cardName}>{s.name}</Text>
                    <Text style={[styles.typeLabel, { color: ti.color }]}>{ti.label}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable onPress={() => { setSelected(s); setUpdateAmount(String(s.amount)); setShowUpdate(true); }}>
                      <Text style={styles.link}>Valor</Text>
                    </Pressable>
                    <Pressable onPress={() => handleDelete(s.id)}>
                      <Text style={[styles.link, { color: theme.accentDanger }]}>Excluir</Text>
                    </Pressable>
                  </View>
                </View>
                <Text style={styles.inst}>{s.institution}</Text>
                <Text style={styles.amt}>{formatBrl(s.amount)}</Text>
                {s.history && s.history.length > 0 ? (
                  <View style={styles.hist}>
                    <Text style={styles.histTitle}>Últimas atualizações</Text>
                    {s.history.slice(0, 5).map((h, i) => (
                      <View key={i} style={styles.histRow}>
                        <Text style={styles.histDate}>{new Date(h.date).toLocaleDateString('pt-BR')}</Text>
                        <Text style={styles.histAmt}>{formatBrl(h.amount)}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
          {!savings.length ? <Text style={styles.empty}>Nenhuma reserva</Text> : null}

          {savings.length > 0 && entries.length > 0 ? (
            <>
              <Text style={[styles.h2, { marginTop: theme.spacingLg }]}>Distribuição por tipo</Text>
              {entries.map(([type, amount]) => {
                const ti = SAVING_TYPES[type] || SAVING_TYPES.outros;
                const pct = total > 0 ? (amount / total) * 100 : 0;
                return (
                  <View key={type} style={{ marginBottom: theme.spacingMd }}>
                    <View style={styles.distHeader}>
                      <Text style={styles.legendText}>{ti.label}</Text>
                      <Text style={styles.legendPct}>{pct.toFixed(1)}% · {formatBrl(amount)}</Text>
                    </View>
                    <View style={styles.distTrack}>
                      <View style={[styles.distFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: ti.color }]} />
                    </View>
                  </View>
                );
              })}
            </>
          ) : null}
        </ScrollView>
      )}

      <SheetModal
        visible={showCreate}
        title="Nova reserva"
        onClose={() => setShowCreate(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setShowCreate(false)}>
              <Text style={styles.muted}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnSm} onPress={handleCreate}>
              <Text style={styles.btnSmText}>Salvar</Text>
            </Pressable>
          </>
        }>
        <Text style={styles.label}>Nome</Text>
        <TextInput style={styles.input} value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
        <Text style={styles.label}>Instituição</Text>
        <TextInput style={styles.input} value={form.institution} onChangeText={(t) => setForm({ ...form, institution: t })} />
        <Text style={styles.label}>Tipo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.entries(SAVING_TYPES).map(([key, v]) => (
            <Pressable
              key={key}
              style={[styles.typeChip, form.type === key && styles.typeChipActive]}
              onPress={() => setForm({ ...form, type: key })}>
              <Text style={[styles.typeChipText, form.type === key && { color: theme.accentPrimary }]}>{v.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.label}>Valor inicial</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={form.amount} onChangeText={(t) => setForm({ ...form, amount: t })} />
      </SheetModal>

      <SheetModal
        visible={showUpdate}
        title={selected ? `Atualizar · ${selected.name}` : ''}
        onClose={() => setShowUpdate(false)}
        footer={
          <>
            <Pressable style={styles.btnGhost} onPress={() => setShowUpdate(false)}>
              <Text style={styles.muted}>Cancelar</Text>
            </Pressable>
            <Pressable style={styles.btnSm} onPress={handleUpdateAmount}>
              <Text style={styles.btnSmText}>Atualizar</Text>
            </Pressable>
          </>
        }>
        {selected ? (
          <>
            <Text style={styles.label}>Valor atual</Text>
            <Text style={styles.bigAmt}>{formatBrl(selected.amount)}</Text>
            <Text style={styles.label}>Novo valor</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={updateAmount} onChangeText={setUpdateAmount} />
            <Text style={styles.hint}>Registrado no histórico.</Text>
          </>
        ) : null}
      </SheetModal>
    </View>
    </TabScreenTransition>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bgPrimary, paddingHorizontal: theme.spacingLg },
    title: { fontFamily: FontFamily.uiSemiBold, fontSize: 26, color: theme.textPrimary },
    sub: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.textSecondary, marginTop: 4 },
    hero: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
      padding: theme.spacingLg,
      marginTop: theme.spacingMd,
      marginBottom: theme.spacingMd,
    },
    heroLabel: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.textSecondary },
    heroValue: { fontFamily: FontFamily.displayBold, fontSize: 32, color: theme.accentPrimary, marginTop: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacingSm },
    h2: { fontFamily: FontFamily.uiSemiBold, fontSize: 17, color: theme.textPrimary },
    btnSm: { backgroundColor: theme.accentPrimary, paddingHorizontal: theme.spacingMd, paddingVertical: theme.spacingSm, borderRadius: theme.radiusMd },
    btnSmText: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: theme.onAccent },
    card: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingLg,
      marginBottom: theme.spacingMd,
    },
    cardName: { fontFamily: FontFamily.uiSemiBold, fontSize: 16, color: theme.textPrimary },
    typeLabel: { fontFamily: FontFamily.ui, fontSize: 13, marginTop: 4 },
    inst: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textMuted, marginTop: 8 },
    amt: { fontFamily: FontFamily.displayBold, fontSize: 22, color: theme.accentPrimary, marginTop: 8 },
    hist: { marginTop: theme.spacingMd, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: theme.spacingSm },
    histTitle: { fontFamily: FontFamily.uiSemiBold, fontSize: 13, color: theme.textSecondary, marginBottom: 6 },
    histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    histDate: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted },
    histAmt: { fontFamily: FontFamily.displayBold, fontSize: 12, color: theme.textPrimary },
    empty: { fontFamily: FontFamily.ui, color: theme.textMuted },
    distHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    legendText: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.textPrimary },
    legendPct: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted },
    distTrack: { height: 8, backgroundColor: theme.bgTertiary, borderRadius: 4, overflow: 'hidden' },
    distFill: { height: 8, borderRadius: 4 },
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
    typeChip: {
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm,
      marginRight: theme.spacingSm,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeChipActive: { borderColor: theme.accentPrimary },
    typeChipText: { fontFamily: FontFamily.ui, fontSize: 13, color: theme.textSecondary },
    bigAmt: { fontFamily: FontFamily.displayBold, fontSize: 24, color: theme.accentPrimary, marginBottom: theme.spacingMd },
    hint: { fontFamily: FontFamily.ui, fontSize: 12, color: theme.textMuted, marginTop: 8 },
    link: { fontFamily: FontFamily.ui, fontSize: 14, color: theme.accentPrimary },
    btnGhost: { paddingHorizontal: theme.spacingLg, paddingVertical: theme.spacingMd },
    muted: { fontFamily: FontFamily.ui, color: theme.textMuted },
  })
);
