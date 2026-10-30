// src/features/conteudo/screens/ReceitasListaScreen.tsx
// Lista de receitas do painel (Admin e Nutricionista): cartões com foto, dados da receita,
// avisos do que falta e o status no fluxo de aprovação. Busca, filtros e ordem.
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { CampoBusca, ChipsFiltro, VazioPainel } from '../../../shared/painel/components/ControlesLista';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { transicionar } from '../services/fluxoService';
import { listarReceitasDoPainel } from '../services/receitasListaService';
import { obterPapelAtual } from '../services/conteudoService';
import { useCoresTom } from '../hooks/useCoresTom';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  ACOES_DECISAO, STATUS_LABEL, acoesPermitidas, formatarDataHora, rotuloAcao, tomDoStatus,
  type AcaoFluxo, type PapelPainel, type StatusFluxo, type TomStatus,
} from '../utils/fluxo';
import {
  FILTROS_RECEITAS_VAZIOS, ROTULO_DIFICULDADE, avisosReceita, contarPorStatus, filtrarReceitas,
  type FiltrosReceitas, type ReceitaDaLista,
} from '../utils/receitasLista';


const ORDEM_STATUS: StatusFluxo[] = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO', 'REJEITADO', 'ARQUIVADO'];
const OP_DIFICULDADE = [{ chave: 'TODAS', label: 'Qualquer dificuldade' }, { chave: 'FACIL', label: 'Fácil' }, { chave: 'MEDIO', label: 'Médio' }, { chave: 'DIFICIL', label: 'Difícil' }];
const OP_ORDEM = [{ chave: 'RECENTES', label: 'Mais recentes' }, { chave: 'AZ', label: 'A–Z' }];

function Info({ icone, texto }: { icone: React.ComponentProps<typeof Ionicons>['name']; texto: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.info}>
      <Ionicons name={icone} size={13} color={tema.texto} />
      <AppText style={styles.infoTexto}>{texto}</AppText>
    </View>
  );
}

