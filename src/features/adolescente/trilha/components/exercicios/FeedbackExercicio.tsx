// src/features/adolescente/trilha/components/exercicios/FeedbackExercicio.tsx
import React, { useEffect, useMemo } from 'react';
import { LayoutChangeEvent, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../../shared/ui/AppText';
import { AppButton } from '../../../../../shared/ui/AppButton';
import { BroxisMascot } from '../../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../../shared/theme/colors';
import { layout } from '../../../../../shared/theme/layout';
import { typography } from '../../../../../shared/theme/typography';
import { tocarSom } from '../../../../../shared/audio/sons';

// largura do botão dentro do painel (% da largura da tela)
const LARGURA_BOTAO = '60%';
// tamanho do Broxis que espia pela quina do painel
const TAMANHO_MASCOTE = 88;

// tons do erro: o vermelho da marca fica claro demais pra texto sobre o rosa
const ERRO_TEXTO = '#B3231F';
const ERRO_RELEVO = '#C42B27';

const MENSAGENS_ACERTO = ['Mandou bem!', 'Arrasou!', 'Na mosca!', 'Isso aí!'];
const MENSAGENS_ERRO = ['Quase lá!', 'Calma, acontece!', 'Ops, não foi dessa vez'];

type Props = {
  acertou: boolean;
  // só aparece quando errou (no acerto fica só o reforço positivo, como no Figma)
  explicacao?: string | null;
  onContinuar: () => void;
  // altura do painel, pra lista abrir espaço no fim e o último item não ficar escondido
  onAltura?: (altura: number) => void;
};

/**
 * Painel de feedback: cartão com cantos de cima arredondados, em 100% da
 * largura, indo até a borda de baixo da tela (por baixo do indicador do
 * iPhone). O Broxis espia pela quina de cima, à direita.
 *
 * Animação calma: o painel sobe com uma curva suave (sem mola, então nunca
 * passa do ponto nem deixa fresta embaixo); o Broxis aparece logo depois e o
 * conteúdo surge em sequência, bem sutil.
 *
 * Som: o painel só existe depois que o adolescente responde, então ele toca o
 * som de acerto ou de erro assim que aparece.
 */
export default function FeedbackExercicio({ acertou, explicacao, onContinuar, onAltura }: Props) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    tocarSom(acertou ? 'acerto' : 'erro');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // uma mensagem sorteada por resposta (o painel monta de novo a cada resposta)
  const titulo = useMemo(() => {
    const lista = acertou ? MENSAGENS_ACERTO : MENSAGENS_ERRO;
    return lista[Math.floor(Math.random() * lista.length)];
  }, [acertou]);

  const corTitulo = acertou ? colors.primaryDark : ERRO_TEXTO;
  const corBotao = acertou ? colors.primary : colors.exercicioErro;
  const corRelevo = acertou ? colors.primaryShadow : ERRO_RELEVO;
  const corSelo = acertou ? colors.primary : colors.exercicioErro;
  const mostrarDica = !acertou && !!explicacao;

  function handleLayout(e: LayoutChangeEvent) {
    onAltura?.(e.nativeEvent.layout.height);
  }

  return (
    <MotiView
      onLayout={handleLayout}
      from={{ translateY: 220, opacity: 0 }}
      animate={{ translateY: 0, opacity: 1 }}
      transition={{ type: 'timing', duration: 340, easing: Easing.out(Easing.cubic) }}
      style={[
        styles.painel,
        { backgroundColor: acertou ? colors.exercicioAcertoFundo : colors.exercicioErroSuave },
        // a cor continua por baixo da área segura; o botão fica acima dela
        { paddingBottom: Math.max(insets.bottom + 8, 24) },
      ]}
    >
      {/* Broxis espiando pela quina de cima */}
      <MotiView
        from={{ opacity: 0, scale: 0.85, translateY: 10 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: 180, easing: Easing.out(Easing.cubic) }}
        style={styles.mascote}
        pointerEvents="none"
      >
        <BroxisMascot
          pose={acertou ? 'supercontente' : 'curioso'}
          entrance="nenhuma"
          size={TAMANHO_MASCOTE}
          showParticles={false}
        />
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 260, delay: 160 }}
        style={styles.cabecalho}
      >
        <View style={[styles.selo, { backgroundColor: corSelo }]}>
          <Ionicons name={acertou ? 'checkmark' : 'close'} size={20} color={colors.white} />
        </View>
        <AppText style={[styles.titulo, { color: corTitulo }]} numberOfLines={2}>
          {titulo}
        </AppText>
      </MotiView>

      {mostrarDica && (
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260, delay: 230 }}
          style={styles.dica}
        >
          <AppText style={[styles.dicaRotulo, { color: ERRO_TEXTO }]}>DICA DO BROXIS</AppText>
          <AppText style={[styles.dicaTexto, { color: ERRO_TEXTO }]}>{explicacao}</AppText>
        </MotiView>
      )}

      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 260, delay: 290 }}
      >
        <AppButton
          label={acertou ? 'CONTINUAR' : 'ENTENDI!'}
          size="compact"
          backgroundColor={corBotao}
          textColor={colors.white}
          shadowColor={corRelevo}
          fullWidth={false}
          onPress={onContinuar}
          style={styles.botao}
        />
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  painel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: layout.margemFluxoH,
    paddingTop: 24,
    gap: 14,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    // sombra suave pra cima, destacando o painel do conteúdo
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  mascote: {
    position: 'absolute',
    top: -(TAMANHO_MASCOTE * 0.55),
    right: layout.margemFluxoH - 4,
    width: TAMANHO_MASCOTE,
    height: TAMANHO_MASCOTE,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // deixa espaço pro Broxis à direita
    paddingRight: TAMANHO_MASCOTE - 8,
  },
  selo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 19 },
  dica: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  dicaRotulo: {
    fontFamily: typography.bold,
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  dicaTexto: {
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  botao: { alignSelf: 'center', width: LARGURA_BOTAO },
});