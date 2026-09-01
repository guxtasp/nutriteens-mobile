import { useCallback, useState } from 'react';
import { MessageType } from '../ui/MessageBanner';

export function useMessageBanner() {
  // Define dois estados: message, que armazena a mensagem atual do banner 
  // (ou null se não houver mensagem), e type, que armazena o tipo da mensagem (error, info ou success).
  const [message, setMessage] = useState<string | null>(null);
  // Define o estado type com o tipo MessageType, que pode ser 'error', 'info' ou 'success'.
  const [type, setType] = useState<MessageType>('error');

  // Define a função showMessage que atualiza o estado da mensagem e do tipo de mensagem.
  const showMessage = useCallback((text: string, messageType: MessageType = 'error') => {
    setType(messageType); // atualiza o estado type com o tipo de mensagem fornecido (ou 'error' por padrão)
    setMessage(text); // atualiza o estado message com a mensagem fornecida
  }, []);

  const clearMessage = useCallback(() => setMessage(null), []); // define a função clearMessage que limpa a mensagem atual, definindo o estado message como null.

  return { message, type, showMessage, clearMessage }; // retorna um objeto contendo a mensagem atual, o tipo de mensagem, a função para mostrar uma nova mensagem e a função para limpar a mensagem.
}