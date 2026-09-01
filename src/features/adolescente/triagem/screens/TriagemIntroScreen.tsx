import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BackButton } from '../../../../shared/ui/BackButton';
import { AppButton } from '../../../../shared/ui/AppButton';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { colors } from '../../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Primeira tela da triagem: o Bróxis "entra em cena" pulando e se apresenta
// com a bolha de fala digitando o texto aos poucos.
export default function TriagemIntroScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [podeAvancar, setPodeAvancar] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.content}>
        <SpeechBubble
          text="Oi! Eu sou o Bróxis!"
          style={styles.bubble}
          onFinishTyping={() => setPodeAvancar(true)}
        />
        <BroxisMascot pose="aceno" entrance="pulo" size={260} />
      </View>

      <AppButton
        label="CONTINUAR"
        backgroundColor={podeAvancar ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={!podeAvancar}
        onPress={() => navigation.navigate('TriagemApresentacao')}
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