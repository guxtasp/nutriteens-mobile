import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useTypewriter } from '../hooks/useTyperwriter';

interface SpeechBubbleProps {
  text: string;
  typewriter?: boolean; // se false, mostra o texto inteiro direto (sem digitação)
  onFinishTyping?: () => void;
  style?: object;
}

// Bolha de fala do Bróxis. Quando `typewriter` está ativo, o texto some
// gradualmente como se estivesse sendo digitado; tocar na bolha pula pro final.
export function SpeechBubble({ text, typewriter = true, onFinishTyping, style }: SpeechBubbleProps) {
  const { displayedText, isDone, skipToEnd } = useTypewriter(text, {
    onDone: onFinishTyping,
  });

  const shownText = typewriter ? displayedText : text;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8, scale: 0.96 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'timing', duration: 250 }}
      style={[styles.bubble, style]}
    >
      <Pressable onPress={typewriter && !isDone ? skipToEnd : undefined}>
        <AppText style={styles.text}>{shownText}</AppText>
      </Pressable>
      <View style={styles.tail} />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxWidth: 320,
    alignSelf: 'center',
  },
  text: {
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D9D9D9',
  },
});