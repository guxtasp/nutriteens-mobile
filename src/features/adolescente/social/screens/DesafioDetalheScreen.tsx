// src/features/adolescente/social/screens/DesafioDetalheScreen.tsx
//
// Um desafio em grupo, aberto. Duas abas para não empilhar tudo:
//   • "Desafio": o progresso (medalhas da turma OU pódio), "Hoje", "Sua semana" e o botão de cumprir;
//   • "Turma": quem está no desafio, chamar amigo e sair.
// Cooperativo por padrão; pódio opcional vale por DIAS CUMPRIDOS e vem avisado no convite. Nunca mostra quem faltou.
// Ao acabar, "jogar de novo com a turma" cria o próximo desafio e convida os mesmos amigos com um toque.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { formatarDataISO } from '../../../../shared/utils/data';
import { feedbackConquista, feedbackToque } from '../../../../shared/audio/feedback';
import AbasSegmentadas from '../components/AbasSegmentadas';
import { AvatarSocialView } from '../components/AvatarSocialView';
import CabecalhoTela from '../components/CabecalhoTela';
import { FaixaDias, MembrosHoje, ROTA_REGISTRO, ROXO, mensagemErroDesafio } from '../components/DesafioPecas';
import JardimBotao from '../components/JardimBotao';
import PodioTurma from '../components/PodioTurma';
import ProgressoTurma from '../components/ProgressoTurma';
import TrofeuCard from '../components/TrofeuCard';
import { ATIVIDADE } from '../theme/turma';
import { trofeuDoDesafio } from '../utils/trofeu';
import { listarAmigos, type AmigoSocial } from '../services/socialService';
import { convidarParaDesafio, listarDesafios, renovarDesafio, sairDoDesafio, sincronizarDesafiosHoje } from '../services/desafioGrupoService';
import {
  MARCOS, METRICAS_DESAFIO, ativosDoDesafio, diasRestantes, fraseDaMetrica, jaAcabou, marcoAtingido, mensagemConviteDesafio, nomeDaMetrica,
  podeConvidar, textoDoDia, type DesafioGrupo, type MarcoDesafio,
} from '../utils/desafioGrupo';

type Aba = 'desafio' | 'turma';

