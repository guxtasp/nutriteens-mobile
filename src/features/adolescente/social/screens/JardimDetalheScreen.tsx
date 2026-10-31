// src/features/adolescente/social/screens/JardimDetalheScreen.tsx
//
// Um jardim aberto. Duas abas para não empilhar tudo:
//   • "Jardim": a planta grande, o progresso, o bloco de regar e os 7 estágios;
//   • "Grupo": quem cuida do jardim, convidar amigo e sair.
// A planta SÓ CRESCE e nunca murcha. Sem ranking, sem totais por pessoa e sem apontar quem não regou.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { feedbackConquista, feedbackToque } from '../../../../shared/audio/feedback';
import AbasSegmentadas from '../components/AbasSegmentadas';
import { AvatarSocialView } from '../components/AvatarSocialView';
import CabecalhoTela from '../components/CabecalhoTela';
import { AZUL_AGUA, AvisoCresceu, BlocoRegar, CEU, Gotas, LinhaDoTempo, mensagemErroJardim, nomeDoTema } from '../components/JardimPecas';
import JardimBotao from '../components/JardimBotao';
import PlantaJardim from '../components/PlantaJardim';
import { listarAmigos, type AmigoSocial } from '../services/socialService';
import { convidarParaJardim, listarJardins, regarJardinsSeHojeContou, sairDoJardim } from '../services/jardimService';
import {
  ESTAGIOS_JARDIM, MAX_MEMBROS_JARDIM, estagioDoJardim, euRegueiHoje, faltaRegarHoje, mensagemConviteJardim, nomeDoEstagio, progressoDoJardim,
  textoRegaHoje, type Jardim,
} from '../utils/jardim';

type Aba = 'jardim' | 'grupo';

