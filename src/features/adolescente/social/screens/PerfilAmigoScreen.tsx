// src/features/adolescente/social/screens/PerfilAmigoScreen.tsx
//
// Perfil de um amigo. Mostra só o que `social_perfil_amigo` devolve: apelido,
// avatar, fase do Broxis, XP, sequência, lições e as insígnias JÁ ganhas.
// Nunca nome real, escola, nascimento ou dados de saúde (ver
// data/migration_social_perfil_amigo.sql e requisitos-social.md).
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

import { InsigniaTile } from '../../perfil/components/InsigniaTile';
import { ConquistaBadge } from '../../perfil/components/ConquistaBadge';
import { buscarFases, type Insignia } from '../../perfil/services/gamificacaoService';
import { calcularEstadoFase, FASES_PADRAO, type EstadoFase } from '../../perfil/utils/fasesMascote';

import { AvatarSocialView } from '../components/AvatarSocialView';
import { InfoButton } from '../../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { useChamaDupla } from '../hooks/useChamaDupla';
import { buscarPerfilAmigo, type PerfilAmigo } from '../services/socialService';
import { rotuloDias, rotuloLicoes } from '../utils/perfilAmigo';
import { COR_CHAMA, INFO_CHAMA_DUPLA } from '../utils/chamaDupla';

const FUNDO = '#F3F8EE';

type Props = NativeStackScreenProps<AdolescenteStackParamList, 'PerfilAmigo'>;
type Navegacao = NativeStackNavigationProp<AdolescenteStackParamList>;

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'indisponivel' } // amizade desfeita, bloqueio ou pedido não aceito
  | { tipo: 'ok'; perfil: PerfilAmigo; fase: EstadoFase };

function formatarData(d: Date | null): string {
  return d ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
}

