import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { createThemedStyles } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';

export default function NotFoundScreen() {
  const styles = useStyles();
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

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.bgPrimary,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 18,
      color: theme.textPrimary,
    },
    link: {
      marginTop: 16,
      paddingVertical: 12,
    },
    linkText: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.accentPrimary,
    },
  })
);
