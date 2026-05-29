import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarTotalHeight } from '@/components/FinTrackTabBar';
import { TabScreenTransition } from '@/components/TabScreenTransition';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

type PageShellProps = {
  title: string;
  subtitle?: string;
  /** Ações alinhadas ao topo à direita do título (ex.: Atualizar no Dashboard). */
  headerRight?: ReactNode;
  children?: ReactNode;
};

export function PageShell({ title, subtitle, headerRight, children }: PageShellProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarTotalHeight();
  return (
    <TabScreenTransition>
      <ScrollView
        style={[styles.scroll, { paddingTop: insets.top + Theme.spacingMd }]}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + Theme.spacingLg }]}>
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

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Theme.bgPrimary,
  },
  content: {
    paddingHorizontal: Theme.spacingLg,
    paddingBottom: Theme.spacingXl * 2,
  },
  header: {
    marginBottom: Theme.spacingLg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Theme.spacingMd,
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
    color: Theme.textPrimary,
    marginBottom: Theme.spacingSm,
  },
  subtitle: {
    fontFamily: FontFamily.ui,
    fontSize: 15,
    color: Theme.textSecondary,
  },
});
