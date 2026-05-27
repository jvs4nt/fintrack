import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ops' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Esta tela não existe.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ir ao início</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Theme.bgPrimary,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 18,
    color: Theme.textPrimary,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontFamily: FontFamily.ui,
    fontSize: 15,
    color: Theme.accentPrimary,
  },
});
