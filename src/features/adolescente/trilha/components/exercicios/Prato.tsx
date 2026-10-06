// src/features/adolescente/trilha/components/exercicios/Prato.tsx
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../../shared/ui/AppText';
import { colors } from '../../../../../shared/theme/colors';
import { layout } from '../../../../../shared/theme/layout';
import { typography } from '../../../../../shared/theme/typography';
import {
  AlimentoPrato,
  CriterioPrato,
  StatusCriterio,
  MINIMO_ITENS_PADRAO,
  avaliarPrato,
  normalizarCapacidade,
  posicoesDosSlots,
  primeiroSlotLivre,
} from '../../utils/prato';

type Props = {
  alimentos: AlimentoPrato[];
  criterios: CriterioPrato[];
  capacidade?: number;
  minimoItens?: number;
  // alimentoId -> índice do lugar no prato (string), só dos que estão no prato
  resposta: Record<string, string>;
  respondido: boolean;
  // mensagem que aparece quando a missão é cumprida
  mensagemFinal?: string | null;
  onMudar: (novaResposta: Record<string, string>) => void;
};

const COR_TAPETE = '#EEF6E4';
const COR_BORDA_NEUTRA = '#E5E7EB';
const COR_TEXTO_PENDENTE = '#6B7280';
const ESPACO_BANDEJA = 10;

function vibrar(tipo: 'leve' | 'sucesso') {
  const promessa =
    tipo === 'leve'
      ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  promessa.catch(() => {});
}

/**
 * "Monte seu prato": o adolescente toca nos alimentos da bandeja e eles
 * "voam" pra dentro de um prato ilustrado; tocar de novo no prato (ou na
 * bandeja) tira o alimento. A missão ("uma proteína", "uma verdura"…) vira
 * pílulas que se acendem sozinhas conforme o prato fica pronto. Não tem
 * certo/errado: quem usa o componente só libera o CONTINUAR quando a missão
 * está cumprida (ver utils/prato.ts e ExercicioQuizContainer).
 */
