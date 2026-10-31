// src/features/adolescente/social/components/JardimPecas.tsx
//
// Peças do Jardim compartilhadas pela lista, pelo detalhe e pela criação (antes viviam todas dentro de JardimScreen):
// céu de cada planta, gotinhas, aviso "cresceu", linha do tempo dos estágios e o bloco "Regue o jardim hoje".
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';
import JardimBotao from './JardimBotao';
import PlantaJardim from './PlantaJardim';
import { ehErroRestricaoSocial } from '../utils/moderacao';
import {
  ESTAGIOS_JARDIM, MAX_JARDINS_ATIVOS, TEMAS_JARDIM, ehErroLimiteJardim, nomeDoEstagio, type TemaJardim,
} from '../utils/jardim';

export const AZUL_AGUA = '#4AA3F0';

/** Céu atrás de cada planta: combina com a cor do vaso. */
export const CEU: Record<TemaJardim, [string, string]> = {
  BROCOLIS: ['#DCD2FF', '#F4FBE9'],
  GIRASSOL: ['#BFE3FF', '#FFF7D6'],
  TOMATEIRO: ['#FFE0DC', '#FFF6EA'],
  LARANJEIRA: ['#CDEFE9', '#FFF3DD'],
  HORTA: ['#FFD9E6', '#F2FBE4'],
};

export function nomeDoTema(tema: TemaJardim): string {
  return TEMAS_JARDIM.find((t) => t.tema === tema)?.nome ?? 'Jardim';
}

export function mensagemErroJardim(e: unknown): string {
  if (ehErroRestricaoSocial(e)) return 'Seu espaço de amigos está em pausa por enquanto. O jardim continua crescendo com os seus registros.';
  if (ehErroLimiteJardim(e)) return `Você já participa de ${MAX_JARDINS_ATIVOS} jardins. Saia de um para criar outro.`;
  return 'Algo deu errado. Tente de novo daqui a pouco.';
}

export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduzir).catch(() => undefined);
  }, []);
  return reduzir;
}

/** Três gotinhas caindo sobre a planta quando VOCÊ regou hoje (toca 3 vezes e para). */
export function Gotas({ ativo }: { ativo: boolean }) {
  const reduzir = useReduzirMovimento();
  const vals = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!ativo || reduzir) return;
    const loops = vals.map((v, i) => Animated.loop(
      Animated.sequence([
        Animated.delay(i * 420),
        Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
      { iterations: 3 },
    ));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [ativo, reduzir, vals]);

  if (!ativo || reduzir) return null;
  return (
    <View pointerEvents="none" style={estilos.gotas}>
      {vals.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: 6 + i * 30,
            opacity: v.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 74] }) }],
          }}
        >
          <Ionicons name="water" size={18} color={AZUL_AGUA} />
        </Animated.View>
      ))}
    </View>
  );
}

/** "Seu jardim cresceu!" — aparece uma vez quando o estágio sobe desde a última visita. */
export function AvisoCresceu({ texto, aoFechar }: { texto: string; aoFechar: () => void }) {
  const escala = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const a = Animated.spring(escala, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [escala]);
  return (
    <Animated.View style={[estilos.cresceu, { transform: [{ scale: escala }] }]}>
      <Pressable onPress={aoFechar} accessibilityRole="button" accessibilityLabel={`${texto} Toque para fechar.`} style={estilos.cresceuLinha}>
        <Ionicons name="sparkles" size={18} color={colors.primaryDark} />
        <AppText style={estilos.cresceuTexto}>{texto}</AppText>
      </Pressable>
    </Animated.View>
  );
}

/** Os 7 estágios em miniatura: o atual em destaque e os que ainda vêm apagados, para dar vontade de chegar lá. */
export function LinhaDoTempo({ tema, atual }: { tema: TemaJardim; atual: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={estilos.linhaTempo}>
      {ESTAGIOS_JARDIM.map((e) => {
        const alcancado = e.indice <= atual;
        const ehAtual = e.indice === atual;
        return (
          <View key={e.indice} style={[estilos.passo, ehAtual && estilos.passoAtual]} accessible accessibilityLabel={`${nomeDoEstagio(tema, e.indice)}${ehAtual ? ', estágio atual' : alcancado ? ', já conquistado' : ', ainda por vir'}`}>
            <PlantaJardim tema={tema} estagio={e.indice} tamanho={46} animar={false} silhueta={!alcancado} />
            <AppText style={[estilos.passoNome, !alcancado && { color: '#9AA5A0' }]} numberOfLines={1}>{nomeDoEstagio(tema, e.indice)}</AppText>
          </View>
        );
      })}
    </ScrollView>
  );
}

export type RotaRegistro = 'TipoRefeicao' | 'ConsumoAgua' | 'AtividadeFisica';

const ACOES_REGAR: { rota: RotaRegistro; rotulo: string; icone: keyof typeof Ionicons.glyphMap; cor: string; fundo: string }[] = [
  { rota: 'TipoRefeicao', rotulo: 'Refeição', icone: 'restaurant', cor: '#D9731A', fundo: '#FFE9D2' },
  { rota: 'ConsumoAgua', rotulo: 'Água', icone: 'water', cor: '#2F7FC4', fundo: '#D8ECFD' },
  { rota: 'AtividadeFisica', rotulo: 'Atividade', icone: 'walk', cor: '#3E8E2F', fundo: '#DDF1CF' },
];

