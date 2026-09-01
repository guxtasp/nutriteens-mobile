import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BackButton } from '../../../../shared/ui/BackButton';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TriagemApresentacaoScreen({ navigation }: any) {
  const insets = useSafeAreaInsets(); 
  const [podeAvancar, setPodeAvancar] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.content}>
        <SpeechBubble
          text={`Quero te conhecer melhor! Vou fazer umas perguntinhas rápidas pra te acompanhar direitinho nessa jornada`}
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
        // primeiro passo agora é o Recordatório, não a EBIA — única mudança
        // necessária aqui por causa da troca de ordem
        onPress={() => navigation.navigate('RecordatorioRefeicao', { indice: 0 })}
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
    marginBottom: 70,
  },
});