import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';
import LoadingLogo from '@/src/components/LoadingLogo';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingLogo size={76} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
