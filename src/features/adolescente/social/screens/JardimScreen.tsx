// src/features/adolescente/social/screens/JardimScreen.tsx
//
// LISTA dos jardins do grupo. Cada jardim é um cartão compacto (plantinha, estágio, progresso, quem regou) e toca
// para abrir no detalhe (JardimDetalheScreen). Escolher a planta fica em outra tela (NovoJardimScreen).
// Regar = registrar algo no dia (refeição, água ou atividade): o bloco do topo leva direto ao registro.
// A planta SÓ CRESCE e nunca murcha; sem ranking e sem apontar quem não regou (ver utils/jardim.ts).
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { feedbackToque } from '../../../../shared/audio/feedback';
import CabecalhoTela from '../components/CabecalhoTela';
import { AZUL_AGUA, BlocoRegar, CEU, mensagemErroJardim, nomeDoTema } from '../components/JardimPecas';
import JardimBotao from '../components/JardimBotao';
import JardimResumoCard from '../components/JardimResumoCard';
import PlantaJardim from '../components/PlantaJardim';
import { listarJardins, regarJardinsSeHojeContou, responderConviteJardim } from '../services/jardimService';
import { MAX_JARDINS_ATIVOS, estagioDoJardim, euRegueiHoje, faltaRegarHoje, type Jardim } from '../utils/jardim';

export default function JardimScreen() {
  const navigation = useNavigation<any>();
  const { userId } = useAuth();
  const [jardins, setJardins] = useState<Jardim[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      let js = await listarJardins();
      // Se você já registrou algo hoje mas o jardim ainda não foi regado (registrou antes de criar o jardim, ou a
      // Home ainda não foi aberta), rega agora e recarrega. Antes só a Home regava, e a planta parecia "travada".
      if (userId && faltaRegarHoje(js) && (await regarJardinsSeHojeContou(userId, formatarDataISO(new Date())))) {
        js = await listarJardins();
      }
      setJardins(js);
      setErro(null);
    } catch {
      setErro('Não deu para carregar seus jardins agora.');
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const convites = jardins.filter((j) => j.situacao === 'convidado');
  const ativos = jardins.filter((j) => j.situacao === 'ativo');
  const regouHoje = ativos.length > 0 && ativos.every(euRegueiHoje);
  const cheio = ativos.length >= MAX_JARDINS_ATIVOS;

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Social');
  }

  async function responder(j: Jardim, aceitar: boolean) {
    feedbackToque();
    setAviso(null);
    setOcupado(true);
    try {
      const ok = await responderConviteJardim(j.id, aceitar);
      if (!ok && aceitar) setAviso('Não deu para entrar: o jardim encheu ou você já está em 3 jardins.');
      await carregar();
    } catch (e) {
      setAviso(mensagemErroJardim(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo="Jardim do grupo" aoVoltar={voltar} />

      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
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
        ) : (
          <>
            {ativos.length > 0 && <BlocoRegar compacto regouHoje={regouHoje} aoIr={(rota) => navigation.navigate(rota)} />}

            {convites.map((j) => {
              const gente = j.membros.filter((m) => !m.pendente).length;
              return (
                <View key={j.id} style={estilos.convite}>
                  <View style={estilos.conviteTopo}>
                    <LinearGradient colors={CEU[j.tema]} style={estilos.conviteCeu}>
                      <PlantaJardim tema={j.tema} estagio={estagioDoJardim(j.pontos).indice} tamanho={60} animar={false} />
                    </LinearGradient>
                    <View style={{ flex: 1, gap: 4 }}>
                      <AppText style={estilos.tituloCartao}>{j.convidadoPor ?? 'Um amigo'} te chamou para um jardim de {nomeDoTema(j.tema).toLowerCase()}</AppText>
                      <AppText style={estilos.sub}>{gente} {gente === 1 ? 'pessoa já está' : 'pessoas já estão'} cuidando dele.</AppText>
                    </View>
                  </View>
                  <View style={estilos.botoesLinha}>
                    <View style={{ flex: 1 }}><JardimBotao variante="contorno" label="AGORA NÃO" onPress={() => void responder(j, false)} desabilitado={ocupado} /></View>
                    <View style={{ flex: 1 }}><JardimBotao variante="primario" icone="checkmark" label="ENTRAR" onPress={() => void responder(j, true)} carregando={ocupado} /></View>
                  </View>
                </View>
              );
            })}

            {ativos.length > 0 && <AppText style={estilos.secao}>Seus jardins</AppText>}
            {ativos.map((j) => <JardimResumoCard key={j.id} j={j} aoAbrir={() => navigation.navigate('JardimDetalhe', { id: j.id })} />)}

            {ativos.length === 0 && convites.length === 0 && (
              <View style={estilos.vazio}>
                <PlantaJardim tema="BROCOLIS" estagio={0} tamanho={170} />
                <AppText style={estilos.tituloCartao}>Plante o primeiro jardim</AppText>
                <AppText style={[estilos.sub, { textAlign: 'center' }]}>Escolha uma planta e convide amigos. Cada refeição, copo de água ou atividade que vocês registram rega a planta, e quanto mais gente rega, mais ela cresce.</AppText>
              </View>
            )}

            {cheio ? (
              <AppText style={[estilos.sub, { textAlign: 'center' }]}>Você participa de {MAX_JARDINS_ATIVOS} jardins. Saia de um para criar outro.</AppText>
            ) : (
              <JardimBotao variante={ativos.length === 0 ? 'primario' : 'suave'} icone="add" label="NOVO JARDIM" onPress={() => { setAviso(null); navigation.navigate('NovoJardim'); }} />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F8FAF8' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 60, gap: 14 },
  secao: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.8, color: '#5A6B64', textTransform: 'uppercase', marginTop: 4 },
  msgCaixa: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF5DD', borderRadius: 14, padding: 12 },
  msgTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#5A6B64' },
  tituloCartao: { fontFamily: typography.bold, fontSize: 16, lineHeight: 21, color: colors.primaryDark },
  convite: { backgroundColor: colors.white, borderRadius: 22, padding: 14, borderWidth: 2, borderColor: AZUL_AGUA, gap: 14 },
  conviteTopo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conviteCeu: { width: 76, height: 76, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  botoesLinha: { flexDirection: 'row', gap: 10 },
  vazio: { alignItems: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 8 },
});
