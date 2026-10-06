import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles } from '@/src/theme/ThemeContext';
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
  const styles = useStyles();
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

const useStyles = createThemedStyles((theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      padding: theme.spacingLg,
    },
    box: {
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
      marginBottom: theme.spacingMd,
    },
    option: {
      paddingVertical: theme.spacingMd,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    optionText: {
      fontFamily: FontFamily.ui,
      fontSize: 16,
      color: theme.accentPrimary,
    },
    cancel: {
      marginTop: theme.spacingSm,
      paddingVertical: theme.spacingMd,
      alignItems: 'center',
    },
    cancelText: {
      fontFamily: FontFamily.ui,
      color: theme.textMuted,
    },
  })
);
