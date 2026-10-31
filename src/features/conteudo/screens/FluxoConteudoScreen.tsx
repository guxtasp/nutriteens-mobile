// src/features/conteudo/screens/FluxoConteudoScreen.tsx
// Lista do fluxo de aprovação (Conteúdos, Trilhas, Receitas e fila de Aprovações).
// Cards em grade responsiva: no celular empilham, no desktop viram colunas.
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { GridResponsiva } from '../../../shared/painel/components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AjudaInfo } from '../../../shared/painel/components/AjudaInfo';
import { CampoBusca, ChipsFiltro } from '../../../shared/painel/components/ControlesLista';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { listarFluxo, transicionar, type ItemFluxo } from '../services/fluxoService';
import { obterPapelAtual } from '../services/conteudoService';
import { useCoresTom } from '../hooks/useCoresTom';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  ACOES_DECISAO,
  STATUS_AJUDA,
  STATUS_LABEL,
  TIPO_LABEL,
  acoesPermitidas,
  formatarDataHora,
  rotuloAcao,
  tomDoStatus,
  type AcaoFluxo,
  type PapelPainel,
  type StatusFluxo,
  type TipoConteudo,
  type TomStatus,
} from '../utils/fluxo';
import {
  FILTROS_FLUXO_VAZIOS, autoresDisponiveis, dasAba, filtrarFluxo, type AbaTipo, type FiltrosFluxo, type OrdemFluxo,
} from '../utils/filtrosFluxo';

type Props = {
  config: ConfigPainel;
  titulo: string;
  subtitulo?: string;
  tipo?: TipoConteudo;
  /** fila de revisão: só mostra o que espera decisão da nutricionista */
  fila?: boolean;
};

const FILTROS: { chave: string; label: string; status?: StatusFluxo[] }[] = [
  { chave: 'TODOS', label: 'Todos' },
  { chave: 'RASCUNHO', label: 'Rascunho', status: ['RASCUNHO'] },
  { chave: 'AGUARDANDO', label: 'Em revisão', status: ['AGUARDANDO_APROVACAO'] },
  { chave: 'APROVADO', label: 'Aprovado', status: ['APROVADO'] },
  { chave: 'PUBLICADO', label: 'Publicado', status: ['PUBLICADO'] },
  { chave: 'REJEITADO', label: 'Rejeitado', status: ['REJEITADO'] },
  { chave: 'ARQUIVADO', label: 'Arquivado', status: ['ARQUIVADO'] },
];
const STATUS_FILA: StatusFluxo[] = ['AGUARDANDO_APROVACAO', 'APROVADO'];
const ABAS: { chave: AbaTipo; label: string }[] = [
  { chave: 'TODOS', label: 'Todos' },
  { chave: 'TRILHA', label: 'Trilhas' },
  { chave: 'RECEITA', label: 'Receitas' },
  { chave: 'TROCA', label: 'Alternativas' },
];
const OP_ORDEM: { chave: OrdemFluxo; label: string }[] = [
  { chave: 'RECENTES', label: 'Mais recentes' },
  { chave: 'ANTIGOS', label: 'Mais antigos' },
  { chave: 'AZ', label: 'A–Z' },
];


