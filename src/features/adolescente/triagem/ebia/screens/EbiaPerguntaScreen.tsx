// src/features/ebia/screens/EbiaPerguntaScreen.tsx
// Renomeado de TriagemPerguntaScreen.tsx (mesmo arquivo, novo nome/local:
// esta tela é sobre a EBIA, não sobre "a triagem" genericamente).
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '../../../../../shared/ui/BackButton';
import { AppButton } from '../../../../../shared/ui/AppButton';
import { AppText } from '../../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../../shared/ui/BroxisMascot';
import { SpeechBubble } from '../../../../../shared/ui/SpeechBubble';
import { MessageBanner } from '../../../../../shared/ui/MessageBanner';
import { OpcaoSimNao } from '../components/OpcaoSimNao';
import { useEbiaPergunta } from '../hooks/useEbiaPergunta';
import { colors } from '../../../../../shared/theme/colors';
import { typography } from '../../../../../shared/theme/typography';

export default function EbiaPerguntaScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();

  const { pergunta, ehUltima, selecionado, setSelecionado, salvando, avancar, message, type, clearMessage } = useEbiaPergunta({
    navigation,
    indice: route.params?.indice ?? 0,
    respostasAnteriores: route.params?.respostas ?? [],
  });

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20 }]}>
      <MessageBanner message={message} type={type} onClose={clearMessage} style={[styles.topBanner, { top: insets.top + 12 }]} />
      <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />

      <View style={styles.header}>
        <BroxisMascot pose="pensando" entrance="fade" size={70} showParticles={false} />
        <SpeechBubble text={pergunta.texto} typewriter={false} tailPosition="left" style={styles.bubble} />
      </View>

      <AppText style={styles.hint}>Toque para selecionar</AppText>

      <OpcaoSimNao selecionado={selecionado} onSelecionar={setSelecionado} />

      <AppButton
        label={salvando ? 'SALVANDO...' : ehUltima ? 'FINALIZAR' : 'CONTINUAR'}
        backgroundColor={selecionado !== null ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={selecionado === null || salvando}
        onPress={avancar}
        style={styles.continueButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topBanner: { position: 'absolute', width: '90%', alignSelf: 'center', zIndex: 20 },
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  bubble: {
    flex: 1,
    alignSelf: 'center',
    marginTop: 8,
  },
  hint: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    marginTop: 'auto',
    marginBottom: 70,
  },
});