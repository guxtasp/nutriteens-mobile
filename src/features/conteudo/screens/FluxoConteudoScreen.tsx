// src/features/conteudo/screens/FluxoConteudoScreen.tsx
// Lista do fluxo de aprovação (Conteúdos, Trilhas, Alternativas e fila de Aprovações).
//
// Arquitetura da informação:
//  - O fluxo aparece como um caminho clicável (Rascunho → Em revisão → Aprovado → Publicado, mais
//    Rejeitado e Arquivado ao lado), que também é o filtro de status. Antes eram 7 chips soltos.
//  - Busca sempre visível; autor e ordem ficam em "Mais filtros" (uso ocasional).
//  - Aprovações: fila do mais antigo para o mais novo, com "aguardando há N dias".
// As ações e regras (acoesPermitidas, transicionar) não mudaram.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AbasPainel } from '../../../shared/painel/components/AbasPainel';
import { CampoBusca, ChipsFiltro, Selo, VazioPainel } from '../../../shared/painel/components/ControlesLista';
import { AvisoPainel } from '../../../shared/painel/components/Formulario';
import { useModoPainel } from '../../../shared/painel/hooks/useModoPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import { listarFluxo, transicionar, type ItemFluxo } from '../services/fluxoService';
import { obterPapelAtual } from '../services/conteudoService';
import { useCoresTom } from '../hooks/useCoresTom';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  ACOES_DECISAO, STATUS_LABEL, TIPO_LABEL, acoesPermitidas, diasDesde, formatarDataHora, rotuloAcao, textoEspera, tomDoStatus,
  type AcaoFluxo, type PapelPainel, type StatusFluxo, type TipoConteudo,
} from '../utils/fluxo';
import { FILTROS_FLUXO_VAZIOS, autoresDisponiveis, dasAba, filtrarFluxo, type AbaTipo, type FiltrosFluxo, type OrdemFluxo } from '../utils/filtrosFluxo';

type Props = {
  config: ConfigPainel;
  titulo: string;
  subtitulo?: string;
  tipo?: TipoConteudo;
  /** fila de revisão: só mostra o que espera decisão da nutricionista */
  fila?: boolean;
};
type Icone = React.ComponentProps<typeof Ionicons>['name'];

