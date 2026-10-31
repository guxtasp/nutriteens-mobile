// src/features/adolescente/social/screens/DesafioGrupoScreen.tsx
//
// LISTA dos desafios em grupo. Antes esta tela mostrava tudo junto (barra, dias, membros, convite, saída de cada
// desafio); com 3 desafios virava uma rolagem enorme. Agora cada desafio é um cartão compacto e toca para abrir
// (DesafioDetalheScreen). Criar fica em outra tela (NovoDesafioScreen). Duas abas: "Desafios" e "Troféus".
// Confirmações usam painéis dentro da tela (Alert.alert com botões não funciona na web).
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { feedbackToque } from '../../../../shared/audio/feedback';
import AbasSegmentadas from '../components/AbasSegmentadas';
import CabecalhoTela from '../components/CabecalhoTela';
import { ROXO, mensagemErroDesafio } from '../components/DesafioPecas';
import DesafioResumoCard from '../components/DesafioResumoCard';
import JardimBotao from '../components/JardimBotao';
import TrofeusTemporada from '../components/TrofeusTemporada';
import { ATIVIDADE } from '../theme/turma';
import type { Trofeu } from '../utils/trofeu';
import { listarDesafios, listarTrofeus, responderConviteDesafio, sincronizarDesafiosHoje } from '../services/desafioGrupoService';
import { MAX_DESAFIOS_ATIVOS, fraseDaMetrica, jaAcabou, nomeDaMetrica, type DesafioGrupo } from '../utils/desafioGrupo';

type Aba = 'desafios' | 'trofeus';

