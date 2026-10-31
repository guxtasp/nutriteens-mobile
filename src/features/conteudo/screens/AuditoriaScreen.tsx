// src/features/conteudo/screens/AuditoriaScreen.tsx
// Histórico imutável: quem fez o quê, quando, em qual versão e por quê.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { CampoBusca, ChipsFiltro } from '../../../shared/painel/components/ControlesLista';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { listarAuditoria, type RegistroAuditoria } from '../services/fluxoService';
import { obterPapelAtual } from '../services/conteudoService';
import { AcessosDadosCard } from '../components/AcessosDadosCard';
import { ACAO_LABEL, STATUS_LABEL, TIPO_LABEL, formatarDataHora, type StatusFluxo, type TipoConteudo } from '../utils/fluxo';
import {
  FILTROS_AUDITORIA_VAZIOS, agruparPorDia, filtrarAuditoria, nomeAtor, rotuloDia, valoresUnicos,
  type FiltrosAuditoria, type PeriodoAuditoria,
} from '../utils/filtrosAuditoria';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';

const FILTROS: { chave: string; label: string; tipo?: TipoConteudo }[] = [
  { chave: 'TODOS', label: 'Tudo' },
  { chave: 'TRILHA', label: 'Trilhas', tipo: 'TRILHA' },
  { chave: 'RECEITA', label: 'Receitas', tipo: 'RECEITA' },
  { chave: 'TROCA', label: 'Alternativas', tipo: 'TROCA' },
];

const OP_PERIODO: { chave: PeriodoAuditoria; label: string }[] = [
  { chave: 'TUDO', label: 'Todo o período' }, { chave: 'HOJE', label: 'Hoje' }, { chave: '7D', label: '7 dias' }, { chave: '30D', label: '30 dias' },
];
const rotuloAcao = (a: string) => (ACAO_LABEL as Record<string, string>)[a] ?? a;

const rotuloStatus = (s: string | null) => (s ? STATUS_LABEL[s as StatusFluxo] ?? s : null);

