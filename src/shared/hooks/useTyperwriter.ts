import { useEffect, useRef, useState } from 'react';

interface UseTypewriterOptions {
  speedMs?: number; // tempo entre cada caractere
  startDelayMs?: number; // atraso antes de começar a digitar
  onDone?: () => void;
}

// Revela o texto caractere por caractere, simulando o Bróxis "digitando" a mensagem.
// Retorna o texto parcial atual e se a digitação já terminou.
export function useTypewriter(fullText: string, options: UseTypewriterOptions = {}) {
  const { speedMs = 28, startDelayMs = 300, onDone } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    setDisplayedText('');
    setIsDone(false);

    let charIndex = 0;
    let intervalId: ReturnType<typeof setInterval>;

    const startTimeout = setTimeout(() => {
      intervalId = setInterval(() => {
        charIndex += 1;
        setDisplayedText(fullText.slice(0, charIndex));

        if (charIndex >= fullText.length) {
          clearInterval(intervalId);
          setIsDone(true);
          onDoneRef.current?.();
        }
      }, speedMs);
    }, startDelayMs);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(intervalId);
    };
  }, [fullText, speedMs, startDelayMs]);

  // permite pular direto pro texto completo se o usuário tocar na tela
  function skipToEnd() {
    setDisplayedText(fullText);
    setIsDone(true);
    onDoneRef.current?.();
  }

  return { displayedText, isDone, skipToEnd };
}