/** Explica como regar e leva direto ao registro. Antes não havia nada na tela dizendo o que faz a planta crescer. */
export function BlocoRegar({ regouHoje, aoIr, compacto = false }: { regouHoje: boolean; aoIr: (rota: RotaRegistro) => void; compacto?: boolean }) {
  const [comoFunciona, setComoFunciona] = useState(false);
  return (
    <LinearGradient colors={regouHoje ? ['#E4F5D3', '#F4FBEA'] : ['#DDEFFE', '#F3FAFF']} style={[estilos.regar, { borderColor: regouHoje ? '#BFE19B' : '#BFE0FA' }]}>
      <View style={estilos.regarTopo}>
        <View style={[estilos.regarIcone, { backgroundColor: regouHoje ? colors.primary : AZUL_AGUA }]}>
          <Ionicons name={regouHoje ? 'checkmark' : 'water'} size={24} color={regouHoje ? colors.primaryDark : colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={estilos.regarTitulo}>{regouHoje ? 'Você regou hoje!' : 'Regue o jardim hoje'}</AppText>
          <AppText style={estilos.regarSub}>
            {regouHoje
              ? 'O jardim agradece. Amanhã tem mais uma regadinha.'
              : 'Registre algo do seu dia e a planta ganha 1 regadinha. Escolha um:'}
          </AppText>
        </View>
      </View>

      {!regouHoje && (
        <View style={estilos.acoesRegar}>
          {ACOES_REGAR.map((a) => (
            <Pressable
              key={a.rota}
              onPress={() => { feedbackToque(); aoIr(a.rota); }}
              accessibilityRole="button"
              accessibilityLabel={`Registrar ${a.rotulo.toLowerCase()} para regar o jardim`}
              style={({ pressed }) => [estilos.acaoRegar, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}
            >
              <View style={[estilos.acaoRegarIcone, { backgroundColor: a.fundo }]}>
                <Ionicons name={a.icone} size={22} color={a.cor} />
              </View>
              <AppText style={estilos.acaoRegarTexto}>{a.rotulo}</AppText>
            </Pressable>
          ))}
        </View>
      )}

      {!compacto && (
        <JardimBotao
          variante="texto"
          tamanho="pequeno"
          bloco={false}
          icone={comoFunciona ? 'chevron-up' : 'help-circle-outline'}
          label={comoFunciona ? 'Fechar' : 'Como funciona?'}
          onPress={() => setComoFunciona((v) => !v)}
          style={{ alignSelf: 'center' }}
        />
      )}
      {!compacto && comoFunciona && (
        <View style={estilos.passos}>
          <PassoComoFunciona n={1} texto="Registre uma refeição, um copo de água ou uma atividade. Qualquer um já vale." />
          <PassoComoFunciona n={2} texto="Cada pessoa rega 1 vez por dia, e cada regadinha vira 1 ponto para a planta do grupo." />
          <PassoComoFunciona n={3} texto="Com os pontos a planta cresce de estágio. Ela nunca murcha, mesmo nos dias sem registro." />
        </View>
      )}
    </LinearGradient>
  );
}

function PassoComoFunciona({ n, texto }: { n: number; texto: string }) {
  return (
    <View style={estilos.passoLinha}>
      <View style={estilos.passoNumero}><AppText style={estilos.passoNumeroTexto}>{n}</AppText></View>
      <AppText style={estilos.passoTexto}>{texto}</AppText>
    </View>
  );
}


const estilos = StyleSheet.create({
  acaoRegar: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 16, backgroundColor: colors.white, borderWidth: 2, borderColor: '#DDE3DF', borderBottomWidth: 4 },
  acaoRegarIcone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  acaoRegarTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  acoesRegar: { flexDirection: 'row', gap: 10 },
  cresceu: { position: 'absolute', left: 14, right: 14, bottom: 14, zIndex: 4, backgroundColor: colors.primary, borderRadius: 16, borderBottomWidth: 4, borderBottomColor: colors.primaryShadow },
  cresceuLinha: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, minHeight: 48 },
  cresceuTexto: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },

  gotas: { position: 'absolute', top: 54, alignSelf: 'center', width: 96, height: 90, zIndex: 3 },

  linhaTempo: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  passo: { width: 76, alignItems: 'center', gap: 2, paddingVertical: 6, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  passoAtual: { borderColor: colors.primary, backgroundColor: '#F3FAEA' },
  passoLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  passoNome: { fontFamily: typography.semiBold, fontSize: 10, color: colors.primaryDark, textAlign: 'center' },

  passoNumero: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  passoNumeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  passoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#3F4F48' },

  passos: { gap: 10, paddingTop: 2 },

  regar: { borderRadius: 24, borderWidth: 2, padding: 16, gap: 12 },
  regarIcone: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  regarSub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#4B5B54', marginTop: 2 },
  regarTitulo: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  regarTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
