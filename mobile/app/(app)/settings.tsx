import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PageShell } from '@/components/PageShell';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { api } from '@/src/lib/api';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();
  const [payday, setPayday] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await api.settings.get();
      setPayday(String(s.payday));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function savePayday() {
    const n = parseInt(payday, 10);
    if (Number.isNaN(n) || n < 1 || n > 31) {
      setError('Dia de pagamento deve ser entre 1 e 31');
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.settings.update(n);
      setMessage('Salvo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Ajustes" subtitle="Dia de pagamento (payday) e conta">
      {loading ? <ActivityIndicator color={Theme.accentPrimary} style={{ marginVertical: 16 }} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <Text style={styles.label}>Dia de receber (1–31)</Text>
      <TextInput
        style={styles.input}
        value={payday}
        onChangeText={setPayday}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="ex: 10"
        placeholderTextColor={Theme.textMuted}
      />
      <Pressable style={styles.btn} onPress={savePayday} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={Theme.bgPrimary} />
        ) : (
          <Text style={styles.btnText}>Salvar</Text>
        )}
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.section}>Conta</Text>
      <Text style={styles.email}>{session?.user?.email ?? '—'}</Text>
      <Pressable style={styles.outline} onPress={() => signOut()}>
        <Text style={styles.outlineText}>Sair</Text>
      </Pressable>
    </PageShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: FontFamily.uiMedium,
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: Theme.spacingSm,
  },
  input: {
    fontFamily: FontFamily.ui,
    fontSize: 18,
    color: Theme.textPrimary,
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingMd,
  },
  btn: {
    backgroundColor: Theme.accentPrimary,
    borderRadius: Theme.radiusMd,
    paddingVertical: Theme.spacingMd,
    alignItems: 'center',
    marginBottom: Theme.spacingLg,
  },
  btnText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 16,
    color: Theme.bgPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: Theme.spacingLg,
  },
  section: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 16,
    color: Theme.textPrimary,
    marginBottom: Theme.spacingSm,
  },
  email: {
    fontFamily: FontFamily.ui,
    fontSize: 15,
    color: Theme.textSecondary,
    marginBottom: Theme.spacingLg,
  },
  outline: {
    borderWidth: 1,
    borderColor: Theme.accentDanger,
    borderRadius: Theme.radiusMd,
    paddingVertical: Theme.spacingMd,
    alignItems: 'center',
  },
  outlineText: {
    fontFamily: FontFamily.uiSemiBold,
    color: Theme.accentDanger,
  },
  err: {
    fontFamily: FontFamily.ui,
    color: Theme.accentDanger,
    marginBottom: Theme.spacingSm,
  },
  ok: {
    fontFamily: FontFamily.ui,
    color: Theme.accentPrimary,
    marginBottom: Theme.spacingSm,
  },
});
