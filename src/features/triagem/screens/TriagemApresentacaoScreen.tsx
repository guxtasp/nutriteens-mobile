import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BackButton } from '../../../shared/ui/BackButton';
import { AppButton } from '../../../shared/ui/AppButton';
import { BroxisMascot } from '../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../shared/ui/SpeechBubble';
import { colors } from '../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOTAL_PERGUNTAS = 5;

export default function TriagemApresentacaoScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [podeAvancar, setPodeAvancar] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.content}>
        <SpeechBubble
          text={`Quero te conhecer melhor! Vou fazer ${TOTAL_PERGUNTAS} perguntinhas rápidas pra te acompanhar direitinho nessa jornada`}
          style={styles.bubble}
          onFinishTyping={() => setPodeAvancar(true)}
        />
        <BroxisMascot pose="apresentando" entrance="fade" size={230} />
      </View>

      <AppButton
        label="VAMOS LÁ"
        backgroundColor={podeAvancar ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={!podeAvancar}
        onPress={() => navigation.navigate('TriagemPergunta', { indice: 0 })}
        style={styles.continueButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  bubble: {
    marginBottom: -8,
  },
  continueButton: {
    marginBottom: 40,
  },
});