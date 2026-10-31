// src/features/adolescente/social/screens/NovoDesafioScreen.tsx
//
// Criar um desafio em grupo, em 2 passos curtos na mesma tela: 1) qual hábito, 2) como vai ser (equipe ou pódio).
// Ao criar, vai direto para o detalhe do novo desafio (chamar os amigos nos 2 primeiros dias).
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';
import CabecalhoTela from '../components/CabecalhoTela';
import { ROXO, mensagemErroDesafio } from '../components/DesafioPecas';
import JardimBotao from '../components/JardimBotao';
import { ATIVIDADE } from '../theme/turma';
import { criarDesafio } from '../services/desafioGrupoService';
import { METRICAS_DESAFIO, type MetricaDesafio, type ModoDesafio } from '../utils/desafioGrupo';

const MODOS: { modo: ModoDesafio; nome: string; icone: keyof typeof Ionicons.glyphMap; frase: string; detalhe: string }[] = [
  { modo: 'COOPERATIVO', nome: 'Em equipe', icone: 'people', frase: 'Todo mundo junto, sem ranking.', detalhe: 'Os dias de cada um somam e a turma ganha medalhas de bronze, prata e ouro.' },
  { modo: 'PODIO', nome: 'Com pódio', icone: 'trophy', frase: 'Quem cumpre mais dias sobe.', detalhe: 'Vale dias cumpridos, não quantidade. Quem entrar é avisado antes.' },
];

export default function NovoDesafioScreen() {
  const navigation = useNavigation<any>();
  const [metrica, setMetrica] = useState<MetricaDesafio>('AGUA');
  const [modo, setModo] = useState<ModoDesafio>('COOPERATIVO');
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function criar() {
    feedbackToque();
    setAviso(null);
    setOcupado(true);
    try {
      const id = await criarDesafio(metrica, modo);
      navigation.replace('DesafioDetalhe', { id });
    } catch (e) {
      setAviso(mensagemErroDesafio(e));
      setOcupado(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo="Novo desafio" aoVoltar={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('DesafioGrupo'))} />
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <View style={estilos.passoTopo}>
          <View style={estilos.passoNumero}><AppText style={estilos.passoNumeroTexto}>1</AppText></View>
          <AppText style={estilos.titulo}>Qual hábito a turma vai cumprir?</AppText>
        </View>
        <View style={estilos.grade}>
          {METRICAS_DESAFIO.map((m) => {
            const marcada = metrica === m.metrica;
            return (
              <Pressable key={m.metrica} onPress={() => setMetrica(m.metrica)} accessibilityRole="radio" accessibilityState={{ selected: marcada }}
                accessibilityLabel={`${m.nome}. ${m.frase}`} style={[estilos.metrica, marcada && estilos.marcada]}>
                <View style={[estilos.metricaIcone, { backgroundColor: marcada ? ROXO : '#EEF1EF' }]}>
                  <Ionicons name={m.icone as any} size={26} color={marcada ? colors.white : '#7A8A83'} />
                </View>
                <AppText style={estilos.metricaNome}>{m.nome}</AppText>
                <AppText style={estilos.miudo}>{m.frase}</AppText>
                {marcada && <View style={estilos.selo}><Ionicons name="checkmark" size={14} color={colors.white} /></View>}
              </Pressable>
            );
          })}
        </View>

        <View style={[estilos.passoTopo, { marginTop: 8 }]}>
          <View style={estilos.passoNumero}><AppText style={estilos.passoNumeroTexto}>2</AppText></View>
          <AppText style={estilos.titulo}>Como vai ser?</AppText>
        </View>
        {MODOS.map((m) => {
          const marcada = modo === m.modo;
          return (
            <Pressable key={m.modo} onPress={() => setModo(m.modo)} accessibilityRole="radio" accessibilityState={{ selected: marcada }}
              accessibilityLabel={`${m.nome}. ${m.frase} ${m.detalhe}`} style={[estilos.modo, marcada && estilos.marcada]}>
              <View style={[estilos.modoIcone, { backgroundColor: marcada ? ROXO : '#EEF1EF' }]}>
                <Ionicons name={m.icone} size={26} color={marcada ? colors.white : '#7A8A83'} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <AppText style={estilos.metricaNome}>{m.nome}</AppText>
                <AppText style={estilos.frase}>{m.frase}</AppText>
                <AppText style={estilos.miudo}>{m.detalhe}</AppText>
              </View>
              {marcada && <Ionicons name="checkmark-circle" size={24} color={ROXO} />}
            </Pressable>
          );
        })}

        <View style={estilos.nota}>
          <Ionicons name="shield-checkmark" size={18} color={ATIVIDADE.desafio.cor} />
          <AppText style={estilos.notaTexto}>Vale sempre a meta de cada um, então ninguém precisa fazer mais que o seu. Depois de criar, chame os amigos nos 2 primeiros dias.</AppText>
        </View>

        {!!aviso && (
          <View style={estilos.msgCaixa} accessibilityRole="alert">
            <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
            <AppText style={estilos.msgTexto}>{aviso}</AppText>
          </View>
        )}

        <JardimBotao icone="flag" label="COMEÇAR DESAFIO" carregando={ocupado} onPress={() => void criar()} />
        <JardimBotao variante="contorno" label="CANCELAR" desabilitado={ocupado} onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('DesafioGrupo'))} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6F8F5' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48, gap: 12 },
  passoTopo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passoNumero: { width: 26, height: 26, borderRadius: 13, backgroundColor: ROXO, alignItems: 'center', justifyContent: 'center' },
  passoNumeroTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metrica: { width: '47.5%', backgroundColor: colors.white, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E4E9E6', padding: 12, gap: 4, alignItems: 'flex-start' },
  marcada: { borderColor: ROXO, backgroundColor: '#FAF8FF' },
  metricaIcone: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  metricaNome: { fontFamily: typography.bold, fontSize: 14.5, color: colors.primaryDark },
  miudo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: '#6B7B74' },
  frase: { fontFamily: typography.semiBold, fontSize: 13, color: '#3F4F48' },
  selo: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: 11, backgroundColor: ROXO, alignItems: 'center', justifyContent: 'center' },
  modo: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E4E9E6', padding: 14 },
  modoIcone: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  nota: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 14, backgroundColor: ATIVIDADE.desafio.fundo },
  notaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: '#4B3F73' },
  msgCaixa: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#EAF5DD' },
  msgTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
});
