import { Alert } from 'react-native';
import { hasConfirmPresenter, presentThemedConfirm } from '@/src/confirmBridge';

export function confirmDestructive(title: string, message: string): Promise<boolean> {
  if (hasConfirmPresenter()) {
    return presentThemedConfirm({ title, message, confirmLabel: 'Excluir', destructive: true });
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Excluir', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function toastMessage(title: string, message?: string) {
  Alert.alert(title, message ?? '', [{ text: 'OK' }]);
}