const CAMINHO: StatusFluxo[] = ['RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'PUBLICADO'];
const FORA_DO_CAMINHO: StatusFluxo[] = ['REJEITADO', 'ARQUIVADO'];
const STATUS_FILA: StatusFluxo[] = ['AGUARDANDO_APROVACAO', 'APROVADO'];
const ICONE_STATUS: Record<StatusFluxo, Icone> = {
  RASCUNHO: 'create-outline', AGUARDANDO_APROVACAO: 'hourglass-outline', APROVADO: 'checkmark-done-outline',
  PUBLICADO: 'phone-portrait-outline', REJEITADO: 'arrow-undo-outline', ARQUIVADO: 'archive-outline',
};
const ICONE_TIPO: Record<TipoConteudo, Icone> = { TRILHA: 'map-outline', RECEITA: 'restaurant-outline', TROCA: 'swap-horizontal-outline' };
const ABAS: { chave: AbaTipo; label: string; icone: Icone }[] = [
  { chave: 'TODOS', label: 'Todos', icone: 'apps-outline' },
  { chave: 'TRILHA', label: 'Trilhas', icone: 'map-outline' },
  { chave: 'RECEITA', label: 'Receitas', icone: 'restaurant-outline' },
  { chave: 'TROCA', label: 'Alternativas', icone: 'swap-horizontal-outline' },
];
const OP_ORDEM: { chave: OrdemFluxo; label: string }[] = [
  { chave: 'RECENTES', label: 'Mais recentes' },
  { chave: 'ANTIGOS', label: 'Mais antigos' },
  { chave: 'AZ', label: 'A–Z' },
];

/** Caminho do fluxo: cada etapa mostra quantos itens estão nela e filtra ao tocar. */
function CaminhoStatus({ contar, ativo, onEscolher }: { contar: (s: StatusFluxo | null) => number; ativo: StatusFluxo | null; onEscolher: (s: StatusFluxo | null) => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { modo } = useModoPainel();
  const etapa = (s: StatusFluxo, i: number, total: number) => {
    const on = ativo === s;
    return (
      <React.Fragment key={s}>
        <Pressable
          onPress={() => onEscolher(on ? null : s)}
          accessibilityRole="button"
          accessibilityState={{ selected: on }}
          accessibilityLabel={`${STATUS_LABEL[s]}: ${contar(s)}. ${on ? 'Toque para ver todos' : 'Toque para filtrar'}`}
          style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.etapa, hovered && !on && styles.etapaHover, on && styles.etapaOn]}
        >
          <Ionicons name={ICONE_STATUS[s]} size={18} color={on ? tema.chipAtivoTexto : tema.destaqueTexto} />
          <View style={{ flexShrink: 1 }}>
            <AppText style={[styles.etapaNumero, on && { color: tema.chipAtivoTexto }]}>{contar(s)}</AppText>
            <AppText style={[styles.etapaRotulo, on && { color: tema.chipAtivoTexto }]} numberOfLines={1}>{STATUS_LABEL[s]}</AppText>
          </View>
        </Pressable>
        {i < total - 1 && modo !== 'celular' && <Ionicons name="chevron-forward" size={16} color={tema.textoSuave} />}
      </React.Fragment>
    );
  };
  return (
    <View style={styles.caminho}>
      <View style={styles.caminhoLinha}>{CAMINHO.map((s, i) => etapa(s, i, CAMINHO.length))}</View>
      <View style={styles.caminhoLinha}>
        {FORA_DO_CAMINHO.map((s) => etapa(s, 0, 1))}
        {ativo !== null && (
          <Pressable onPress={() => onEscolher(null)} accessibilityRole="button" style={styles.verTodos}>
            <AppText style={styles.verTodosTexto}>Ver todos ({contar(null)})</AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function CartaoConteudo({ item, papel, navigation, origem, fila, aoMudar }: { item: ItemFluxo; papel: PapelPainel; navigation: any; origem: string; fila?: boolean; aoMudar: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const coresTom = useCoresTom();
  const tom = coresTom[tomDoStatus(item.status)];
  // decisões (aprovar, rejeitar, publicar) só depois de abrir e ler o conteúdo
  const acoes = acoesPermitidas(papel, item.status).filter((a) => !ACOES_DECISAO.includes(a));
  const decide = acoesPermitidas(papel, item.status).some((a) => ACOES_DECISAO.includes(a));
  const abrir = () => navigation.navigate('ConteudoDetalhe', { tipo: item.tipo, conteudoId: item.conteudoId, origem });
  const espera = diasDesde(item.atualizadoEm);

  async function executar(acao: AcaoFluxo) {
    setOcupado(true);
    setErro(null);
    try {
      await transicionar(item.tipo, item.conteudoId, acao);
      aoMudar();
    } catch (e: any) {
      setErro(e?.message ?? '');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <View style={[styles.card, decide && styles.cardDecisao]}>
      <Pressable onPress={abrir} accessibilityRole="button" accessibilityLabel={`Abrir ${TIPO_LABEL[item.tipo]}: ${item.titulo}`} style={styles.cardTopo}>
        <View style={styles.cardIcone}>
          <Ionicons name={ICONE_TIPO[item.tipo]} size={20} color={tema.destaqueTexto} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <AppText style={styles.cardTipo}>{TIPO_LABEL[item.tipo].toUpperCase()} · v{item.versao}</AppText>
          <AppText style={styles.titulo} numberOfLines={2}>{item.titulo}</AppText>
        </View>
        <View style={[styles.badge, { backgroundColor: tom.fundo }]}>
          <AppText style={[styles.badgeTexto, { color: tom.texto }]}>{STATUS_LABEL[item.status]}</AppText>
        </View>
      </Pressable>

      <View style={styles.metaLinha}>
        <Ionicons name="person-outline" size={13} color={tema.textoSuave} />
        <AppText style={styles.meta} numberOfLines={1}>{item.criadorNome ?? 'Sistema'} · {formatarDataHora(item.criadoEm)}</AppText>
      </View>
      {fila ? (
        <View style={styles.metaLinha}>
          <Ionicons name="time-outline" size={13} color={espera >= 7 ? tema.alertaTexto : tema.textoSuave} />
          <AppText style={[styles.meta, espera >= 7 && { color: tema.alertaTexto, fontFamily: typography.semiBold }]}>
            {item.status === 'APROVADO' ? 'Aprovado, aguardando publicação' : 'Aguardando decisão'} {textoEspera(espera)}
          </AppText>
        </View>
      ) : !!item.revisadoEm ? (
        <View style={styles.metaLinha}>
          <Ionicons name="checkmark-circle-outline" size={13} color={tema.textoSuave} />
          <AppText style={styles.meta} numberOfLines={1}>
            {item.status === 'REJEITADO' ? 'Rejeitado' : 'Revisado'} por {item.revisorNome ?? '—'} · {formatarDataHora(item.revisadoEm)}
          </AppText>
        </View>
      ) : null}

      {item.status === 'REJEITADO' && !!item.motivoRejeicao && (
        <View style={styles.motivo}>
          <AppText style={styles.motivoTitulo}>O que ajustar</AppText>
          <AppText style={styles.motivoTexto} numberOfLines={3}>{item.motivoRejeicao}</AppText>
        </View>
      )}

      {!!erro && <AvisoPainel tom="erro" texto={erro} onFechar={() => setErro(null)} />}

      <View style={styles.acoes}>
        {acoes.map((a) => (
          <AppButton key={a} label={rotuloAcao(a, item.status)} fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={ocupado} style={styles.botao} onPress={() => executar(a)} />
        ))}
        <View style={{ flex: 1 }} />
        <AppButton
          label={decide ? 'REVISAR →' : 'ABRIR →'}
          fullWidth={false}
          size="compact"
          {...(decide ? { backgroundColor: tema.botaoFundo, textColor: tema.botaoTexto, shadowColor: tema.botaoSombra } : { outlineColor: tema.texto, textColor: tema.texto })}
          disabled={ocupado}
          style={styles.botao}
          onPress={abrir}
        />
      </View>
    </View>
  );
}

export default function FluxoConteudoScreen({ config, titulo, subtitulo, tipo, fila }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const navigation = useNavigation<any>();
  const origem = useRoute().name;
  const [itens, setItens] = useState<ItemFluxo[]>([]);
  const [papel, setPapel] = useState<PapelPainel | null>(null);
  const [status, setStatus] = useState<StatusFluxo | null>(null);
  const [aba, setAba] = useState<AbaTipo>('TODOS');
  const [busca, setBusca] = useState('');
  const [autor, setAutor] = useState('TODOS');
  // fila: quem espera há mais tempo primeiro
  const [ordem, setOrdem] = useState<OrdemFluxo>(fila ? 'ANTIGOS' : 'RECENTES');
  const [maisFiltros, setMaisFiltros] = useState(false);
  // a página pode já ser de um tipo só (Trilhas, Alternativas); abas só na lista geral
  const comAbas = !fila && !tipo;
  const tipoAtual: TipoConteudo | undefined = tipo ?? (aba === 'TODOS' ? undefined : aba);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [lista, p] = await Promise.all([listarFluxo(tipo, fila ? STATUS_FILA : undefined), obterPapelAtual()]);
      setItens(lista);
      setPapel(p === 'NUTRICIONISTA' || p === 'ADMINISTRADOR' ? p : null);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar os conteúdos.');
    } finally {
      setCarregando(false);
    }
  }, [tipo, fila]);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(); }, [carregar]));

  const daAba = useMemo(() => dasAba(itens, comAbas ? aba : 'TODOS'), [itens, aba, comAbas]);
  const autores = useMemo(() => autoresDisponiveis(daAba), [daAba]);
  const visiveis = useMemo(() => {
    const f: FiltrosFluxo = { ...FILTROS_FLUXO_VAZIOS, aba: comAbas ? aba : 'TODOS', status: status ? [status] : null, busca, autor, ordem };
    return filtrarFluxo(itens, f);
  }, [itens, comAbas, aba, status, busca, autor, ordem]);

  const contar = (s: StatusFluxo | null) => (s ? daAba.filter((i) => i.status === s).length : daAba.length);
  const contagemAba = (a: AbaTipo) => dasAba(itens, a).length;
  const extrasAtivos = (autor !== 'TODOS' ? 1 : 0) + (ordem !== (fila ? 'ANTIGOS' : 'RECENTES') ? 1 : 0);
  const filtrando = status !== null || busca.trim() !== '' || extrasAtivos > 0;
  const opAutores = useMemo(() => [{ chave: 'TODOS', label: 'Todos os autores' }, ...autores.map((a) => ({ chave: a, label: a }))], [autores]);
  const limpar = () => { setStatus(null); setBusca(''); setAutor('TODOS'); setOrdem(fila ? 'ANTIGOS' : 'RECENTES'); };

  const novo =
    fila ? null
    : tipoAtual === 'TROCA' ? { label: '+ NOVA ALTERNATIVA', rota: 'EditarTroca' }
    : tipoAtual === 'RECEITA' ? { label: '+ NOVA RECEITA', rota: 'EditarReceita' }
    : tipoAtual === 'TRILHA' ? { label: '+ NOVA TRILHA', rota: 'EditarTrilha' }
    : null;

  const acao = fila ? undefined : (
    <View style={styles.acoesTopo}>
      {novo ? (
        <AppButton label={novo.label} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={() => navigation.navigate(novo.rota, { origem })} />
      ) : (
        <>
          <AppButton label="+ TRILHA" fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={() => navigation.navigate('EditarTrilha', { origem })} />
          <AppButton label="+ RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={() => navigation.navigate('EditarReceita', { origem })} />
          <AppButton label="+ ALTERNATIVA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={() => navigation.navigate('EditarTroca', { origem })} />
        </>
      )}
    </View>
  );

  const nomeVazio = tipo === 'TRILHA' ? 'trilha' : tipo === 'TROCA' ? 'alternativa' : 'conteúdo';

  return (
    <PainelLayout config={config} titulo={titulo} subtitulo={subtitulo} acao={acao}>
      <IntroSecao
        chave={fila ? 'fluxo_fila' : 'fluxo_lista'}
        titulo={fila ? 'Fila de aprovações' : 'Como funcionam os conteúdos'}
        linhas={
          fila
            ? [
                'Aqui estão os conteúdos que esperam a sua decisão como nutricionista, do que espera há mais tempo para o mais recente.',
                'Toque em "Revisar" para ler o conteúdo completo. Aprovar, rejeitar e publicar ficam na página do conteúdo, depois da leitura.',
                'Ao rejeitar, informe o motivo: quem criou o conteúdo verá o que ajustar.',
              ]
            : [
                'Todo conteúdo segue o caminho: Rascunho → Em revisão → Aprovado → Publicado. Se houver ajustes, ele é Rejeitado com um motivo e volta para edição.',
                'Toque em uma etapa do caminho para ver só os itens dela. Os adolescentes só veem o que está Publicado.',
                'Admin e nutricionista criam e editam conteúdo. Edição do Admin devolve o conteúdo para rascunho; aprovar, rejeitar e publicar é sempre da nutricionista.',
              ]
        }
      />

      {comAbas && (
        <AbasPainel<AbaTipo>
          abas={ABAS.map((a) => ({ chave: a.chave, label: `${a.label} (${contagemAba(a.chave)})`, icone: a.icone }))}
          ativa={aba}
          onChange={(a) => { setAba(a); setAutor('TODOS'); }}
        />
      )}

      {carregando ? (
        <EstadoCarregando texto={fila ? 'Carregando a fila…' : 'Carregando os conteúdos…'} />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : !papel ? (
        <EstadoErro mensagem="Seu perfil não tem acesso a esta área." />
      ) : (
        <>
          {fila ? (
            <View style={styles.resumoFila}>
              <View style={styles.resumoNumero}>
                <AppText style={styles.resumoNumeroTexto}>{itens.length}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.resumoTitulo}>{itens.length === 1 ? 'conteúdo espera a sua decisão' : 'conteúdos esperam a sua decisão'}</AppText>
                <AppText style={styles.meta}>Itens parados há 7 dias ou mais aparecem destacados.</AppText>
              </View>
            </View>
          ) : (
            <CaminhoStatus contar={contar} ativo={status} onEscolher={setStatus} />
          )}

          <View style={styles.barra}>
            <View style={{ flex: 1, minWidth: 220 }}>
              <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar pelo título" />
            </View>
            <Pressable onPress={() => setMaisFiltros((v) => !v)} accessibilityRole="button" accessibilityState={{ expanded: maisFiltros }} style={[styles.botaoFiltros, extrasAtivos > 0 && styles.botaoFiltrosOn]}>
              <Ionicons name="options-outline" size={16} color={extrasAtivos > 0 ? tema.chipAtivoTexto : tema.texto} />
              <AppText style={[styles.botaoFiltrosTexto, extrasAtivos > 0 && { color: tema.chipAtivoTexto }]}>Mais filtros{extrasAtivos ? ` (${extrasAtivos})` : ''}</AppText>
            </Pressable>
          </View>
          {maisFiltros && (
            <View style={styles.painelFiltros}>
              {autores.length > 1 && (
                <View style={{ gap: 6 }}>
                  <AppText style={styles.rotuloFiltro}>Autor</AppText>
                  <ChipsFiltro opcoes={opAutores} valor={autor} onChange={setAutor} rotulo="Autor" />
                </View>
              )}
              <View style={{ gap: 6 }}>
                <AppText style={styles.rotuloFiltro}>Ordem</AppText>
                <ChipsFiltro opcoes={OP_ORDEM} valor={ordem} onChange={(c) => setOrdem(c as OrdemFluxo)} rotulo="Ordem" />
              </View>
            </View>
          )}

          <View style={styles.linhaContagem}>
            <AppText style={styles.meta}>
              {visiveis.length === daAba.length ? `${visiveis.length} ${visiveis.length === 1 ? 'item' : 'itens'}` : `${visiveis.length} de ${daAba.length}`}
              {status ? ` · ${STATUS_LABEL[status]}` : ''}
            </AppText>
            {filtrando && (
              <Pressable onPress={limpar} accessibilityRole="button" style={{ minHeight: ALVO_TOQUE, justifyContent: 'center' }}>
                <AppText style={styles.limpar}>Limpar filtros</AppText>
              </Pressable>
            )}
          </View>

          {visiveis.length === 0 ? (
            fila ? (
              <VazioPainel titulo="Tudo revisado" texto="Nada aguardando a sua decisão agora. Quando alguém enviar um conteúdo para revisão, ele aparece aqui." />
            ) : filtrando ? (
              <VazioPainel titulo="Nada com esses filtros" texto="Tente outra etapa do caminho ou outra busca." acao={{ label: 'LIMPAR FILTROS', onPress: limpar }} />
            ) : (
              <VazioPainel
                titulo={`Nenhum(a) ${nomeVazio} ainda`}
                texto="Tudo começa como rascunho e passa pela revisão da nutricionista antes de chegar aos adolescentes."
                acao={novo ? { label: novo.label.replace('+ ', 'CRIAR '), onPress: () => navigation.navigate(novo.rota, { origem }) } : undefined}
              />
            )
          ) : (
            <GridResponsiva minItem={320} gap={12} maxColunas={3}>
              {visiveis.map((i) => (
                <CartaoConteudo key={i.id} item={i} papel={papel} navigation={navigation} origem={origem} fila={fila} aoMudar={carregar} />
              ))}
            </GridResponsiva>
          )}
          {!fila && itens.some((i) => i.status === 'AGUARDANDO_APROVACAO') && papel === 'ADMINISTRADOR' && status === null && (
            <AvisoPainel tom="info" texto="Itens em revisão aguardam a nutricionista. Você acompanha o andamento aqui." />
          )}
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  acoesTopo: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  caminho: { gap: 8 },
  caminhoLinha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  etapa: {
    flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: ALVO_TOQUE + 12, minWidth: 140, flexGrow: 1, flexBasis: 140,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: t.borda, borderColor: t.cardBorda, backgroundColor: t.card,
  },
  etapaHover: { borderColor: t.campoBorda },
  etapaOn: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo },
  etapaNumero: { fontFamily: typography.bold, fontSize: 18, color: t.texto, lineHeight: 22 },
  etapaRotulo: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave },
  verTodos: { minHeight: ALVO_TOQUE, justifyContent: 'center', paddingHorizontal: 8 },
  verTodosTexto: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.destaqueTexto, textDecorationLine: 'underline' },
  resumoFila: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: t.cardRaio, backgroundColor: t.card, borderWidth: t.borda, borderColor: t.cardBorda },
  resumoNumero: { minWidth: 52, height: 52, paddingHorizontal: 10, borderRadius: 14, backgroundColor: t.alertaSuave, alignItems: 'center', justifyContent: 'center' },
  resumoNumeroTexto: { fontFamily: typography.bold, fontSize: 24, color: t.alertaTexto },
  resumoTitulo: { fontFamily: typography.bold, fontSize: fonte.corpo, color: t.texto },
  barra: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  botaoFiltros: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: t.borda, borderColor: t.chipBorda, backgroundColor: t.card },
  botaoFiltrosOn: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo },
  botaoFiltrosTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto },
  painelFiltros: { gap: 12, backgroundColor: t.superficieSuave, borderRadius: 12, padding: 14 },
  rotuloFiltro: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.texto },
  linhaContagem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  limpar: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.destaqueTexto, textDecorationLine: 'underline' },
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 14, gap: 8, minWidth: 0, flex: 1 },
  cardDecisao: { borderLeftWidth: 4, borderLeftColor: t.alerta },
  cardTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardIcone: { width: 40, height: 40, borderRadius: 12, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  cardTipo: { fontFamily: typography.bold, fontSize: fonte.selo, color: t.textoSuave, letterSpacing: 0.5 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontFamily: typography.bold, fontSize: fonte.selo },
  titulo: { fontFamily: typography.bold, fontSize: fonte.corpo + 1, color: t.texto },
  metaLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { flexShrink: 1, fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave },
  motivo: { backgroundColor: t.selos.erro.fundo, borderRadius: 10, padding: 10, gap: 2 },
  motivoTitulo: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.selos.erro.texto },
  motivoTexto: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoCorpo, lineHeight: 18 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginTop: 'auto', paddingTop: 4 },
  botao: { paddingHorizontal: 14, minHeight: ALVO_TOQUE },
}) as const;
