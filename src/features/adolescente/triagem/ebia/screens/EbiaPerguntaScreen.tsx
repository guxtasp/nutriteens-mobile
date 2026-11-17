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
import { SeloPeriodo } from '../../../../../shared/ui/SeloPeriodo';
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

      {/* fixo: avisa que o tempo mudou. O recordatório (etapa anterior) era sobre ONTEM; estas perguntas
          são sobre os últimos meses, e não têm relação com o que a pessoa marcou lá. */}
      <SeloPeriodo
        titulo="Agora é sobre os últimos meses"
        detalhe="Não é sobre o que você comeu ontem"
        icone="calendar-outline"
        cor="#1D4E89"
        corFundo="#DCEBFE"
      />

      <AppText style={styles.hint}>
        {route.params?.indice ? 'Toque para selecionar' : 'Pense em como foi em casa nos últimos meses e toque para selecionar'}
      </AppText>

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
    marginBottom: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
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