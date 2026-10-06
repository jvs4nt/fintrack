import { useState } from 'react';
import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';

type LoginMode = 'signin' | 'signup' | 'magic';

const logoSource = require('../../assets/images/fintrack-logo.png');

export default function LoginScreen() {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { session, signInWithPassword, signUp, signInWithMagicLink } = useAuth();
  const [mode, setMode] = useState<LoginMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    return <Redirect href="/(app)" />;
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setConfirmPassword('');
    setError(null);
    setMessage(null);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email);
        setMessage('Enviamos um link de acesso para seu e-mail.');
        return;
      }
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
          return;
        }
        await signUp(email, password);
        setMessage('Conta criada. Confirme o e-mail se solicitado, ou faça login.');
        setConfirmPassword('');
        setMode('signin');
        return;
      }
      await signInWithPassword(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + theme.spacingLg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Image source={logoSource} style={styles.logoImage} accessibilityLabel="FinTrack" />
            <Text style={styles.logoText}>
              Fin<Text style={styles.logoSuffix}>Track</Text>
            </Text>
          </View>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Criar conta' : mode === 'magic' ? 'Link por e-mail' : 'Entrar'}
          </Text>
          <Text style={styles.subtitle}>Sincronize seus dados entre dispositivos com sua conta.</Text>

          {!isSupabaseConfigured ? (
            <View style={styles.envWarn}>
              <Text style={styles.envWarnText}>
                Crie `mobile/.env` a partir de `.env.example` com EXPO_PUBLIC_SUPABASE_URL e
                EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, depois reinicie o bundler (`npx expo start -c`).
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />

          {mode !== 'magic' ? (
            <>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoComplete={mode === 'signup' ? 'password-new' : 'password'}
              />
            </>
          ) : null}

          {mode === 'signup' ? (
            <>
              <Text style={styles.label}>Confirmação de senha</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••"
                placeholderTextColor={theme.textMuted}
                secureTextEntry
                autoComplete="password-new"
              />
            </>
          ) : null}

          {error ? <Text style={styles.feedbackError}>{error}</Text> : null}
          {message ? <Text style={styles.feedbackOk}>{message}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.btnPrimary, pressed && { opacity: 0.85 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.onAccent} />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {mode === 'magic'
                  ? 'Enviar link mágico'
                  : mode === 'signup'
                    ? 'Criar conta'
                    : 'Entrar'}
              </Text>
            )}
          </Pressable>

          <View style={styles.modeRow}>
            {mode === 'magic' ? (
              <Pressable onPress={() => switchMode('signin')}>
                <Text style={styles.link}>Voltar ao login</Text>
              </Pressable>
            ) : (
              <>
                {mode === 'signup' ? (
                  <Pressable onPress={() => switchMode('signin')}>
                    <Text style={styles.link}>Já tenho conta</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => switchMode('signup')}>
                    <Text style={styles.link}>Criar conta</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => switchMode('magic')}>
                  <Text style={styles.link}>Link por e-mail</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.bgPrimary,
    },
    scroll: {
      paddingHorizontal: theme.spacingLg,
      paddingBottom: theme.spacingXl,
    },
    card: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingLg,
    },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacingLg,
    },
    logoImage: {
      width: 36,
      height: 36,
      marginRight: theme.spacingSm,
      resizeMode: 'contain',
    },
    logoText: {
      fontFamily: FontFamily.displayBold,
      fontSize: 28,
      letterSpacing: -1,
      color: theme.accentPrimary,
    },
    logoSuffix: {
      fontFamily: FontFamily.displayBold,
      color: theme.textPrimary,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 24,
      color: theme.textPrimary,
      marginBottom: theme.spacingSm,
    },
    subtitle: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.textSecondary,
      marginBottom: theme.spacingLg,
    },
    envWarn: {
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.accentWarning,
      borderRadius: theme.radiusMd,
      padding: theme.spacingMd,
      marginBottom: theme.spacingLg,
    },
    envWarnText: {
      fontFamily: FontFamily.ui,
      fontSize: 13,
      color: theme.accentWarning,
      lineHeight: 18,
    },
    label: {
      fontFamily: FontFamily.uiMedium,
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: theme.spacingSm,
    },
    input: {
      fontFamily: FontFamily.ui,
      fontSize: 16,
      color: theme.textPrimary,
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: theme.radiusMd,
      paddingHorizontal: theme.spacingMd,
      paddingVertical: theme.spacingSm + 4,
      marginBottom: theme.spacingMd,
    },
    feedbackError: {
      fontFamily: FontFamily.ui,
      color: theme.accentDanger,
      marginBottom: theme.spacingMd,
    },
    feedbackOk: {
      fontFamily: FontFamily.ui,
      color: theme.accentPrimary,
      marginBottom: theme.spacingMd,
    },
    btnPrimary: {
      backgroundColor: theme.accentPrimary,
      borderRadius: theme.radiusMd,
      paddingVertical: theme.spacingMd,
      alignItems: 'center',
      marginTop: theme.spacingSm,
    },
    btnPrimaryText: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 16,
      color: theme.onAccent,
    },
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacingMd,
      marginTop: theme.spacingLg,
      justifyContent: 'center',
    },
    link: {
      fontFamily: FontFamily.ui,
      fontSize: 14,
      color: theme.accentPrimary,
    },
  })
);
