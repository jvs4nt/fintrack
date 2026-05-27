import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
} from '@expo-google-fonts/sora';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

import { Theme } from '@/constants/Colors';
import { AuthProvider } from '@/src/context/AuthContext';
import { ConfirmProvider } from '@/src/context/ConfirmContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Theme.accentPrimary,
    background: Theme.bgPrimary,
    card: Theme.bgSecondary,
    text: Theme.textPrimary,
    border: Theme.border,
    notification: Theme.accentDanger,
  },
};

export default function RootLayout() {
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
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ConfirmProvider>
        <ThemeProvider value={navigationTheme}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Theme.bgPrimary },
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
