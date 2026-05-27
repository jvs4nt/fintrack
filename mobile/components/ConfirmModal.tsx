import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Theme } from '@/constants/Colors';
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Theme.spacingLg,
  },
  center: {
    alignItems: 'center',
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
  card: {
    backgroundColor: Theme.bgSecondary,
    borderRadius: Theme.radiusLg,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: Theme.spacingLg,
  },
  title: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 18,
    color: Theme.textPrimary,
    marginBottom: Theme.spacingSm,
  },
  message: {
    fontFamily: FontFamily.ui,
    fontSize: 14,
    color: Theme.textSecondary,
    marginBottom: Theme.spacingLg,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacingMd,
    flexWrap: 'wrap',
  },
  btnCancel: {
    paddingVertical: Theme.spacingSm,
    paddingHorizontal: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  btnCancelText: {
    fontFamily: FontFamily.uiMedium,
    fontSize: 15,
    color: Theme.textSecondary,
  },
  btnConfirm: {
    paddingVertical: Theme.spacingSm,
    paddingHorizontal: Theme.spacingMd,
    borderRadius: Theme.radiusMd,
    backgroundColor: Theme.accentPrimary,
  },
  btnConfirmDestructive: {
    backgroundColor: Theme.bgTertiary,
    borderWidth: 1,
    borderColor: Theme.accentDanger,
  },
  btnConfirmText: {
    fontFamily: FontFamily.uiSemiBold,
    fontSize: 15,
    color: Theme.bgPrimary,
  },
  btnConfirmTextDestructive: {
    color: Theme.accentDanger,
  },
});