export default function JardimDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;
  const { userId } = useAuth();
  const [aba, setAba] = useState<Aba>('jardim');
  const [j, setJ] = useState<Jardim | null>(null);
  const [amigos, setAmigos] = useState<AmigoSocial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [convidando, setConvidando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [cresceu, setCresceu] = useState(false);

  const carregar = useCallback(async () => {
    try {
      let js = await listarJardins();
      if (userId && faltaRegarHoje(js) && (await regarJardinsSeHojeContou(userId, formatarDataISO(new Date())))) {
        js = await listarJardins();
      }
      const am = await listarAmigos().catch(() => [] as AmigoSocial[]);
      setJ(js.find((x) => x.id === id && x.situacao === 'ativo') ?? null);
      setAmigos(am);
      setErro(null);
    } catch {
      setErro('Não deu para carregar este jardim agora.');
    } finally {
      setCarregando(false);
    }
  }, [userId, id]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const estagio = estagioDoJardim(j?.pontos ?? 0);

  // lembra o último estágio visto neste aparelho; se subiu, comemora
  useEffect(() => {
    if (!j) return;
    let vivo = true;
    const chave = `jardim:estagio:${j.id}`;
    AsyncStorage.getItem(chave).then((v) => {
      if (!vivo) return;
      const antes = v === null ? null : Number(v);
      if (antes !== null && Number.isFinite(antes) && estagio.indice > antes) {
        setCresceu(true);
        feedbackConquista();
      }
      if (antes === null || !Number.isFinite(antes) || estagio.indice > antes) {
        void AsyncStorage.setItem(chave, String(estagio.indice)).catch(() => undefined);
      }
    }).catch(() => undefined);
    return () => { vivo = false; };
  }, [j?.id, estagio.indice]); // eslint-disable-line react-hooks/exhaustive-deps

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Jardim');
  }

  async function convidar(a: AmigoSocial) {
    if (!j) return;
    feedbackToque();
    setOcupado(true);
    try {
      const r = await convidarParaJardim(j.id, a.amizadeId);
      setMsg(mensagemConviteJardim(r, a.apelido));
      if (r === 'enviado') { setConvidando(false); await carregar(); }
    } catch (e) {
      setMsg(mensagemErroJardim(e));
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarSaida() {
    if (!j) return;
    feedbackToque();
    setOcupado(true);
    try {
      await sairDoJardim(j.id);
      voltar();
    } catch (e) {
      setMsg(mensagemErroJardim(e));
      setSaindo(false);
    } finally {
      setOcupado(false);
    }
  }

  const nomesNoJardim = new Set((j?.membros ?? []).map((m) => m.apelido));
  const disponiveis = amigos.filter((a) => !nomesNoJardim.has(a.apelido));
  const ativos = (j?.membros ?? []).filter((m) => !m.pendente);

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo={j ? nomeDoTema(j.tema) : 'Jardim'} aoVoltar={voltar} />

      {carregando ? <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} /> : erro ? (
        <View style={estilos.centro}>
          <AppText style={estilos.sub}>{erro}</AppText>
          <JardimBotao bloco={false} icone="refresh" label="TENTAR DE NOVO" onPress={() => { setCarregando(true); void carregar(); }} />
        </View>
      ) : !j ? (
        <View style={estilos.centro}>
          <AppText style={estilos.sub}>Este jardim não está mais disponível.</AppText>
          <JardimBotao bloco={false} label="VOLTAR" onPress={voltar} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <AbasSegmentadas<Aba>
            cor="#3E8E2F"
            atual={aba}
            aoMudar={setAba}
            abas={[{ chave: 'jardim', rotulo: 'Jardim' }, { chave: 'grupo', rotulo: 'Grupo', contador: ativos.length }]}
          />

          {aba === 'jardim' ? (() => {
            const { fracao, faltam, proximo } = progressoDoJardim(j.pontos);
            const nomeEstagio = nomeDoEstagio(j.tema, estagio.indice);
            return (
              <>
                <View style={estilos.cartao}>
                  <LinearGradient colors={CEU[j.tema]} style={estilos.palco}>
                    <View style={estilos.chipEstagio}>
                      <Ionicons name="leaf" size={14} color={colors.primaryDark} />
                      <AppText style={estilos.chipTexto}>{nomeEstagio}</AppText>
                    </View>
                    <View style={estilos.chipPontos} accessible accessibilityLabel={`${j.pontos} regadinhas no total`}>
                      <Ionicons name="water" size={14} color={AZUL_AGUA} />
                      <AppText style={estilos.chipTexto}>{j.pontos}</AppText>
                    </View>
                    <Gotas ativo={euRegueiHoje(j)} />
                    <PlantaJardim tema={j.tema} estagio={estagio.indice} tamanho={220} />
                    <View style={estilos.grama} />
                    {cresceu && <AvisoCresceu texto={`Seu jardim cresceu! Agora é ${nomeEstagio.toLowerCase()}.`} aoFechar={() => setCresceu(false)} />}
                  </LinearGradient>

                  <View style={estilos.corpo}>
                    <View style={estilos.tituloLinha}>
                      <AppText style={estilos.rotulo}>Estágio {estagio.indice + 1} de {ESTAGIOS_JARDIM.length}</AppText>
                    </View>
                    <View style={estilos.barraFundo}><View style={[estilos.barraCheia, { width: `${Math.max(4, Math.round(fracao * 100))}%` }]} /></View>
                    <AppText style={estilos.sub}>
                      {proximo
                        ? `Faltam ${faltam} ${faltam === 1 ? 'regadinha' : 'regadinhas'} para virar ${nomeDoEstagio(j.tema, proximo.indice).toLowerCase()}.`
                        : 'Seu jardim está completo. Continue regando para ele ficar lindo!'}
                    </AppText>
                    <AppText style={estilos.destaque}>{textoRegaHoje(j)}</AppText>
                  </View>
                </View>

                <BlocoRegar regouHoje={euRegueiHoje(j)} aoIr={(rota) => navigation.navigate(rota)} />

                <View style={estilos.cartaoSimples}>
                  <AppText style={estilos.rotulo}>Os estágios</AppText>
                  <LinhaDoTempo tema={j.tema} atual={estagio.indice} />
                </View>
              </>
            );
          })() : (
            <>
              <View style={estilos.cartaoSimples}>
                <AppText style={estilos.rotulo}>Quem cuida deste jardim</AppText>
                {j.membros.map((m) => (
                  <View key={m.apelido + (m.eu ? 'eu' : '')} style={[estilos.linhaMembro, m.pendente && { opacity: 0.55 }]} accessible accessibilityLabel={`${m.eu ? 'Você' : m.apelido}${m.pendente ? ', convite enviado' : m.regouHoje ? ', regou hoje' : ''}`}>
                    <AvatarSocialView avatar={m.avatar} size="small" />
                    <AppText style={estilos.nomeLinha} numberOfLines={1}>{m.eu ? 'Você' : m.apelido}</AppText>
                    {m.pendente ? <AppText style={estilos.miudo}>convidado</AppText> : m.regouHoje ? (
                      <View style={estilos.okPilula}><Ionicons name="water" size={12} color={AZUL_AGUA} /><AppText style={estilos.okTexto}>regou hoje</AppText></View>
                    ) : null}
                  </View>
                ))}
              </View>

              <View style={estilos.cartaoSimples}>
                {!!msg && (
                  <View style={estilos.msgCaixa} accessibilityRole="alert">
                    <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
                    <AppText style={estilos.msgTexto}>{msg}</AppText>
                  </View>
                )}

                {saindo ? (
                  <View style={estilos.confirma}>
                    <AppText style={estilos.rotulo}>Sair do jardim?</AppText>
                    <AppText style={estilos.sub}>O jardim continua crescendo com os outros amigos. Você pode voltar se alguém te convidar de novo.</AppText>
                    <View style={estilos.botoesLinha}>
                      <View style={{ flex: 1 }}><JardimBotao variante="contorno" label="FICAR" onPress={() => setSaindo(false)} desabilitado={ocupado} /></View>
                      <View style={{ flex: 1 }}><JardimBotao variante="perigo" label="SAIR" icone="exit-outline" onPress={() => void confirmarSaida()} carregando={ocupado} /></View>
                    </View>
                  </View>
                ) : convidando ? (
                  <View style={{ gap: 8 }}>
                    <AppText style={estilos.rotulo}>Convidar quem?</AppText>
                    {disponiveis.length === 0 ? (
                      <AppText style={estilos.sub}>Todos os seus amigos já estão aqui ou você ainda não tem amigos adicionados.</AppText>
                    ) : disponiveis.map((a) => (
                      <View key={a.amizadeId} style={estilos.amigoLinha}>
                        <AvatarSocialView avatar={a.avatar} size="small" />
                        <AppText style={estilos.nomeLinha} numberOfLines={1}>{a.apelido}</AppText>
                        <JardimBotao variante="suave" tamanho="pequeno" bloco={false} icone="add" label="CONVIDAR" acessibilidade={`Convidar ${a.apelido}`} onPress={() => void convidar(a)} desabilitado={ocupado} />
                      </View>
                    ))}
                    <JardimBotao variante="contorno" label="FECHAR" onPress={() => setConvidando(false)} />
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {j.membros.length < MAX_MEMBROS_JARDIM
                      ? <JardimBotao variante="primario" icone="person-add" label="CONVIDAR AMIGO" onPress={() => { setMsg(null); setConvidando(true); }} />
                      : <AppText style={estilos.miudo}>O jardim já tem {MAX_MEMBROS_JARDIM} pessoas.</AppText>}
                    <JardimBotao variante="contorno" tamanho="pequeno" icone="exit-outline" label="Sair do jardim" onPress={() => { setMsg(null); setSaindo(true); }} />
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F8FAF8' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 60, gap: 14 },
  centro: { alignItems: 'center', gap: 12, marginTop: 40, paddingHorizontal: 24 },
  cartao: { backgroundColor: colors.white, borderRadius: 24, borderWidth: 2, borderColor: '#E4E9E6', overflow: 'hidden' },
  cartaoSimples: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: '#E4E9E6', padding: 16, gap: 10 },
  palco: { alignItems: 'center', justifyContent: 'flex-end', paddingTop: 44, minHeight: 300, overflow: 'hidden' },
  grama: { position: 'absolute', left: -20, right: -20, bottom: -26, height: 52, borderRadius: 60, backgroundColor: '#A8DC73', opacity: 0.55 },
  chipEstagio: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, zIndex: 2 },
  chipPontos: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, zIndex: 2 },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  corpo: { padding: 16, gap: 10 },
  tituloLinha: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rotulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  barraFundo: { height: 12, borderRadius: 6, backgroundColor: '#F2F4F3', overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 6, backgroundColor: colors.primary },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#5A6B64' },
  miudo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: '#7A8B94' },
  destaque: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  linhaMembro: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  nomeLinha: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  okPilula: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, height: 26, borderRadius: 13, backgroundColor: '#E8F3FD' },
  okTexto: { fontFamily: typography.bold, fontSize: 12, color: '#2F7FC4' },
  amigoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F8FAF8', borderWidth: 1, borderColor: '#EEF1EE' },
  botoesLinha: { flexDirection: 'row', gap: 10 },
  confirma: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#FFF6F4', borderWidth: 1, borderColor: '#F6D5D0' },
  msgCaixa: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF5DD', borderRadius: 14, padding: 12 },
  msgTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
});