export default function Prato({
  alimentos,
  criterios,
  capacidade,
  minimoItens,
  resposta,
  respondido,
  mensagemFinal,
  onMudar,
}: Props) {
  const { width } = useWindowDimensions();
  const util = width - layout.margemFluxoH * 2;

  const cap = normalizarCapacidade(capacidade);
  const minimo = Math.min(minimoItens ?? MINIMO_ITENS_PADRAO, cap);
  const slots = posicoesDosSlots(cap);

  const noPrato = alimentos.filter((a) => resposta[a.id] !== undefined);
  const ocupados = noPrato.map((a) => Number(resposta[a.id]));
  const cheio = noPrato.length >= cap;
  const avaliacao = avaliarPrato(noPrato, criterios, minimo);
  const algumExcedeu = avaliacao.status.some((s) => s.excedeu);

  // medidas do prato
  const diametro = Math.min(util - 56, 250);
  const tamSlot = diametro * 0.23;
  const raio = diametro * 0.31;
  const centro = diametro / 2;

  // vibra uma vez quando a missão acaba de ser cumprida
  const jaCompletou = useRef(false);
  useEffect(() => {
    if (avaliacao.completo && !jaCompletou.current) vibrar('sucesso');
    jaCompletou.current = avaliacao.completo;
  }, [avaliacao.completo]);

  function alternar(alimento: AlimentoPrato) {
    if (respondido) return;
    if (resposta[alimento.id] !== undefined) {
      const { [alimento.id]: _removido, ...resto } = resposta;
      onMudar(resto);
      return;
    }
    const slot = primeiroSlotLivre(ocupados, cap);
    if (slot === null) return;
    vibrar('leve');
    onMudar({ ...resposta, [alimento.id]: String(slot) });
  }

  function limpar() {
    if (!respondido) onMudar({});
  }

  const larguraCartao = (util - ESPACO_BANDEJA * 2) / 3;

  return (
    <View style={styles.container}>
      {/* prato sobre o "jogo americano" */}
      <View style={styles.tapete}>
        <View style={styles.tapeteTopo}>
          <AppText style={styles.tapeteTitulo}>Seu prato</AppText>
          <View style={styles.tapeteAcoes}>
            {noPrato.length > 0 && !respondido && (
              <Pressable onPress={limpar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Limpar o prato">
                <AppText style={styles.limpar}>Limpar</AppText>
              </Pressable>
            )}
            <View style={styles.contador}>
              <AppText style={styles.contadorTexto}>
                {noPrato.length}/{cap}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.palco}>
          <View
            style={[
              styles.prato,
              {
                width: diametro,
                height: diametro,
                borderRadius: diametro / 2,
                borderColor: avaliacao.completo ? colors.primary : COR_BORDA_NEUTRA,
              },
            ]}
          >
            <View
              pointerEvents="none"
              style={[
                styles.aro,
                {
                  top: diametro * 0.08,
                  left: diametro * 0.08,
                  right: diametro * 0.08,
                  bottom: diametro * 0.08,
                  borderRadius: diametro,
                },
              ]}
            />

            {/* lugares vazios: convidam a tocar */}
            {slots.map((pos, i) =>
              ocupados.includes(i) ? null : (
                <View
                  key={`vazio-${i}`}
                  pointerEvents="none"
                  style={[
                    styles.lugarVazio,
                    {
                      width: tamSlot,
                      height: tamSlot,
                      borderRadius: tamSlot / 2,
                      left: centro + pos.x * raio - tamSlot / 2,
                      top: centro + pos.y * raio - tamSlot / 2,
                    },
                  ]}
                />
              )
            )}

            {/* alimentos no prato */}
            <AnimatePresence>
              {noPrato.map((alimento) => {
                const pos = slots[Number(resposta[alimento.id])] ?? slots[0];
                return (
                  <MotiView
                    key={alimento.id}
                    from={{ scale: 0, opacity: 0, translateY: -28, rotate: '-25deg' }}
                    animate={{ scale: 1, opacity: 1, translateY: 0, rotate: '0deg' }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', damping: 11, stiffness: 170 }}
                    style={[
                      styles.itemNoPrato,
                      {
                        width: tamSlot,
                        height: tamSlot,
                        left: centro + pos.x * raio - tamSlot / 2,
                        top: centro + pos.y * raio - tamSlot / 2,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => alternar(alimento)}
                      disabled={respondido}
                      hitSlop={6}
                      style={styles.itemToque}
                      accessibilityRole="button"
                      accessibilityLabel={`${alimento.nome}, no prato. Toque para tirar`}
                    >
                      <Text style={{ fontSize: tamSlot * 0.7 }} allowFontScaling={false}>
                        {alimento.emoji}
                      </Text>
                    </Pressable>
                  </MotiView>
                );
              })}
            </AnimatePresence>

            {avaliacao.completo && (
              <MotiView
                from={{ scale: 0, rotate: '-30deg' }}
                animate={{ scale: 1, rotate: '0deg' }}
                transition={{ type: 'spring', damping: 8, stiffness: 150 }}
                style={styles.brilho}
                pointerEvents="none"
              >
                <Text style={styles.brilhoTexto} allowFontScaling={false}>
                  ✨
                </Text>
              </MotiView>
            )}
          </View>
        </View>
      </View>

      {/* missão: pílulas que se acendem sozinhas */}
      {(criterios.length > 0 || minimo > 0) && (
        <View style={styles.missao}>
          <AppText style={styles.missaoTitulo}>Missão do prato</AppText>
          <View style={styles.pilulas}>
            {avaliacao.status.map((s) => (
              <Pilula key={s.criterio.id} status={s} />
            ))}
            {(criterios.length === 0 || (avaliacao.criteriosOk && noPrato.length < minimo)) && (
              <PilulaSimples texto={`Pelo menos ${minimo} alimentos`} ok={noPrato.length >= minimo} />
            )}
          </View>
          {algumExcedeu && (
            <AppText style={styles.dica}>Que tal trocar um alimento? Toque nele no prato para tirar.</AppText>
          )}
        </View>
      )}

      {avaliacao.completo && !!mensagemFinal && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 350 }}
          style={styles.mensagem}
        >
          <AppText style={styles.mensagemTexto}>{mensagemFinal}</AppText>
        </MotiView>
      )}

      {/* bandeja */}
      <AppText style={styles.instrucao}>Toque nos alimentos para pôr no prato</AppText>
      <View style={styles.bandeja}>
        {alimentos.map((alimento) => {
          const dentro = resposta[alimento.id] !== undefined;
          const bloqueado = !dentro && cheio;
          return (
            <Pressable
              key={alimento.id}
              onPress={() => alternar(alimento)}
              disabled={respondido || bloqueado}
              accessibilityRole="button"
              accessibilityLabel={`${alimento.nome}. ${dentro ? 'No prato, toque para tirar' : 'Toque para pôr no prato'}`}
              style={({ pressed }) => [
                styles.cartao,
                { width: larguraCartao },
                dentro && styles.cartaoDentro,
                bloqueado && styles.cartaoBloqueado,
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              <Text style={styles.cartaoEmoji} allowFontScaling={false}>
                {alimento.emoji}
              </Text>
              <AppText numberOfLines={2} style={[styles.cartaoNome, dentro && styles.cartaoNomeDentro]}>
                {alimento.nome}
              </AppText>
              {dentro && (
                <View style={styles.selo}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Pilula({ status }: { status: StatusCriterio }) {
  const { criterio, quantidade, atendido, excedeu } = status;
  const minimo = criterio.minimo ?? 0;
  const progresso = minimo > 1 ? ` ${Math.min(quantidade, minimo)}/${minimo}` : '';
  const estado = excedeu ? 'excedeu' : atendido ? 'ok' : 'pendente';
  return (
    <PilulaBase estado={estado} texto={`${criterio.texto}${progresso}`} />
  );
}

function PilulaSimples({ texto, ok }: { texto: string; ok: boolean }) {
  return <PilulaBase estado={ok ? 'ok' : 'pendente'} texto={texto} />;
}

function PilulaBase({ estado, texto }: { estado: 'ok' | 'pendente' | 'excedeu'; texto: string }) {
  const icone =
    estado === 'ok' ? 'checkmark-circle' : estado === 'excedeu' ? 'alert-circle' : 'ellipse-outline';
  const corIcone = estado === 'ok' ? colors.primary : estado === 'excedeu' ? colors.warning : '#9CA3AF';
  return (
    // a key em `estado` refaz a animação: a pílula "pula" quando muda
    <MotiView
      key={estado}
      from={{ scale: 0.88 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', damping: 9, stiffness: 180 }}
      style={[styles.pilula, estado === 'ok' && styles.pilulaOk, estado === 'excedeu' && styles.pilulaExcedeu]}
    >
      <Ionicons name={icone} size={18} color={corIcone} />
      <AppText
        style={[
          styles.pilulaTexto,
          estado === 'ok' && styles.pilulaTextoOk,
          estado === 'excedeu' && styles.pilulaTextoExcedeu,
        ]}
      >
        {texto}
      </AppText>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },

  tapete: {
    backgroundColor: COR_TAPETE,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
  },
  tapeteTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tapeteTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  tapeteAcoes: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  limpar: {
    fontFamily: typography.semiBold,
    fontSize: 12,
    color: COR_TEXTO_PENDENTE,
    textDecorationLine: 'underline',
  },
  contador: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  contadorTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },

  palco: { alignItems: 'center', justifyContent: 'center' },

  prato: {
    backgroundColor: colors.white,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  aro: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#EDEFEA',
    backgroundColor: '#FBFCFA',
  },
  lugarVazio: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  itemNoPrato: { position: 'absolute' },
  itemToque: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brilho: { position: 'absolute', top: -8, right: -8 },
  brilhoTexto: { fontSize: 30 },

  missao: { marginTop: 18 },
  missaoTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginBottom: 8 },
  pilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: colors.white,
  },
  pilulaOk: { borderColor: colors.primary, backgroundColor: '#F1F9E8' },
  pilulaExcedeu: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
  pilulaTexto: { fontFamily: typography.semiBold, fontSize: 12, color: COR_TEXTO_PENDENTE },
  pilulaTextoOk: { color: colors.primaryDark },
  pilulaTextoExcedeu: { color: colors.warningShadow },
  dica: { fontFamily: typography.regular, fontSize: 12, color: colors.warningShadow, marginTop: 8 },

  mensagem: {
    marginTop: 14,
    backgroundColor: colors.exercicioAcertoFundo,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  mensagemTexto: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    lineHeight: 19,
    color: colors.primaryDark,
    textAlign: 'center',
  },

  instrucao: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: colors.placeholder,
    textAlign: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  bandeja: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO_BANDEJA },
  cartao: {
    minHeight: 84,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: COR_BORDA_NEUTRA,
    borderBottomWidth: 4,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoDentro: { borderColor: colors.primary, backgroundColor: '#F1F9E8' },
  cartaoBloqueado: { opacity: 0.45 },
  cartaoEmoji: { fontSize: 30, marginBottom: 2 },
  cartaoNome: {
    fontFamily: typography.bold,
    fontSize: 11,
    color: colors.exercicioBorda,
    textAlign: 'center',
  },
  cartaoNomeDentro: { color: colors.primaryDark },
  selo: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});