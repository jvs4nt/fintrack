import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Tabs, Redirect } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import LoadingLogo from '@/src/components/LoadingLogo';

type IonName = ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  outline,
  solid,
  color,
  focused,
}: {
  outline: IonName;
  solid: IonName;
  color: string;
  focused: boolean;
}) {
  return <Ionicons name={focused ? solid : outline} size={focused ? 24 : 22} color={color} />;
}

export default function AppLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Theme.bgPrimary,
        }}>
        <LoadingLogo size={76} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const iosBlur = Platform.OS === 'ios';

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.accentPrimary,
        tabBarInactiveTintColor: Theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontFamily.uiMedium,
        },
        tabBarStyle: iosBlur
          ? {
              borderTopColor: 'rgba(42,42,56,0.65)',
              backgroundColor: 'rgba(17,17,24,0.55)',
              elevation: 0,
            }
          : {
              backgroundColor: Theme.bgSecondary,
              borderTopColor: Theme.border,
            },
        tabBarBackground: iosBlur
          ? () => <BlurView tint="dark" intensity={88} style={StyleSheet.absoluteFill} />
          : undefined,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="home-outline" solid="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="months"
        options={{
          title: 'Meses',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="calendar-outline" solid="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="fixed"
        options={{
          title: 'Fixos',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="repeat-outline" solid="repeat" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cartões',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="card-outline" solid="card" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="wallet-outline" solid="wallet" color={color} focused={focused} />
          ),
        }}
      />
      {/* Agente: rota mantida; aba oculta até release dedicada. */}
      <Tabs.Screen name="agent" options={{ href: null }} />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon outline="settings-outline" solid="settings" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