export default function AuditoriaScreen({ config }: { config: ConfigPainel }) {
  const styles = useEstilos(criarEstilos);
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [f, setF] = useState<FiltrosAuditoria>(FILTROS_AUDITORIA_VAZIOS);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const alternar = (id: string) => setAbertos((a) => { const n = new Set(a); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ehAdmin, setEhAdmin] = useState(false);
  useEffect(() => { obterPapelAtual().then((p) => setEhAdmin(p === 'ADMINISTRADOR')); }, []);

  const carregar = useCallback(async () => {
    try {
      const tipo = FILTROS.find((f) => f.chave === filtro)?.tipo;
      setRegistros(await listarAuditoria(300, tipo));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar a auditoria.');
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  const visiveis = useMemo(() => filtrarAuditoria(registros, f), [registros, f]);
  const grupos = useMemo(() => agruparPorDia(visiveis), [visiveis]);
  const opAcoes = useMemo(
    () => [{ chave: 'TODAS', label: 'Todas as ações' }, ...valoresUnicos(registros.map((r) => r.acao)).map((a) => ({ chave: a, label: rotuloAcao(a) }))],
    [registros]
  );
  const opAutores = useMemo(
    () => [{ chave: 'TODOS', label: 'Todos os autores' }, ...valoresUnicos(registros.map(nomeAtor)).map((a) => ({ chave: a, label: a }))],
    [registros]
  );
  const filtrando = f.acao !== 'TODAS' || f.autor !== 'TODOS' || f.periodo !== 'TUDO' || f.busca !== '';

  return (
    <PainelLayout config={config} titulo="Auditoria" subtitulo="Quem criou, aprovou, rejeitou ou alterou cada conteúdo">
      <IntroSecao
        chave="auditoria"
        titulo="Para que serve a Auditoria"
        linhas={[
          'É o histórico de tudo que aconteceu com os conteúdos: quem criou, enviou, aprovou, rejeitou, publicou, editou ou arquivou, e quando.',
          'Os registros não podem ser alterados nem apagados. Use os filtros de tipo, período, ação e autor, ou a busca, e toque numa linha para ver os detalhes.',
          'Em rejeições, o motivo informado pela nutricionista aparece no registro.',
        ]}
      />
      <View style={styles.filtros}>
        {FILTROS.map((f) => {
          const ativo = f.chave === filtro;
          return (
            <Pressable key={f.chave} onPress={() => setFiltro(f.chave)} accessibilityRole="button" style={[styles.chip, ativo && styles.chipAtivo]}>
              <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{f.label}</AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.barra}>
        <CampoBusca valor={f.busca} onChange={(t) => setF((x) => ({ ...x, busca: t }))} placeholder="Buscar por título ou motivo" />
        <ChipsFiltro opcoes={OP_PERIODO} valor={f.periodo} onChange={(c) => setF((x) => ({ ...x, periodo: c as PeriodoAuditoria }))} />
        <ChipsFiltro opcoes={opAcoes} valor={f.acao} onChange={(c) => setF((x) => ({ ...x, acao: c }))} />
        {opAutores.length > 2 && <ChipsFiltro opcoes={opAutores} valor={f.autor} onChange={(c) => setF((x) => ({ ...x, autor: c }))} />}
        {filtrando && (
          <Pressable onPress={() => setF(FILTROS_AUDITORIA_VAZIOS)} accessibilityRole="button" hitSlop={8}>
            <AppText style={styles.limpar}>Limpar filtros</AppText>
          </Pressable>
        )}
      </View>

      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          {visiveis.length === 0 && (
            <CartaoSecao titulo="Registros" ajuda="Nenhum registro com esses filtros.">
              <AppText style={styles.vazio}>{registros.length === 0 ? 'Nenhum registro ainda.' : 'Nenhum registro com esses filtros.'}</AppText>
            </CartaoSecao>
          )}
          {grupos.map((g) => (
            <CartaoSecao
              key={g.dia}
              titulo={rotuloDia(g.dia)}
              subtitulo={`${g.itens.length} ${g.itens.length === 1 ? 'registro' : 'registros'}`}
              ajuda="Cada linha é uma ação: quem fez, em qual conteúdo e quando. Toque para ver o status anterior e o novo, a versão e o motivo."
            >
              {g.itens.map((r) => {
                const aberto = abertos.has(r.id);
                return (
                  <Pressable key={r.id} onPress={() => alternar(r.id)} accessibilityRole="button" accessibilityState={{ expanded: aberto }} style={styles.linha}>
                    <View style={styles.linhaTopo}>
                      <AppText style={styles.acao}>{rotuloAcao(r.acao)}</AppText>
                      <AppText style={styles.quando}>{formatarDataHora(r.criadoEm).split(' ')[1]} {aberto ? '▲' : '▼'}</AppText>
                    </View>
                    <AppText style={styles.titulo} numberOfLines={aberto ? undefined : 1}>
                      {TIPO_LABEL[r.tipo] ?? r.tipo}: {r.titulo ?? '(sem título)'}
                    </AppText>
                    <AppText style={styles.meta}>
                      {nomeAtor(r)}{r.atorPapel ? ` (${r.atorPapel === 'NUTRICIONISTA' ? 'nutricionista' : 'admin'})` : ''}
                    </AppText>
                    {aberto && (
                      <View style={styles.detalhe}>
                        {(r.statusAnterior || r.statusNovo) && (
                          <AppText style={styles.meta}>Status: {rotuloStatus(r.statusAnterior) ?? '—'} → {rotuloStatus(r.statusNovo) ?? '—'}</AppText>
                        )}
                        {!!r.versao && <AppText style={styles.meta}>Versão: v{r.versao}</AppText>}
                        <AppText style={styles.meta}>Quando: {formatarDataHora(r.criadoEm)}</AppText>
                        {!r.motivo && <AppText style={styles.meta}>Sem motivo informado.</AppText>}
                        {!!r.motivo && <AppText style={styles.motivo}>Motivo: {r.motivo}</AppText>}
                      </View>
                    )}
                    {!aberto && !!r.motivo && <AppText style={styles.motivo} numberOfLines={1}>Motivo: {r.motivo}</AppText>}
                  </Pressable>
                );
              })}
            </CartaoSecao>
          ))}
        </>
      )}
      {ehAdmin && <AcessosDadosCard />}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  barra: { gap: 10, marginBottom: 14 },
  limpar: { fontFamily: typography.bold, fontSize: 12, color: t.erro },
  detalhe: { gap: 2, marginTop: 4 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' },
  chipAtivo: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  chipTextoAtivo: { color: t.chipAtivoTexto },
  linha: { borderTopWidth: 1, borderTopColor: t.linhaSuave, paddingTop: 10, gap: 2 },
  linhaTopo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  acao: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  quando: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave },
  titulo: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo },
  meta: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  motivo: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
  vazio: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave },
}) as const;