function CartaoReceita({ item, papel, navigation, origem, aoMudar }: { item: ReceitaDaLista; papel: PapelPainel; navigation: any; origem: string; aoMudar: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const coresTom = useCoresTom();
  const tom = coresTom[tomDoStatus(item.status)];
  const todas = acoesPermitidas(papel, item.status);
  const decide = todas.some((a) => ACOES_DECISAO.includes(a)); // decisões só dentro da página, depois de ler
  const fluxo = todas.filter((a) => !ACOES_DECISAO.includes(a));
  const d = item.dados;
  const avisos = avisosReceita(d);

  async function executar(acao: AcaoFluxo) {
    setOcupado(true);
    setErro(null);
    try {
      await transicionar(item.tipo, item.conteudoId, acao);
      aoMudar();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível concluir a ação.');
    } finally {
      setOcupado(false);
    }
  }
  const abrir = () => navigation.navigate('ConteudoDetalhe', { tipo: item.tipo, conteudoId: item.conteudoId, origem });
  const editar = () => navigation.navigate('EditarReceita', { receitaId: item.conteudoId, origem });

  return (
    <View style={styles.card}>
      <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={`Abrir ${item.titulo}`} style={styles.fotoBox}>
        {d?.fotoUrl ? (
          <Image source={{ uri: d.fotoUrl }} style={styles.foto} resizeMode="cover" />
        ) : (
          <View style={styles.semFoto}><Ionicons name="restaurant-outline" size={34} color="#B8C4BE" /></View>
        )}
        <View style={[styles.badge, { backgroundColor: tom.fundo }]}>
          <AppText style={[styles.badgeTexto, { color: tom.texto }]}>{STATUS_LABEL[item.status]}</AppText>
        </View>
        <View style={styles.versao}><AppText style={styles.versaoTexto}>v{item.versao}</AppText></View>
      </Pressable>

      <View style={styles.corpo}>
        <View style={{ gap: 2 }}>
          <AppText numberOfLines={2} style={styles.titulo}>{item.titulo}</AppText>
          {!!d?.pratoNome && <AppText numberOfLines={1} style={styles.prato}>Prato: {d.pratoNome}</AppText>}
        </View>

        {d && (
          <View style={styles.infos}>
            {!!d.tempoMin && <Info icone="time-outline" texto={`${d.tempoMin} min`} />}
            {!!d.porcoes && <Info icone="people-outline" texto={`${d.porcoes} porç.`} />}
            {!!d.dificuldade && <Info icone="speedometer-outline" texto={ROTULO_DIFICULDADE[d.dificuldade] ?? d.dificuldade} />}
          </View>
        )}
        {d && <AppText style={styles.contagens}>{d.ingredientes} ingrediente(s) · {d.passos} passo(s)</AppText>}

        {avisos.length > 0 && (
          <View style={styles.avisos}>
            {avisos.map((a) => (
              <View key={a} style={styles.aviso}><Ionicons name="alert-circle" size={12} color="#8A5A00" /><AppText style={styles.avisoTexto}>{a}</AppText></View>
            ))}
          </View>
        )}

        {item.status === 'REJEITADO' && !!item.motivoRejeicao && (
          <View style={styles.motivo}>
            <AppText style={styles.motivoTitulo}>Motivo da rejeição</AppText>
            <AppText numberOfLines={3} style={styles.motivoTexto}>{item.motivoRejeicao}</AppText>
          </View>
        )}

        <AppText style={styles.meta} numberOfLines={1}>
          {item.criadorNome ?? 'Sistema'} · atualizada em {formatarDataHora(item.atualizadoEm).split(' ')[0]}
        </AppText>
        {!!erro && <AppText style={styles.erro}>{erro}</AppText>}

        <View style={styles.acoes}>
          <AppButton
            label={decide ? 'ABRIR E REVISAR' : 'ABRIR'} fullWidth={false} size="compact" disabled={ocupado} style={styles.botao} onPress={abrir}
            {...(decide ? { backgroundColor: tema.botaoFundo, textColor: tema.botaoTexto, shadowColor: tema.botaoSombra } : { outlineColor: tema.texto, textColor: tema.texto })}
          />
          <AppButton label="EDITAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={ocupado} style={styles.botao} onPress={editar} />
        </View>
        {fluxo.length > 0 && (
          <View style={styles.acoes}>
            {fluxo.map((a) => (
              <AppButton
                key={a} label={rotuloAcao(a, item.status)} fullWidth={false} size="compact" disabled={ocupado} style={styles.botao} onPress={() => executar(a)}
                {...(a === 'ENVIAR' ? { backgroundColor: tema.botaoFundo, textColor: tema.botaoTexto, shadowColor: tema.botaoSombra } : { outlineColor: tema.texto, textColor: tema.texto })}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ReceitasListaScreen({ config }: { config: ConfigPainel }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const navigation = useNavigation<any>();
  const origem = useRoute().name;
  const [itens, setItens] = useState<ReceitaDaLista[]>([]);
  const [papel, setPapel] = useState<PapelPainel | null>(null);
  const [filtros, setFiltros] = useState<FiltrosReceitas>(FILTROS_RECEITAS_VAZIOS);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [lista, p] = await Promise.all([listarReceitasDoPainel(), obterPapelAtual()]);
      setItens(lista);
      setPapel(p === 'NUTRICIONISTA' || p === 'ADMINISTRADOR' ? p : null);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar as receitas.');
    } finally {
      setCarregando(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const set = <K extends keyof FiltrosReceitas>(k: K, v: FiltrosReceitas[K]) => setFiltros((f) => ({ ...f, [k]: v }));
  const contagem = useMemo(() => contarPorStatus(itens), [itens]);
  const visiveis = useMemo(() => filtrarReceitas(itens, filtros), [itens, filtros]);
  const opStatus = useMemo(
    () => [{ chave: 'TODOS', label: `Todas (${contagem.TODOS ?? 0})` },
      ...ORDEM_STATUS.filter((s) => (contagem[s] ?? 0) > 0 || filtros.status === s).map((s) => ({ chave: s, label: `${STATUS_LABEL[s]} (${contagem[s] ?? 0})` }))],
    [contagem, filtros.status]
  );
  const filtrando = filtros.busca !== '' || filtros.status !== 'TODOS' || filtros.dificuldade !== 'TODAS';

  return (
    <PainelLayout
      config={config}
      titulo="Receitas"
      subtitulo={itens.length ? `${itens.length} receita(s) no total` : 'Crie e organize as receitas do app'}
      acao={
        <AppButton label="+ NOVA RECEITA" fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={() => navigation.navigate('EditarReceita', { origem })} />
      }
    >
      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : !papel ? (
        <EstadoErro mensagem="Seu perfil não tem acesso a esta área." />
      ) : (
        <>
          <View style={styles.barra}>
            <CampoBusca valor={filtros.busca} onChange={(t) => set('busca', t)} placeholder="Buscar pelo título ou pelo prato" />
            <ChipsFiltro opcoes={opStatus} valor={filtros.status} onChange={(c) => set('status', c as FiltrosReceitas['status'])} />
            <View style={styles.linhaOpcoes}>
              <ChipsFiltro opcoes={OP_DIFICULDADE} valor={filtros.dificuldade} onChange={(c) => set('dificuldade', c as FiltrosReceitas['dificuldade'])} />
            </View>
            <View style={styles.linhaOpcoes}>
              <AppText style={styles.rotuloOrdem}>Ordenar:</AppText>
              <ChipsFiltro opcoes={OP_ORDEM} valor={filtros.ordem} onChange={(c) => set('ordem', c as FiltrosReceitas['ordem'])} />
              {filtrando && (
                <Pressable onPress={() => setFiltros({ ...FILTROS_RECEITAS_VAZIOS, ordem: filtros.ordem })} accessibilityRole="button" hitSlop={8}>
                  <AppText style={styles.limpar}>Limpar filtros</AppText>
                </Pressable>
              )}
            </View>
          </View>

          {visiveis.length === 0 ? (
            <VazioPainel
              titulo={itens.length === 0 ? 'Nenhuma receita ainda' : 'Nenhuma receita com esses filtros'}
              texto={itens.length === 0 ? 'Toque em "Nova receita" para criar a primeira.' : 'Tente tirar algum filtro ou buscar por outro nome.'}
            />
          ) : (
            <GridResponsiva minItem={290} gap={14} maxColunas={4}>
              {visiveis.map((i) => <CartaoReceita key={i.id} item={i} papel={papel} navigation={navigation} origem={origem} aoMudar={carregar} />)}
            </GridResponsiva>
          )}
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  barra: { gap: 10, marginBottom: 14 },
  linhaOpcoes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  rotuloOrdem: { fontFamily: typography.bold, fontSize: 12, color: t.textoSuave },
  limpar: { fontFamily: typography.bold, fontSize: 12, color: t.erro },
  botao: { paddingHorizontal: 14, minHeight: 44 },
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, overflow: 'hidden', minWidth: 0 },
  fotoBox: { height: 150, backgroundColor: t.superficieSuave },
  foto: { width: '100%', height: '100%' },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 10, left: 10, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 11 },
  versao: { position: 'absolute', top: 10, right: 10, backgroundColor: t.card, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  versaoTexto: { fontFamily: typography.bold, fontSize: 10, color: t.textoSuave },
  corpo: { padding: 14, gap: 10 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: t.texto },
  prato: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.superficieSuave, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  infoTexto: { fontFamily: typography.medium, fontSize: 11, color: t.texto },
  contagens: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  avisos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.alertaSuave, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 11, color: t.selos.aviso.texto },
  motivo: { backgroundColor: t.selos.erro.fundo + '55', borderRadius: 10, padding: 8, gap: 2 },
  motivoTitulo: { fontFamily: typography.bold, fontSize: 11, color: t.erro },
  motivoTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoCorpo },
  meta: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}) as const;
