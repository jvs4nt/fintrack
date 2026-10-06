import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/src/theme/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import LoadingLogo from '@/src/components/LoadingLogo';

export default function Index() {
  const theme = useTheme();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bgPrimary, justifyContent: 'center', alignItems: 'center' }}>
        <LoadingLogo size={76} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
