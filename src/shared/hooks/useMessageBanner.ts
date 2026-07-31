import { useCallback, useState } from 'react';
import { MessageType } from '../ui/MessageBanner';

// Hook é uma função que permite usar o estado e outros recursos do React em componentes funcionais.
// Define a custom hook useMessageBanner que gerencia o estado de uma mensagem de banner.

export function useMessageBanner() {
  // Define dois estados: message, que armazena a mensagem atual do banner 
  // (ou null se não houver mensagem), e type, que armazena o tipo da mensagem (error, info ou success).
  const [message, setMessage] = useState<string | null>(null);
  // Define o estado type com o tipo MessageType, que pode ser 'error', 'info' ou 'success'.
  const [type, setType] = useState<MessageType>('error');

  // Define a função showMessage que atualiza o estado da mensagem e do tipo de mensagem.
  const showMessage = useCallback((text: string, messageType: MessageType = 'error') => {
    setType(messageType);
    setMessage(text);
  }, []);

  const clearMessage = useCallback(() => setMessage(null), []);

  return { message, type, showMessage, clearMessage };
}