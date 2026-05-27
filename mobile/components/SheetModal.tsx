import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

/** Altura reservada para header + footer do sheet (aprox.) */
const SHEET_CHROME = 168;

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function SheetModal({ visible, title, onClose, children, footer }: Props) {
  const { height: winH } = useWindowDimensions();
  const bodyMaxHeight = Math.max(260, Math.round(winH * 0.88) - SHEET_CHROME);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView
            style={{ maxHeight: bodyMaxHeight }}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    width: '100%',
    backgroundColor: Theme.bgSecondary,
    borderTopLeftRadius: Theme.radiusXl,
    borderTopRightRadius: Theme.radiusXl,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacingLg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 18,
    color: Theme.textPrimary,
  },
  close: {
    fontSize: 28,
    color: Theme.textSecondary,
    lineHeight: 28,
  },
  body: {
    padding: Theme.spacingLg,
    paddingBottom: Theme.spacingXl,
  },
  footer: {
    padding: Theme.spacingLg,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    flexDirection: 'row',
    gap: Theme.spacingMd,
    justifyContent: 'flex-end',
  },
});
