import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarTotalHeight } from '@/components/FinTrackTabBar';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { createThemedStyles, useTheme } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';

type PageShellProps = {
  title: string;
  subtitle?: string;
  /** Ações alinhadas ao topo à direita do título (ex.: Atualizar no Dashboard). */
  headerRight?: ReactNode;
  children?: ReactNode;
};

export function PageShell({ title, subtitle, headerRight, children }: PageShellProps) {
  const theme = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarTotalHeight();
  return (
    <TabScreenTransition>
      <ScrollView
        style={[styles.scroll, { paddingTop: insets.top + theme.spacingMd }]}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + theme.spacingLg }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
        {children}
      </ScrollView>
    </TabScreenTransition>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: theme.bgPrimary,
    },
    content: {
      paddingHorizontal: theme.spacingLg,
      paddingBottom: theme.spacingXl * 2,
    },
    header: {
      marginBottom: theme.spacingLg,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacingMd,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    headerRight: {
      paddingTop: 2,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 26,
      color: theme.textPrimary,
      marginBottom: theme.spacingSm,
    },
    subtitle: {
      fontFamily: FontFamily.ui,
      fontSize: 15,
      color: theme.textSecondary,
    },
  })
);
