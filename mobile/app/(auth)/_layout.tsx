import { Stack } from 'expo-router';

import { Theme } from '@/constants/Colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Theme.bgPrimary },
      }}
    />
  );
}