export default function DesafioGrupoScreen() {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();
  const hoje = formatarDataISO(new Date());
  const [aba, setAba] = useState<Aba>('desafios');
  const [desafios, setDesafios] = useState<DesafioGrupo[]>([]);
  const [trofeus, setTrofeus] = useState<Trofeu[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      // marca o dia de hoje se a meta já foi batida (registrou antes de criar o desafio, ou a Home ainda não abriu)
      if (userId) await sincronizarDesafiosHoje(userId, hoje);
      const [ds, tr] = await Promise.all([listarDesafios(), listarTrofeus().catch(() => [] as Trofeu[])]);
      setDesafios(ds);
      setTrofeus(tr);
      setErro(null);
    } catch {
      setErro('Não deu para carregar seus desafios agora.');
    } finally {
      setCarregando(false);
    }
  }, [userId, hoje]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const convites = desafios.filter((d) => d.situacao === 'convidado');
  const andamento = desafios.filter((d) => d.situacao === 'ativo' && !jaAcabou(d, hoje));
  const acabados = desafios.filter((d) => d.situacao === 'ativo' && jaAcabou(d, hoje));
  const cheio = andamento.length >= MAX_DESAFIOS_ATIVOS;

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Social');
  }

  async function responder(d: DesafioGrupo, aceitar: boolean) {
    feedbackToque();
    setAviso(null);
    setOcupado(true);
    try {
      const ok = await responderConviteDesafio(d.id, aceitar);
      if (!ok && aceitar) setAviso('Não deu para entrar: o desafio encheu, o prazo de entrada passou ou você já está em 3 desafios.');
      await carregar();
    } catch (e) {
      setAviso(mensagemErroDesafio(e));
    } finally {
      setOcupado(false);
    }
  }

  const abrir = (d: DesafioGrupo) => navigation.navigate('DesafioDetalhe', { id: d.id });

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo="Desafio em grupo" aoVoltar={voltar} />

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <AbasSegmentadas<Aba>
          cor={ROXO}
          atual={aba}
          aoMudar={setAba}
          abas={[
            { chave: 'desafios', rotulo: 'Desafios', contador: andamento.length + convites.length },
            { chave: 'trofeus', rotulo: 'Troféus', contador: trofeus.length },
          ]}
        />

        {!!aviso && (
          <View style={estilos.msgCaixa} accessibilityRole="alert">
            <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
            <AppText style={estilos.msgTexto}>{aviso}</AppText>
          </View>
        )}

        {carregando ? <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} /> : erro ? (
          <View style={{ alignItems: 'center', gap: 12, marginTop: 30 }}>
            <AppText style={estilos.sub}>{erro}</AppText>
            <JardimBotao bloco={false} icone="refresh" label="TENTAR DE NOVO" onPress={() => { setCarregando(true); void carregar(); }} />
          </View>
        ) : aba === 'trofeus' ? (
          <TrofeusTemporada trofeus={trofeus} />
        ) : (
          <>
            {convites.map((d) => (
              <View key={d.id} style={estilos.convite}>
                <AppText style={estilos.tituloCartao}>{d.convidadoPor ?? 'Um amigo'} te chamou para “{nomeDaMetrica(d.metrica)}”</AppText>
                <AppText style={estilos.sub}>{fraseDaMetrica(d.metrica)} por 7 dias, cada um na sua meta. {d.modo === 'PODIO' ? 'Este desafio tem pódio por dias cumpridos.' : 'Aqui todo mundo joga junto, sem ranking.'}</AppText>
                <View style={estilos.botoesLinha}>
                  <View style={{ flex: 1 }}><JardimBotao variante="contorno" label="AGORA NÃO" onPress={() => void responder(d, false)} desabilitado={ocupado} /></View>
                  <View style={{ flex: 1 }}><JardimBotao variante="primario" icone="checkmark" label="ENTRAR" onPress={() => void responder(d, true)} carregando={ocupado} /></View>
                </View>
              </View>
            ))}

            {andamento.length > 0 && <AppText style={estilos.secao}>Em andamento</AppText>}
            {andamento.map((d) => <DesafioResumoCard key={d.id} d={d} hoje={hoje} aoAbrir={() => abrir(d)} />)}

            {acabados.length > 0 && <AppText style={estilos.secao}>Já acabaram</AppText>}
            {acabados.map((d) => <DesafioResumoCard key={d.id} d={d} hoje={hoje} aoAbrir={() => abrir(d)} />)}

            {andamento.length === 0 && acabados.length === 0 && convites.length === 0 && (
              <View style={estilos.vazio}>
                <View style={estilos.iconeVazio}><Ionicons name="people" size={34} color={colors.white} /></View>
                <AppText style={estilos.tituloCartao}>Monte uma turma</AppText>
                <AppText style={[estilos.sub, { textAlign: 'center' }]}>Escolham um hábito e cumpram juntos por 7 dias, cada um na sua meta. Vocês ganham medalhas e insígnias.</AppText>
              </View>
            )}

            {cheio ? (
              <AppText style={[estilos.sub, { textAlign: 'center' }]}>Você está em {MAX_DESAFIOS_ATIVOS} desafios. Termine ou saia de um para criar outro.</AppText>
            ) : (
              <JardimBotao
                variante={andamento.length === 0 && acabados.length === 0 ? 'primario' : 'suave'}
                icone="add"
                label="NOVO DESAFIO"
                onPress={() => { setAviso(null); navigation.navigate('NovoDesafio'); }}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6F8F5' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48, gap: 14 },
  secao: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.8, color: '#5A6B64', textTransform: 'uppercase', marginTop: 4 },
  convite: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 2, borderColor: ROXO, padding: 16, gap: 12 },
  tituloCartao: { fontFamily: typography.bold, fontSize: 16, lineHeight: 21, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#4B5B54' },
  botoesLinha: { flexDirection: 'row', gap: 10 },
  msgCaixa: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#EAF5DD' },
  msgTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
  vazio: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  iconeVazio: { width: 72, height: 72, borderRadius: 36, backgroundColor: ATIVIDADE.desafio.cor, alignItems: 'center', justifyContent: 'center' },
});
