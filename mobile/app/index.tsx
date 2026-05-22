import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Theme.accentPrimary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