function CartaoConteudo({
  item,
  papel,
  navigation,
  origem,
  aoMudar,
}: {
  item: ItemFluxo;
  papel: PapelPainel;
  navigation: any;
  origem: string;
  aoMudar: () => void;
}) {
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

  function aoToque(acao: AcaoFluxo) {
    executar(acao);
  }

  return (
    <View style={styles.card}>
      <View style={styles.linhaTopo}>
        <View style={styles.chipTipo}>
          <AppText style={styles.chipTipoTexto}>{TIPO_LABEL[item.tipo]}</AppText>
        </View>
        <View style={[styles.badge, { backgroundColor: tom.fundo }]}>
          <AppText style={[styles.badgeTexto, { color: tom.texto }]}>{STATUS_LABEL[item.status]}</AppText>
        </View>
        <AjudaInfo titulo={STATUS_LABEL[item.status]} texto={STATUS_AJUDA[item.status]} />
        <AppText style={styles.versao}>v{item.versao}</AppText>
      </View>

      <AppText style={styles.titulo}>{item.titulo}</AppText>

      <View style={{ gap: 2 }}>
        <AppText style={styles.meta}>Criado por {item.criadorNome ?? 'sistema'} · {formatarDataHora(item.criadoEm)}</AppText>
        {!!item.revisadoEm && (
          <AppText style={styles.meta}>
            {item.status === 'REJEITADO' ? 'Rejeitado' : 'Revisado'} por {item.revisorNome ?? '—'} · {formatarDataHora(item.revisadoEm)}
          </AppText>
        )}
        {!!item.publicadoEm && item.status === 'PUBLICADO' && (
          <AppText style={styles.meta}>Publicado em {formatarDataHora(item.publicadoEm)}</AppText>
        )}
      </View>

      {item.status === 'REJEITADO' && !!item.motivoRejeicao && (
        <View style={styles.motivo}>
          <AppText style={styles.motivoTitulo}>Motivo da rejeição</AppText>
          <AppText style={styles.motivoTexto}>{item.motivoRejeicao}</AppText>
        </View>
      )}

      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}

      <View style={styles.acoes}>
        <AppButton
          label={decide ? 'ABRIR E REVISAR' : 'ABRIR'}
          fullWidth={false}
          size="compact"
          {...(decide
            ? { backgroundColor: tema.botaoFundo, textColor: tema.botaoTexto, shadowColor: tema.botaoSombra }
            : { outlineColor: tema.texto, textColor: tema.texto })}
          disabled={ocupado}
          style={styles.botao}
          onPress={abrir}
        />
        {acoes.map((a) => (
          <AppButton
            key={a}
            label={rotuloAcao(a, item.status)}
            fullWidth={false}
            size="compact"
            {...(a === 'ENVIAR'
              ? { backgroundColor: tema.botaoFundo, textColor: tema.botaoTexto, shadowColor: tema.botaoSombra }
              : { outlineColor: tema.texto, textColor: tema.texto })}
            disabled={ocupado}
            style={styles.botao}
            onPress={() => aoToque(a)}
          />
        ))}
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
  const [filtro, setFiltro] = useState('TODOS');
  const [aba, setAba] = useState<AbaTipo>('TODOS');
  const [busca, setBusca] = useState('');
  const [autor, setAutor] = useState('TODOS');
  const [ordem, setOrdem] = useState<OrdemFluxo>('RECENTES');
  // a página pode já ser de um tipo só (Trilhas, Alternativas); abas só na lista geral
  const comAbas = !fila && !tipo;
  const tipoAtual: TipoConteudo | undefined = tipo ?? (aba === 'TODOS' ? undefined : aba);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [lista, p] = await Promise.all([
        listarFluxo(tipo, fila ? STATUS_FILA : undefined),
        obterPapelAtual(),
      ]);
      setItens(lista);
      setPapel(p === 'NUTRICIONISTA' || p === 'ADMINISTRADOR' ? p : null);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar os conteúdos.');
    } finally {
      setCarregando(false);
    }
  }, [tipo, fila]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  const daAba = useMemo(() => dasAba(itens, comAbas ? aba : 'TODOS'), [itens, aba, comAbas]);
  const autores = useMemo(() => autoresDisponiveis(daAba), [daAba]);
  const statusDoFiltro = FILTROS.find((x) => x.chave === filtro)?.status ?? null;
  const visiveis = useMemo(() => {
    const f: FiltrosFluxo = { ...FILTROS_FLUXO_VAZIOS, aba: comAbas ? aba : 'TODOS', status: statusDoFiltro, busca, autor, ordem };
    return filtrarFluxo(itens, f);
  }, [itens, comAbas, aba, statusDoFiltro, busca, autor, ordem]);

  const contagem = (chave: string) => {
    const f = FILTROS.find((x) => x.chave === chave);
    return f?.status ? daAba.filter((i) => f.status!.includes(i.status)).length : daAba.length;
  };
  const contagemAba = (a: AbaTipo) => dasAba(itens, a).length;
  const filtrando = filtro !== 'TODOS' || busca.trim() !== '' || autor !== 'TODOS';
  const opAutores = useMemo(
    () => [{ chave: 'TODOS', label: 'Todos os autores' }, ...autores.map((a) => ({ chave: a, label: a }))],
    [autores]
  );
  function trocarAba(a: AbaTipo) {
    setAba(a);
    setAutor('TODOS'); // o autor escolhido pode não existir na outra aba
  }

  return (
    <PainelLayout
      config={config}
      titulo={titulo}
      subtitulo={subtitulo}
      acao={
        fila ? undefined : (
          <View style={styles.acoes}>
            {tipoAtual !== 'RECEITA' && tipoAtual !== 'TROCA' && (
              <AppButton
                label="+ NOVA TRILHA"
                fullWidth={false}
                size="compact"
                backgroundColor={tema.botaoFundo}
                textColor={tema.botaoTexto}
                shadowColor={tema.botaoSombra}
                style={styles.botao}
                onPress={() => navigation.navigate('EditarTrilha', { origem })}
              />
            )}
            {tipoAtual !== 'TRILHA' && tipoAtual !== 'TROCA' && (
              <AppButton
                label="+ NOVA RECEITA"
                fullWidth={false}
                size="compact"
                backgroundColor={tema.botaoFundo}
                textColor={tema.botaoTexto}
                shadowColor={tema.botaoSombra}
                style={styles.botao}
                onPress={() => navigation.navigate('EditarReceita', { origem })}
              />
            )}
            {tipoAtual === 'TROCA' && (
              <AppButton
                label="+ NOVA ALTERNATIVA"
                fullWidth={false}
                size="compact"
                backgroundColor={tema.botaoFundo}
                textColor={tema.botaoTexto}
                shadowColor={tema.botaoSombra}
                style={styles.botao}
                onPress={() => navigation.navigate('EditarTroca', { origem })}
              />
            )}
          </View>
        )
      }
    >
      <IntroSecao
        chave={fila ? 'fluxo_fila' : 'fluxo_lista'}
        titulo={fila ? 'Fila de aprovações' : 'Como funcionam os conteúdos'}
        linhas={
          fila
            ? [
                'Aqui estão os conteúdos que esperam a sua decisão como nutricionista.',
                'Toque em "Abrir e revisar" para ler o conteúdo completo. Aprovar, rejeitar e publicar ficam na página do conteúdo, depois da leitura.',
                'Ao rejeitar, informe o motivo: quem criou o conteúdo verá o que ajustar.',
                'Conteúdo criado por você pode ser aprovado e publicado na mesma ação.',
              ]
            : [
                'Todo conteúdo segue: Rascunho → Em revisão → Aprovado → Publicado. Se houver ajustes, ele é Rejeitado com um motivo e volta para edição.',
                'Qualquer pessoa da equipe pode abrir e ler o conteúdo completo ("Abrir"). Os adolescentes só veem o que está Publicado.',
                'Admin e nutricionista criam e editam conteúdo ("+ Nova"). Edição do Admin devolve o conteúdo para rascunho; aprovar, rejeitar e publicar é sempre da nutricionista.',
                'Toque no ícone "i" ao lado de cada status para entender o que ele significa.',
              ]
        }
      />
      {comAbas && (
        <View style={styles.abas} accessibilityRole="tablist">
          {ABAS.map((a) => {
            const ativa = a.chave === aba;
            return (
              <Pressable
                key={a.chave}
                onPress={() => trocarAba(a.chave)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                style={[styles.aba, ativa && styles.abaAtiva]}
              >
                <AppText style={[styles.abaTexto, ativa && styles.abaTextoAtivo]}>
                  {a.label} ({contagemAba(a.chave)})
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
      {!fila && (
        <View style={styles.barra}>
          <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar pelo título" />
          <View style={styles.filtros}>
            {FILTROS.map((f) => {
              const ativo = f.chave === filtro;
              return (
                <Pressable
                  key={f.chave}
                  onPress={() => setFiltro(f.chave)}
                  accessibilityRole="button"
                  style={[styles.chip, ativo && styles.chipAtivo]}
                >
                  <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                    {f.label} ({contagem(f.chave)})
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {autores.length > 1 && (
            <ChipsFiltro opcoes={opAutores} valor={autor} onChange={setAutor} />
          )}
          <View style={styles.linhaOrdem}>
            <AppText style={styles.rotuloOrdem}>Ordenar:</AppText>
            <ChipsFiltro opcoes={OP_ORDEM} valor={ordem} onChange={(c) => setOrdem(c as OrdemFluxo)} />
            {filtrando && (
              <Pressable
                onPress={() => { setFiltro('TODOS'); setBusca(''); setAutor('TODOS'); }}
                accessibilityRole="button"
                hitSlop={8}
              >
                <AppText style={styles.limpar}>Limpar filtros</AppText>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : !papel ? (
        <EstadoErro mensagem="Seu perfil não tem acesso a esta área." />
      ) : visiveis.length === 0 ? (
        <View style={styles.vazio}>
          <AppText style={styles.vazioTexto}>
            {fila ? 'Nada aguardando revisão agora. Quando um conteúdo for enviado, ele aparece aqui.' : 'Nenhum conteúdo com esses filtros. Tente outro status, outra aba ou limpe a busca.'}
          </AppText>
        </View>
      ) : (
        <GridResponsiva minItem={320} gap={12} maxColunas={3}>
          {visiveis.map((i) => (
            <CartaoConteudo key={i.id} item={i} papel={papel} navigation={navigation} origem={origem} aoMudar={carregar} />
          ))}
        </GridResponsiva>
      )}
    </PainelLayout>
  );
}


const criarEstilos = (t: TemaPainel) => ({
  abas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: t.cardBorda, paddingBottom: 10 },
  aba: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.superficieSuave },
  abaAtiva: { backgroundColor: t.botaoFundo },
  abaTexto: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  abaTextoAtivo: { color: t.botaoTexto },
  barra: { gap: 10, marginBottom: 14 },
  linhaOrdem: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  rotuloOrdem: { fontFamily: typography.bold, fontSize: 12, color: t.textoSuave },
  limpar: { fontFamily: typography.bold, fontSize: 12, color: t.erro },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda,
    backgroundColor: t.card, alignItems: 'center', justifyContent: 'center',
  },
  chipAtivo: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  chipTextoAtivo: { color: t.chipAtivoTexto },
  card: {
    backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda,
    padding: 16, gap: 10, minWidth: 0,
  },
  linhaTopo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  chipTipo: { backgroundColor: t.destaqueSuave, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  chipTipoTexto: { fontFamily: typography.bold, fontSize: 11, color: t.texto },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 11 },
  versao: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, marginLeft: 'auto' },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto },
  meta: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  motivo: { backgroundColor: t.selos.erro.fundo + '55', borderRadius: 12, padding: 10, gap: 2 },
  motivoTitulo: { fontFamily: typography.bold, fontSize: 12, color: t.erro },
  motivoTexto: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo },
  input: {
    minHeight: 72, borderWidth: 2, borderColor: t.cardBorda, borderRadius: 12, padding: 10,
    fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo, textAlignVertical: 'top',
  },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  botao: { paddingHorizontal: 14, minHeight: 44 },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  vazio: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 32, alignItems: 'center' },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave },
}) as const;
