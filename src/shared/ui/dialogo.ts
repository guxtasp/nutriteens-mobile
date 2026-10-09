// src/shared/ui/dialogo.ts
//
// Alert.alert não faz nada na web (react-native-web não implementa): botões de
// confirmação e mensagens de erro simplesmente não aparecem. Estes helpers usam
// window.confirm/alert na web e o Alert nativo no celular.
import { Alert, Platform } from 'react-native';

export function avisar(titulo: string, mensagem?: string): void {
  if (Platform.OS === 'web') {
    window.alert(mensagem ? `${titulo}\n\n${mensagem}` : titulo);
    return;
  }
  Alert.alert(titulo, mensagem);
}

export function confirmar(
  titulo: string,
  mensagem: string,
  opcoes: { confirmar?: string; destrutivo?: boolean } = {},
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  }
  return new Promise((resolve) => {
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: opcoes.confirmar ?? 'Confirmar', style: opcoes.destrutivo ? 'destructive' : 'default', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
