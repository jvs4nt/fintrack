import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Theme } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

export type ChoiceOption<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  message: string;
  options: ChoiceOption<T>[];
  onPick: (id: T) => void;
  onCancel: () => void;
};

export function ChoiceModal<T extends string>({
  visible,
  title,
  message,
  options,
  onPick,
  onCancel,
}: Props<T>) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {options.map((o) => (
            <Pressable key={o.id} style={styles.option} onPress={() => onPick(o.id)}>
              <Text style={styles.optionText}>{o.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cancel} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
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
  box: {
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
    marginBottom: Theme.spacingMd,
  },
  option: {
    paddingVertical: Theme.spacingMd,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  optionText: {
    fontFamily: FontFamily.ui,
    fontSize: 16,
    color: Theme.accentPrimary,
  },
  cancel: {
    marginTop: Theme.spacingSm,
    paddingVertical: Theme.spacingMd,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FontFamily.ui,
    color: Theme.textMuted,
  },
});
