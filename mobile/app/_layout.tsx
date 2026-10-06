import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

import { AuthProvider } from '@/src/context/AuthContext';
import { ConfirmProvider } from '@/src/context/ConfirmContext';
import { useAndroidNavigationBar } from '@/src/hooks/useAndroidNavigationBar';
import { AppThemeProvider, useAppTheme } from '@/src/theme/ThemeContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { theme, scheme, ready: themeReady } = useAppTheme();
  useAndroidNavigationBar();

  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.accentPrimary,
        background: theme.bgPrimary,
        card: theme.bgSecondary,
        text: theme.textPrimary,
        border: theme.border,
        notification: theme.accentDanger,
      },
    };
  }, [theme, scheme]);

  const [loaded, error] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && themeReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, themeReady]);

  if (!loaded || !themeReady) {
    return null;
  }

  return (
    <AuthProvider>
      <ConfirmProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.bgPrimary },
            }}>
            <Stack.Screen
              name="index"
              options={{
                animation: 'fade',
                animationDuration: 160,
              }}
            />
            <Stack.Screen
              name="(auth)"
              options={{
                animation: 'fade',
                animationDuration: 220,
              }}
            />
            <Stack.Screen
              name="(app)"
              options={{
                animation: 'fade_from_bottom',
                animationDuration: 280,
              }}
            />
          </Stack>
        </ThemeProvider>
      </ConfirmProvider>
    </AuthProvider>
  );
}
