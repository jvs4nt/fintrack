import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { createThemedStyles } from '@/src/theme/ThemeContext';
import { FontFamily } from '@/constants/Typography';

export type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.center} onPress={(e) => e.stopPropagation()}>
          <Animated.View entering={ZoomIn.duration(240)} style={styles.cardWrap}>
            <View style={styles.card}>
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <View style={styles.actions}>
                <Pressable style={styles.btnCancel} onPress={onCancel} hitSlop={8}>
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.btnConfirm, destructive && styles.btnConfirmDestructive]}
                  onPress={onConfirm}
                  hitSlop={8}>
                  <Text style={[styles.btnConfirmText, destructive && styles.btnConfirmTextDestructive]}>
                    {confirmLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      padding: theme.spacingLg,
    },
    center: {
      alignItems: 'center',
    },
    cardWrap: {
      width: '100%',
      maxWidth: 360,
    },
    card: {
      backgroundColor: theme.bgSecondary,
      borderRadius: theme.radiusLg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: theme.spacingLg,
    },
    title: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 18,
      color: theme.textPrimary,
      marginBottom: theme.spacingSm,
    },
    message: {
      fontFamily: FontFamily.ui,
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: theme.spacingLg,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: theme.spacingMd,
      flexWrap: 'wrap',
    },
    btnCancel: {
      paddingVertical: theme.spacingSm,
      paddingHorizontal: theme.spacingMd,
      borderRadius: theme.radiusMd,
      borderWidth: 1,
      borderColor: theme.border,
    },
    btnCancelText: {
      fontFamily: FontFamily.uiMedium,
      fontSize: 15,
      color: theme.textSecondary,
    },
    btnConfirm: {
      paddingVertical: theme.spacingSm,
      paddingHorizontal: theme.spacingMd,
      borderRadius: theme.radiusMd,
      backgroundColor: theme.accentPrimary,
    },
    btnConfirmDestructive: {
      backgroundColor: theme.bgTertiary,
      borderWidth: 1,
      borderColor: theme.accentDanger,
    },
    btnConfirmText: {
      fontFamily: FontFamily.uiSemiBold,
      fontSize: 15,
      color: theme.onAccent,
    },
    btnConfirmTextDestructive: {
      color: theme.accentDanger,
    },
  })
);