export default function DesafioDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id: string | undefined = route.params?.id;
  const { userId } = useAuth();
  const hoje = formatarDataISO(new Date());
  const [aba, setAba] = useState<Aba>('desafio');
  const [d, setD] = useState<DesafioGrupo | null>(null);
  const [amigos, setAmigos] = useState<AmigoSocial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [convidando, setConvidando] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [subiu, setSubiu] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      if (userId) await sincronizarDesafiosHoje(userId, hoje);
      const [ds, am] = await Promise.all([listarDesafios(), listarAmigos().catch(() => [] as AmigoSocial[])]);
      setD(ds.find((x) => x.id === id && x.situacao === 'ativo') ?? null);
      setAmigos(am);
      setErro(null);
    } catch {
      setErro('Não deu para carregar este desafio agora.');
    } finally {
      setCarregando(false);
    }
  }, [userId, hoje, id]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const ativos = d ? ativosDoDesafio(d) : [];
  const eu = ativos.find((m) => m.eu);
  const acabou = d ? jaAcabou(d, hoje) : false;
  const marco: MarcoDesafio = d ? marcoAtingido(d.totalDias, ativos.length) : 'NENHUM';

  // lembra o maior marco visto neste aparelho; se subiu, comemora (só no modo em equipe)
  useEffect(() => {
    if (!d || acabou || d.modo === 'PODIO') return;
    let vivo = true;
    const chave = `desafio:marco:${d.id}`;
    const ordem: MarcoDesafio[] = ['NENHUM', 'BRONZE', 'PRATA', 'OURO'];
    AsyncStorage.getItem(chave).then((v) => {
      if (!vivo) return;
      const antes = ordem.indexOf((v as MarcoDesafio) ?? 'NENHUM');
      if (v !== null && ordem.indexOf(marco) > antes) {
        setSubiu(`A turma conquistou a medalha de ${MARCOS.find((m) => m.marco === marco)?.nome.toLowerCase()}!`);
        feedbackConquista();
      }
      if (ordem.indexOf(marco) > Math.max(0, antes) || v === null) void AsyncStorage.setItem(chave, marco).catch(() => undefined);
    }).catch(() => undefined);
    return () => { vivo = false; };
  }, [d, marco, acabou]);

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('DesafioGrupo');
  }

  async function executar(f: () => Promise<void>) {
    feedbackToque();
    setOcupado(true);
    try { await f(); } catch (e) { setMsg(mensagemErroDesafio(e)); } finally { setOcupado(false); }
  }

  const nomes = new Set((d?.membros ?? []).map((m) => m.apelido));
  const disponiveis = amigos.filter((a) => !nomes.has(a.apelido));

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo={d ? nomeDaMetrica(d.metrica) : 'Desafio'} aoVoltar={voltar} />

      {carregando ? <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} /> : erro ? (
        <View style={estilos.centro}>
          <AppText style={estilos.sub}>{erro}</AppText>
          <JardimBotao bloco={false} icone="refresh" label="TENTAR DE NOVO" onPress={() => { setCarregando(true); void carregar(); }} />
        </View>
      ) : !d ? (
        <View style={estilos.centro}>
          <AppText style={estilos.sub}>Este desafio não está mais disponível.</AppText>
          <JardimBotao bloco={false} label="VOLTAR" onPress={voltar} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
          <View style={estilos.hero}>
            <View style={estilos.iconeMetrica}><Ionicons name={(METRICAS_DESAFIO.find((m) => m.metrica === d.metrica)?.icone ?? 'flag') as any} size={24} color={colors.white} /></View>
            <View style={{ flex: 1 }}>
              <AppText style={estilos.sub}>{fraseDaMetrica(d.metrica)}</AppText>
              <View style={estilos.modoLinha}>
                <Ionicons name={d.modo === 'PODIO' ? 'trophy' : 'people'} size={13} color="#6B7B74" />
                <AppText style={estilos.miudo}>{d.modo === 'PODIO' ? 'Com pódio' : 'Em equipe'} · {ativos.length} {ativos.length === 1 ? 'pessoa' : 'pessoas'}</AppText>
              </View>
            </View>
            <View style={[estilos.chipTempo, acabou && { backgroundColor: '#E8F3DC' }]}>
              <AppText style={estilos.chipTempoTexto}>{acabou ? 'Acabou' : diasRestantes(d.fim, hoje) <= 0 ? 'Último dia' : `${diasRestantes(d.fim, hoje)} ${diasRestantes(d.fim, hoje) === 1 ? 'dia' : 'dias'}`}</AppText>
            </View>
          </View>

          <AbasSegmentadas<Aba>
            cor={ROXO}
            atual={aba}
            aoMudar={setAba}
            abas={[{ chave: 'desafio', rotulo: 'Desafio' }, { chave: 'turma', rotulo: 'Turma', contador: ativos.length }]}
          />

          {aba === 'desafio' ? (
            <>
              {!!subiu && (
                <Pressable onPress={() => setSubiu(null)} accessibilityRole="button" accessibilityLabel={`${subiu} Toque para fechar.`} style={estilos.subiu}>
                  <Ionicons name="sparkles" size={18} color={colors.primaryDark} />
                  <AppText style={estilos.subiuTexto}>{subiu}</AppText>
                </Pressable>
              )}

              <View style={estilos.cartao}>
                {d.modo === 'PODIO' ? <PodioTurma d={d} acabou={acabou} /> : <ProgressoTurma total={d.totalDias} ativos={ativos.length} acabou={acabou} />}
              </View>

              {(() => { const t = trofeuDoDesafio(d, acabou); return t ? <TrofeuCard trofeu={t} /> : null; })()}

              <View style={estilos.cartao}>
                <AppText style={estilos.rotulo}>Hoje</AppText>
                {!acabou && <AppText style={estilos.destaque}>{textoDoDia(d)}</AppText>}
                <MembrosHoje membros={d.membros} />
                {!acabou && eu && !eu.fezHoje && (
                  <JardimBotao variante="primario" icone="flash" label="CUMPRIR HOJE" onPress={() => navigation.navigate(ROTA_REGISTRO[d.metrica])} />
                )}
              </View>

              <View style={estilos.cartao}>
                <AppText style={estilos.rotulo}>Sua semana</AppText>
                <FaixaDias d={d} hoje={hoje} />
                <AppText style={estilos.miudo}>{d.meusDias.length} de 7 dias cumpridos por você.</AppText>
              </View>

              {acabou && (
                <View style={estilos.cartao}>
                  <AppText style={estilos.sub}>
                    {marco === 'OURO' ? 'Ouro! Você ganhou as insígnias “Na turma” e “Turma de ouro”.' : 'Você ganhou a insígnia “Na turma”. Cada dia cumprido contou para a turma.'}
                  </AppText>
                  {!!msg && <AppText style={estilos.sub}>{msg}</AppText>}
                  <JardimBotao icone="refresh" label="JOGAR DE NOVO COM A TURMA" carregando={ocupado}
                    onPress={() => void executar(async () => { const novo = await renovarDesafio(d.id); navigation.replace('DesafioDetalhe', { id: novo }); })} />
                </View>
              )}
            </>
          ) : (
            <>
              <View style={estilos.cartao}>
                <AppText style={estilos.rotulo}>Quem está no desafio</AppText>
                {d.membros.map((m) => (
                  <View key={m.apelido + (m.eu ? 'eu' : '')} style={[estilos.linhaMembro, m.pendente && { opacity: 0.55 }]}>
                    <AvatarSocialView avatar={m.avatar} size="small" />
                    <AppText style={estilos.nomeLinha} numberOfLines={1}>{m.eu ? 'Você' : m.apelido}</AppText>
                    {m.pendente ? <AppText style={estilos.miudo}>convidado</AppText> : !acabou && m.fezHoje ? (
                      <View style={estilos.okPilula}><Ionicons name="checkmark" size={13} color={colors.primaryDark} /><AppText style={estilos.okTexto}>hoje</AppText></View>
                    ) : null}
                  </View>
                ))}
              </View>

              {!acabou && (
                <View style={estilos.cartao}>
                  {!!msg && (
                    <View style={estilos.msgCaixa} accessibilityRole="alert">
                      <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
                      <AppText style={estilos.msgTexto}>{msg}</AppText>
                    </View>
                  )}
                  {podeConvidar(d, hoje) ? (convidando ? (
                    <View style={{ gap: 8 }}>
                      <AppText style={estilos.rotulo}>Quem você quer chamar?</AppText>
                      {disponiveis.length === 0 ? <AppText style={estilos.sub}>Todos os seus amigos já estão aqui ou foram convidados.</AppText> : disponiveis.map((a) => (
                        <Pressable key={a.amizadeId} disabled={ocupado} accessibilityRole="button" accessibilityLabel={`Convidar ${a.apelido}`}
                          onPress={() => void executar(async () => {
                            const r = await convidarParaDesafio(d.id, a.amizadeId);
                            setMsg(mensagemConviteDesafio(r, a.apelido));
                            if (r === 'enviado') { setConvidando(false); await carregar(); }
                          })}
                          style={({ pressed }) => [estilos.amigo, pressed && { opacity: 0.7 }]}>
                          <AvatarSocialView avatar={a.avatar} size="small" />
                          <AppText style={estilos.nomeLinha} numberOfLines={1}>{a.apelido}</AppText>
                          <Ionicons name="paper-plane" size={18} color={ROXO} />
                        </Pressable>
                      ))}
                      <JardimBotao variante="texto" tamanho="pequeno" label="FECHAR" onPress={() => setConvidando(false)} />
                    </View>
                  ) : (
                    <JardimBotao variante="suave" icone="person-add" label="CHAMAR UM AMIGO" onPress={() => { setMsg(null); setConvidando(true); }} />
                  )) : (
                    <AppText style={estilos.miudo}>Os convites valem só nos 2 primeiros dias, e o desafio comporta até 5 pessoas.</AppText>
                  )}

                  {saindo ? (
                    <View style={estilos.confirma}>
                      <AppText style={estilos.sub}>Sair do desafio? Os dias que você já cumpriu continuam valendo para a turma.</AppText>
                      <View style={estilos.botoesLinha}>
                        <View style={{ flex: 1 }}><JardimBotao variante="contorno" label="FICAR" onPress={() => setSaindo(false)} /></View>
                        <View style={{ flex: 1 }}><JardimBotao variante="perigo" label="SAIR" carregando={ocupado} onPress={() => void executar(async () => { await sairDoDesafio(d.id); voltar(); })} /></View>
                      </View>
                    </View>
                  ) : (
                    <JardimBotao variante="texto" tamanho="pequeno" label="Sair do desafio" onPress={() => setSaindo(true)} />
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F6F8F5' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48, gap: 14 },
  centro: { alignItems: 'center', gap: 12, marginTop: 40, paddingHorizontal: 24 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconeMetrica: { width: 48, height: 48, borderRadius: 24, backgroundColor: ROXO, alignItems: 'center', justifyContent: 'center' },
  modoLinha: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  chipTempo: { paddingHorizontal: 10, height: 28, borderRadius: 14, backgroundColor: ATIVIDADE.desafio.fundo, alignItems: 'center', justifyContent: 'center' },
  chipTempoTexto: { fontFamily: typography.bold, fontSize: 12, color: ROXO },
  cartao: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: '#E4E9E6', padding: 16, gap: 12 },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: '#4B5B54' },
  miudo: { fontFamily: typography.regular, fontSize: 12, lineHeight: 16, color: '#6B7B74' },
  rotulo: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 0.8, color: '#5A6B64', textTransform: 'uppercase' },
  destaque: { fontFamily: typography.bold, fontSize: 13.5, color: ROXO },
  subiu: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#EAF5DD' },
  subiuTexto: { flex: 1, fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  linhaMembro: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  nomeLinha: { flex: 1, fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  okPilula: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, height: 26, borderRadius: 13, backgroundColor: '#EAF5DD' },
  okTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  amigo: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F8FAF8', borderWidth: 1, borderColor: '#EEF1EE' },
  botoesLinha: { flexDirection: 'row', gap: 10 },
  confirma: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: '#FFF6F4', borderWidth: 1, borderColor: '#F6D5D0' },
  msgCaixa: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: '#EAF5DD' },
  msgTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
});
