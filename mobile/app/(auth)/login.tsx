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
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { isSupabaseConfigured } from '@/src/lib/supabase';

type LoginMode = 'signin' | 'signup' | 'magic';

const logoSource = require('../../assets/images/fintrack-logo.png');

export default function LoginScreen() {
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
      style={[styles.root, { paddingTop: insets.top + Theme.spacingLg }]}
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
            placeholderTextColor={Theme.textMuted}
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
                placeholderTextColor={Theme.textMuted}
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
                placeholderTextColor={Theme.textMuted}
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
              <ActivityIndicator color={Theme.bgPrimary} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.bgPrimary,
  },
  scroll: {
    paddingHorizontal: Theme.spacingLg,
    paddingBottom: Theme.spacingXl,
  },
  card: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingLg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacingLg,
  },
  logoImage: {
    width: 36,
    height: 36,
    marginRight: Theme.spacingSm,
    resizeMode: 'contain',
  },
  logoText: {
    fontFamily: FontFamily.displayBold,
    fontSize: 28,
    letterSpacing: -1,
    color: Theme.accentPrimary,
  },
  logoSuffix: {
    fontFamily: FontFamily.displayBold,
    color: Theme.textPrimary,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 24,
    color: Theme.textPrimary,
    marginBottom: Theme.spacingSm,
  },
  subtitle: {
    fontFamily: FontFamily.ui,
    fontSize: 15,
    color: Theme.textSecondary,
    marginBottom: Theme.spacingLg,
  },
  envWarn: {
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.accentWarning,
    borderRadius: Theme.radiusMd,
    padding: Theme.spacingMd,
    marginBottom: Theme.spacingLg,
  },
  envWarnText: {
    fontFamily: FontFamily.ui,
    fontSize: 13,
    color: Theme.accentWarning,
    lineHeight: 18,
  },
  label: {
    fontFamily: FontFamily.uiMedium,
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: Theme.spacingSm,
  },
  input: {
    fontFamily: FontFamily.ui,
    fontSize: 16,
    color: Theme.textPrimary,
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: Theme.radiusMd,
    paddingHorizontal: Theme.spacingMd,
    paddingVertical: Theme.spacingSm + 4,
    marginBottom: Theme.spacingMd,
  },
  feedbackError: {
    fontFamily: FontFamily.ui,
    color: Theme.accentDanger,
    marginBottom: Theme.spacingMd,
  },
  feedbackOk: {
    fontFamily: FontFamily.ui,
    color: Theme.accentPrimary,
    marginBottom: Theme.spacingMd,
  },
  btnPrimary: {
    backgroundColor: Theme.accentPrimary,
    borderRadius: Theme.radiusMd,
    paddingVertical: Theme.spacingMd,
    alignItems: 'center',
    marginTop: Theme.spacingSm,
  },
  btnPrimaryText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 16,
    color: Theme.bgPrimary,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacingMd,
    marginTop: Theme.spacingLg,
    justifyContent: 'center',
  },
  link: {
    fontFamily: FontFamily.ui,
    fontSize: 14,
    color: Theme.accentPrimary,
  },
});
