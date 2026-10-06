import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import { api } from '@/src/lib/api';
import type { AgentChatResponse, AgentPendingAction } from '@/src/types';

type Row = { role: 'user' | 'assistant'; text: string };

export default function AgentScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, setPending] = useState<AgentPendingAction | null>(null);
  const [loading, setLoading] = useState(false);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setRows((r) => [...r, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res: AgentChatResponse = await api.agent.chat(msg, pending);
      setRows((r) => [...r, { role: 'assistant', text: res.message }]);
      setPending(res.pendingAction ?? null);
    } catch (e) {
      setRows((r) => [
        ...r,
        { role: 'assistant', text: e instanceof Error ? e.message : 'Erro ao falar com o agente' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <TabScreenTransition>
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + theme.spacingMd, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Agente</Text>
        <Text style={styles.subtitle}>Assistente rule-based (POST /api/agent/chat)</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.bubbleUser : styles.bubbleBot,
            ]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Ex.: &quot;gastei 45 no mercado hoje&quot; ou &quot;resumo do mês&quot;</Text>
        }
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Sua mensagem..."
          placeholderTextColor={theme.textMuted}
          editable={!loading}
          onSubmitEditing={() => send()}
        />
        <Pressable style={styles.send} onPress={() => send()} disabled={loading}>
          {loading ? <ActivityIndicator color={theme.onAccent} /> : <Text style={styles.sendText}>Enviar</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </TabScreenTransition>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgPrimary,
      paddingHorizontal: theme.spacingLg,
    },
    header: {
      marginBottom: theme.spacingMd,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 26,
      color: theme.textPrimary,
      marginBottom: theme.spacingSm,
    },
    subtitle: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.textSecondary,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: theme.spacingMd,
    },
    bubble: {
      padding: theme.spacingMd,
      borderRadius: theme.radiusMd,
      marginBottom: theme.spacingSm,
      maxWidth: '92%',
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bubbleBot: {
      alignSelf: 'flex-start',
      backgroundColor: theme.bgSecondary,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    bubbleText: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.textPrimary,
    },
    empty: {
      fontFamily: FontFamily.ui,
      fontSize: 14,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacingSm,
      marginTop: theme.spacingSm,
    },
    input: {
      flex: 1,
      fontFamily: FontFamily.ui,
      fontSize: 16,
      color: theme.textPrimary,
      backgroundColor: theme.bgTertiary,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm + 4,
    },
    send: {
      backgroundColor: theme.accentPrimary,
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingMd,
      borderRadius: theme.radiusMd,
      minWidth: 88,
      alignItems: 'center',
    },
    sendText: {
      fontFamily: FontFamily.uiSemiBold,
      color: theme.onAccent,
    },
  })
);
