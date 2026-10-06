import { Stack } from 'expo-router';

import { useTheme } from '@/src/theme/ThemeContext';

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bgPrimary },
      }}
    />
  );
}
