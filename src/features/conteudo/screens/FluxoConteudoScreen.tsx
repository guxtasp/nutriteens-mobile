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

  const visiveis = useMemo(() => {
    const f = FILTROS.find((x) => x.chave === filtro);
    return f?.status ? itens.filter((i) => f.status!.includes(i.status)) : itens;
  }, [itens, filtro]);

  const contagem = (chave: string) => {
    const f = FILTROS.find((x) => x.chave === chave);
    return f?.status ? itens.filter((i) => f.status!.includes(i.status)).length : itens.length;
  };

  return (
    <PainelLayout
      config={config}
      titulo={titulo}
      subtitulo={subtitulo}
      acao={
        fila ? undefined : (
          <View style={styles.acoes}>
            {tipo !== 'RECEITA' && tipo !== 'TROCA' && (
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
            {tipo !== 'TRILHA' && tipo !== 'TROCA' && (
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
      {!fila && (
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
            {fila ? 'Nada aguardando revisão agora. Quando um conteúdo for enviado, ele aparece aqui.' : 'Nenhum conteúdo neste filtro. Tente outro status ou "Todos".'}
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
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
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