export default function PerfilAmigoScreen() {
  const navigation = useNavigation<Navegacao>();
  const { params } = useRoute<Props['route']>();
  const { amizadeId, apelido: apelidoInicial, avatar: avatarInicial } = params;

  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [selecionada, setSelecionada] = useState<Insignia | null>(null);
  const [infoChama, setInfoChama] = useState(false);
  const [convidando, setConvidando] = useState(false);
  const chama = useChamaDupla();
  const chamaDoAmigo = chama.chamas.find((c) => c.amizadeId === amizadeId) ?? null;
  const outraDuplaAtiva = !chamaDoAmigo && chama.ativa !== null;

  async function convidarParaChama() {
    setConvidando(true);
    const r = await chama.convidar(amizadeId, apelidoInicial);
    setConvidando(false);
    Alert.alert('Chama em Dupla', r.mensagem);
  }

  const carregar = useCallback(() => {
    let ativo = true;
    (async () => {
      try {
        const [perfil, fases] = await Promise.all([
          buscarPerfilAmigo(amizadeId),
          buscarFases().catch(() => FASES_PADRAO),
        ]);
        if (!ativo) return;
        setEstado(perfil ? { tipo: 'ok', perfil, fase: calcularEstadoFase(perfil.xpTotal, fases) } : { tipo: 'indisponivel' });
      } catch (e) {
        console.error('Erro ao carregar perfil do amigo:', e);
        if (ativo) setEstado({ tipo: 'erro' });
      }
    })();
    return () => {
      ativo = false;
    };
  }, [amizadeId]);

  // recarrega ao voltar pra tela: o amigo pode ter ganhado XP/insígnias nesse meio-tempo
  useFocusEffect(carregar);

  const perfil = estado.tipo === 'ok' ? estado.perfil : null;
  const apelido = perfil?.apelido ?? apelidoInicial;
  const avatar = perfil?.avatar ?? avatarInicial;

  const doTipo = (c: Insignia['categoria']) => perfil?.insignias.filter((i) => i.categoria === c) ?? [];
  const insigniasEspeciais = doTipo('insignia');
  const marcos = doTipo('marco');
  const conquistas = doTipo('conquista');

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText style={styles.titulo}>Perfil do amigo</AppText>
          <View style={{ width: 44 }} />
        </View>

        {/* Herói: avatar escolhido pelo amigo + apelido (aparecem mesmo durante o carregamento) */}
        <View style={styles.heroi}>
          <AvatarSocialView avatar={avatar} size="xlarge" />
          <View style={styles.nomeLinha}>
            <AppText style={styles.nome}>{apelido}</AppText>
            {estado.tipo === 'ok' && (
              <View style={styles.chipFase}>
                <AppText style={styles.chipFaseTexto}>{estado.fase.atual.titulo}</AppText>
              </View>
            )}
          </View>
          {perfil?.desde && <AppText style={styles.desde}>Amigos desde {formatarData(perfil.desde)}</AppText>}
        </View>

        {estado.tipo !== 'indisponivel' && !chama.carregando && (
          <View style={styles.chamaCard}>
            <View style={styles.chamaTopo}>
              <Ionicons name="flame" size={20} color={COR_CHAMA} />
              <AppText style={styles.chamaTitulo}>Chama em Dupla</AppText>
              <InfoButton onPress={() => setInfoChama(true)} accessibilityLabel="O que é a Chama em Dupla?" />
            </View>

            {chamaDoAmigo?.situacao === 'ativa' ? (
              <AppText style={styles.chamaTexto}>
                Vocês estão com {rotuloDias(chamaDoAmigo.sequenciaAtual)} de Chama em Dupla.
              </AppText>
            ) : chamaDoAmigo?.situacao === 'enviado' ? (
              <AppText style={styles.chamaTexto}>Convite enviado. Esperando a resposta de {apelido}.</AppText>
            ) : chamaDoAmigo?.situacao === 'recebido' ? (
              <AppText style={styles.chamaTexto}>
                {apelido} convidou você! Responda na Central de Notificações da tela Amigos.
              </AppText>
            ) : outraDuplaAtiva ? (
              <AppText style={styles.chamaTexto}>Você já está em uma Chama em Dupla com outro amigo.</AppText>
            ) : (
              <>
                <AppText style={styles.chamaTexto}>Mantenha uma sequência junto com {apelido}.</AppText>
                <TouchableOpacity
                  style={styles.chamaBotao}
                  onPress={convidarParaChama}
                  disabled={convidando}
                  accessibilityRole="button"
                  accessibilityLabel={`Convidar ${apelido} para Chama em Dupla`}
                >
                  <Ionicons name="flame" size={18} color={colors.primaryDark} />
                  <AppText style={styles.botaoTexto}>Convidar para Chama em Dupla</AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {estado.tipo === 'carregando' && (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
          </View>
        )}

        {estado.tipo === 'erro' && (
          <View style={styles.aviso}>
            <Ionicons name="cloud-offline-outline" size={28} color={colors.primaryDark} />
            <AppText style={styles.avisoTitulo}>Não deu para carregar</AppText>
            <AppText style={styles.avisoTexto}>Confira sua conexão e tente de novo.</AppText>
            <TouchableOpacity
              style={styles.botao}
              onPress={() => {
                setEstado({ tipo: 'carregando' });
                carregar();
              }}
            >
              <AppText style={styles.botaoTexto}>Tentar de novo</AppText>
            </TouchableOpacity>
          </View>
        )}

        {estado.tipo === 'indisponivel' && (
          <View style={styles.aviso}>
            <Ionicons name="people-outline" size={28} color={colors.primaryDark} />
            <AppText style={styles.avisoTitulo}>Perfil indisponível</AppText>
            <AppText style={styles.avisoTexto}>Vocês não são mais amigos ou esse perfil não pode ser mostrado.</AppText>
            <TouchableOpacity style={styles.botao} onPress={() => navigation.goBack()}>
              <AppText style={styles.botaoTexto}>Voltar</AppText>
            </TouchableOpacity>
          </View>
        )}

        {estado.tipo === 'ok' && perfil && (
          <>
            {/* Números */}
            <View style={styles.grade}>
              <Numero icone="flame" cor="#F0883E" valor={rotuloDias(perfil.sequenciaAtual)} rotulo="Sequência" />
              <Numero icone="trophy" cor={colors.warning} valor={rotuloDias(perfil.maiorSequencia)} rotulo="Maior sequência" />
              <Numero icone="book" cor={colors.primaryDark} valor={rotuloLicoes(perfil.licoesConcluidas)} rotulo="Concluídas" />
              <Numero icone="leaf" cor={colors.primary} valor={`${perfil.xpTotal} XP`} rotulo="Total" />
            </View>

            {/* Evolução do Broxis */}
            <View style={styles.cardEvolucao}>
              <View style={{ flex: 1 }}>
                <AppText style={styles.evolucaoTitulo}>
                  {estado.fase.proxima ? `Rumo a ${estado.fase.proxima.titulo}` : 'Fase máxima!'}
                </AppText>
                <AppText style={styles.evolucaoSub}>
                  {estado.fase.proxima
                    ? `Faltam ${estado.fase.xpFaltando} XP para o Broxis de ${apelido} crescer`
                    : `O Broxis de ${apelido} está completamente crescido!`}
                </AppText>
                <View style={{ marginTop: 10 }}>
                  <ProgressBar progress={estado.fase.progresso} />
                </View>
              </View>
            </View>

            {perfil.insignias.length === 0 ? (
              <View style={styles.vazio}>
                <AppText style={styles.avisoTexto}>{apelido} ainda não ganhou insígnias. Que tal torcer por essa primeira?</AppText>
              </View>
            ) : (
              <>
                {insigniasEspeciais.length > 0 && (
                  <Secao titulo="INSÍGNIAS" lado={String(insigniasEspeciais.length)}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
                      {insigniasEspeciais.map((i) => (
                        <InsigniaTile key={i.id} insignia={i} onPress={setSelecionada} />
                      ))}
                    </ScrollView>
                  </Secao>
                )}

                {marcos.length > 0 && (
                  <Secao titulo="MARCOS" lado={String(marcos.length)}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.linha}>
                      {marcos.map((i) => (
                        <ConquistaBadge key={i.id} item={i} onPress={setSelecionada} />
                      ))}
                    </ScrollView>
                  </Secao>
                )}

                {conquistas.length > 0 && (
                  <Secao titulo="CONQUISTAS" lado={String(conquistas.length)}>
                    <View style={styles.gradeBadges}>
                      {conquistas.map((i) => (
                        <ConquistaBadge key={i.id} item={i} onPress={setSelecionada} />
                      ))}
                    </View>
                  </Secao>
                )}

                {selecionada && (
                  <View style={styles.detalhe}>
                    <AppText style={styles.detalheTitulo}>{selecionada.nome}</AppText>
                    {selecionada.descricao ? <AppText style={styles.detalheTexto}>{selecionada.descricao}</AppText> : null}
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
      <InfoSheet visivel={infoChama} onFechar={() => setInfoChama(false)} {...INFO_CHAMA_DUPLA} />
    </SafeAreaView>
  );
}

function Secao({ titulo, lado, children }: { titulo: string; lado: string; children: React.ReactNode }) {
  return (
    <>
      <View style={styles.secaoTopo}>
        <AppText style={styles.secaoTitulo}>{titulo}</AppText>
        <AppText style={styles.secaoLado}>{lado}</AppText>
      </View>
      {children}
    </>
  );
}

function Numero({
  icone,
  cor,
  valor,
  rotulo,
}: {
  icone: React.ComponentProps<typeof Ionicons>['name'];
  cor: string;
  valor: string;
  rotulo: string;
}) {
  return (
    <View style={styles.numero} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Ionicons name={icone} size={22} color={cor} />
      <AppText style={styles.numeroValor}>{valor}</AppText>
      <AppText style={styles.numeroRotulo}>{rotulo}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: FUNDO },
  conteudo: { paddingHorizontal: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 8 },
  titulo: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark },
  heroi: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  nomeLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  nome: { fontSize: 24, fontFamily: typography.bold, color: colors.primaryDark },
  chipFase: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  chipFaseTexto: { fontSize: 11, fontFamily: typography.bold, color: colors.primaryDark },
  desde: { marginTop: 4, fontSize: 12, fontFamily: typography.regular, color: colors.placeholder },
  centro: { paddingVertical: 50, alignItems: 'center' },
  aviso: { backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center', gap: 6, marginTop: 8 },
  avisoTitulo: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
  avisoTexto: { fontSize: 12, lineHeight: 18, color: colors.trilhaChipTexto, textAlign: 'center' },
  vazio: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginTop: 22 },
  botao: { marginTop: 10, backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 11 },
  botaoTexto: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  numero: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  numeroValor: { fontSize: 16, fontFamily: typography.bold, color: colors.primaryDark, marginTop: 4 },
  numeroRotulo: { fontSize: 11, fontFamily: typography.semiBold, color: colors.placeholder },
  cardEvolucao: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 22, padding: 18 },
  evolucaoTitulo: { fontSize: 15, fontFamily: typography.bold, color: '#fff' },
  evolucaoSub: { fontSize: 12, color: colors.textOnDarkMuted, marginTop: 2 },
  secaoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  secaoTitulo: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  secaoLado: { fontSize: 12, fontFamily: typography.semiBold, color: colors.placeholder },
  linha: { gap: 12, paddingRight: 8, paddingBottom: 10 },
  gradeBadges: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 6 },
  chamaCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 16, gap: 8 },
  chamaTopo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chamaTitulo: { flex: 1, fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  chamaTexto: { fontSize: 13, lineHeight: 19, color: colors.trilhaChipTexto },
  chamaBotao: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, marginTop: 4 },
  detalhe: { marginTop: 12, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  detalheTitulo: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  detalheTexto: { fontSize: 12, color: colors.trilhaChipTexto, marginTop: 2 },
});
