import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Tabs, Redirect } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, View } from 'react-native';
import { FinTrackTabBar } from '@/components/FinTrackTabBar';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { FEATURE_SAVINGS } from '@/src/config/features';
import LoadingLogo from '@/src/components/LoadingLogo';
import { useAndroidNavigationBarOnFocus } from '@/src/hooks/useAndroidNavigationBar';

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
  useAndroidNavigationBarOnFocus();

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
      tabBar={(props) => <FinTrackTabBar {...props} iosBlur={iosBlur} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Theme.accentPrimary,
        tabBarInactiveTintColor: Theme.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontFamily.uiMedium,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
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
      {/* Reservas: rota mantida; aba oculta até retomar FEATURE_SAVINGS. */}
      <Tabs.Screen
        name="savings"
        options={
          FEATURE_SAVINGS
            ? {
                title: 'Reservas',
                tabBarIcon: ({ color, focused }) => (
                  <TabIcon outline="wallet-outline" solid="wallet" color={color} focused={focused} />
                ),
              }
            : { href: null }
        }
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
