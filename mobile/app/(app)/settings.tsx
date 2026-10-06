import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import type { ComponentProps } from 'react';
import { PageShell } from '@/components/PageShell';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { useSelectedMonth } from '@/src/context/SelectedMonthContext';
import { api } from '@/src/lib/api';
import { createThemedStyles, ThemePreference, useAppTheme } from '@/src/theme/ThemeContext';

const THEME_OPTIONS: { id: ThemePreference; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'light', label: 'Claro', icon: 'sunny-outline' },
  { id: 'dark', label: 'Escuro', icon: 'moon-outline' },
  { id: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
];

export default function SettingsScreen() {
  const { theme, preference, setPreference } = useAppTheme();
  const styles = useStyles();
  const { session, signOut } = useAuth();
  const { applyPayday } = useSelectedMonth();
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
      applyPayday(n);
      setMessage('Salvo.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Ajustes" subtitle="Payday, aparência e conta">
      {loading ? <ActivityIndicator color={theme.accentPrimary} style={{ marginVertical: 16 }} /> : null}
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
        placeholderTextColor={theme.textMuted}
      />
      <Pressable style={styles.btn} onPress={savePayday} disabled={saving}>
        {saving ? (
          <ActivityIndicator color={theme.onAccent} />
        ) : (
          <Text style={styles.btnText}>Salvar</Text>
        )}
      </Pressable>

      <View style={styles.divider} />

      <Text style={styles.section}>Aparência</Text>
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {THEME_OPTIONS.map((option) => {
          const active = preference === option.id;
          return (
            <Pressable
              key={option.id}
              style={({ pressed }) => [styles.segment, active && styles.segmentActive, pressed && !active && styles.segmentPressed]}
              onPress={() => {
                if (active) return;
                void Haptics.selectionAsync();
                setPreference(option.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`Tema ${option.label}`}>
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? theme.accentPrimary : theme.textSecondary}
              />
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>Sistema acompanha o modo claro/escuro do celular.</Text>

      <View style={styles.divider} />

      <Text style={styles.section}>Conta</Text>
      <Text style={styles.email}>{session?.user?.email ?? '—'}</Text>
      <Pressable style={styles.outline} onPress={() => signOut()}>
        <Text style={styles.outlineText}>Sair</Text>
      </Pressable>
    </PageShell>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    label: {
      fontFamily: FontFamily.uiMedium,
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: theme.spacingSm,
    },
    input: {
      fontFamily: FontFamily.ui,
      fontSize: 18,
      color: theme.textPrimary,
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      padding: theme.spacingMd,
      marginBottom: theme.spacingMd,
    },
    btn: {
      backgroundColor: theme.accentPrimary,
      borderRadius: theme.radiusMd,
      paddingVertical: theme.spacingMd,
      alignItems: 'center',
      marginBottom: theme.spacingLg,
    },
    btnText: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 16,
      color: theme.onAccent,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: theme.spacingLg,
    },
    section: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 16,
      color: theme.textPrimary,
      marginBottom: theme.spacingSm,
    },
    segmented: {
      flexDirection: 'row',
      gap: theme.spacingXs,
      padding: theme.spacingXs,
      backgroundColor: theme.bgTertiary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    segment: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    segmentActive: {
      backgroundColor: theme.bgSecondary,
      borderColor: theme.border,
    },
    segmentPressed: { opacity: 0.7 },
    segmentText: {
      fontFamily: FontFamily.uiMedium,
      fontSize: 14,
      color: theme.textSecondary,
    },
    segmentTextActive: {
      fontFamily: FontFamily.uiSemiBold,
      color: theme.textPrimary,
    },
    hint: {
      fontFamily: FontFamily.ui,
      fontSize: 12,
      color: theme.textMuted,
      marginTop: theme.spacingSm,
    },
    email: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.textSecondary,
      marginBottom: theme.spacingLg,
    },
    outline: {
      borderWidth: 1,
      borderColor: theme.accentDanger,
      borderRadius: theme.radiusMd,
      paddingVertical: theme.spacingMd,
      alignItems: 'center',
    },
    outlineText: {
      fontFamily: FontFamily.uiSemiBold,
      color: theme.accentDanger,
    },
    err: {
      fontFamily: FontFamily.ui,
      color: theme.accentDanger,
      marginBottom: theme.spacingSm,
    },
    ok: {
      fontFamily: FontFamily.ui,
      color: theme.accentPrimary,
      marginBottom: theme.spacingSm,
    },
  })
);
