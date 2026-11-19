// src/shared/painel/components/graficos/GraficosJornada.tsx
//
// Gráficos do uso progressivo do app (Analytics → Jornada e a aba Jornada do participante).
// Regras seguidas (skill dataviz): cor por função (rampa ORDINAL de um tom para nível de uso,
// validada por script; "novos" numa cor à parte), marcas finas com 2px de respiro entre segmentos,
// legenda sempre que há 2+ séries, rótulo direto só onde ajuda, leitura ao passar o mouse/tocar,
// texto sempre nas cores de texto (nunca na cor da série) e uma visão em tabela.
// Feito com Views: escala em qualquer largura e não depende de biblioteca de gráficos.
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../ui/AppText';
import { typography } from '../../../theme/typography';
import { colors } from '../../../theme/colors';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../../painelTheme';
import type { DiaCalendario, SemanaEstagios } from '../../services/jornadaService';
import {
  AJUDA_ESTAGIO, DIAS_SEMANA, ESTAGIOS, ROTULO_ESTAGIO, ROTULO_MARCO, diaMes, diasEntre, nivel, semanasCalendario,
  totalSemana, type Estagio, type Insight,
} from '../../utils/jornada';
import type { ChaveMarco } from '../../services/jornadaService';

type Hover = { pressed: boolean; hovered?: boolean };

// ---------------------------------------------------------------- peças comuns

function Leitura({ texto, padrao }: { texto: string | null; padrao: string }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.leitura} accessibilityLiveRegion="polite">
      <Ionicons name="finger-print-outline" size={14} color={styles.leituraTexto.color as string} />
      <AppText style={styles.leituraTexto}>{texto ?? padrao}</AppText>
    </View>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string; ajuda?: string }[] }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.legenda} accessibilityRole="list">
      {itens.map((i) => (
        <View key={i.rotulo} style={styles.legendaItem} accessibilityLabel={i.ajuda ? `${i.rotulo}: ${i.ajuda}` : i.rotulo}>
          <View style={[styles.legendaCor, { backgroundColor: i.cor }]} />
          <AppText style={styles.legendaTexto}>{i.rotulo}</AppText>
        </View>
      ))}
    </View>
  );
}

/** Alternância gráfico ↔ tabela (a tabela é a forma acessível de ler todos os números). */
export function ComTabela({ grafico, colunas, linhas }: { grafico: React.ReactNode; colunas: string[]; linhas: (string | number)[][] }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [tabela, setTabela] = useState(false);
  return (
    <View style={{ gap: 10 }}>
      {tabela ? (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            <View style={[styles.tLinha, styles.tCabecalho]}>
              {colunas.map((c, i) => <AppText key={i} style={[styles.tCelula, styles.tTh, i === 0 && styles.tPrimeira]}>{c}</AppText>)}
            </View>
            {linhas.map((l, k) => (
              <View key={k} style={styles.tLinha}>
                {l.map((v, i) => <AppText key={i} style={[styles.tCelula, i === 0 && styles.tPrimeira]}>{String(v)}</AppText>)}
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        grafico
      )}
      <Pressable onPress={() => setTabela((v) => !v)} accessibilityRole="button" style={styles.alternar}>
        <Ionicons name={tabela ? 'bar-chart-outline' : 'grid-outline'} size={14} color={tema.destaqueTexto} />
        <AppText style={styles.alternarTexto}>{tabela ? 'Ver gráfico' : 'Ver tabela'}</AppText>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------- insights

const ICONE_INSIGHT = { positivo: 'trending-up', atencao: 'alert-circle-outline', neutro: 'bulb-outline' } as const;

export function ListaInsights({ itens, vazio }: { itens: Insight[]; vazio: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  if (!itens.length) return <AppText style={styles.vazio}>{vazio}</AppText>;
  const cor = (t: Insight['tom']) => (t === 'positivo' ? tema.selos.ok : t === 'atencao' ? tema.selos.aviso : tema.selos.info);
  return (
    <View style={styles.insights}>
      {itens.map((i, k) => (
        <View key={k} style={styles.insight}>
          <View style={[styles.insightIcone, { backgroundColor: cor(i.tom).fundo }]}>
            <Ionicons name={ICONE_INSIGHT[i.tom]} size={18} color={cor(i.tom).texto} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText style={styles.insightTitulo}>{i.titulo}</AppText>
            <AppText style={styles.insightTexto}>{i.texto}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------- estágios por semana (barras empilhadas)

export function GraficoEstagios({ semanas, altura = 180 }: { semanas: SemanaEstagios[]; altura?: number }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(1, ...semanas.map(totalSemana));
  // de baixo (ancorado no eixo) para cima: frequentes → ocasionais → pausa → inativos → novos
  const cores: Record<Estagio, string> = {
    frequentes: tema.rampaUso[3], ocasionais: tema.rampaUso[2], pausa: tema.rampaUso[1], inativos: tema.rampaUso[0], novos: tema.corNovos,
  };
  const ordem: Estagio[] = [...ESTAGIOS, 'novos'];
  const descrever = (s: SemanaEstagios) =>
    `Semana de ${diaMes(s.inicio)}: ${ordem.map((e) => `${s[e]} ${ROTULO_ESTAGIO[e].split(' (')[0].toLowerCase()}`).join(', ')} (total ${totalSemana(s)})`;
  const passoRotulo = Math.max(1, Math.ceil(semanas.length / 6));

  if (!semanas.some((s) => totalSemana(s) > 0)) return <AppText style={styles.vazio}>Ainda não há adolescentes cadastrados no período.</AppText>;

  const grafico = (
    <View style={{ gap: 8 }}>
      <View style={[styles.colunas, { height: altura }]}>
        {semanas.map((s, i) => {
          const total = totalSemana(s);
          const ultima = i === semanas.length - 1;
          return (
            <Pressable
              key={s.inicio}
              onPress={() => setSel(i)}
              onHoverIn={() => setSel(i)}
              accessibilityRole="button"
              accessibilityLabel={descrever(s)}
              style={({ hovered }: Hover) => [styles.coluna, (hovered || sel === i) && styles.colunaFoco]}
            >
              {ultima && total > 0 && <AppText style={styles.rotuloDireto}>{total}</AppText>}
              <View style={{ height: (altura - 18) * (total / max), justifyContent: 'flex-end' }}>
                {[...ordem].reverse().map((e, k, arr) => {
                  const v = s[e];
                  if (!v) return null;
                  const primeiraVisivel = arr.findIndex((x) => s[x] > 0) === k;
                  return (
                    <View
                      key={e}
                      style={{
                        flexGrow: v,
                        flexBasis: 0,
                        minHeight: 2,
                        backgroundColor: cores[e],
                        marginTop: primeiraVisivel ? 0 : 2, // 2px de respiro entre segmentos
                        borderTopLeftRadius: primeiraVisivel ? 4 : 0,
                        borderTopRightRadius: primeiraVisivel ? 4 : 0,
                      }}
                    />
                  );
                })}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.eixo} />
      <View style={styles.rotulosX}>
        {semanas.map((s, i) => (
          <AppText key={s.inicio} style={styles.rotuloX} numberOfLines={1}>
            {i % passoRotulo === 0 || i === semanas.length - 1 ? diaMes(s.inicio) : ''}
          </AppText>
        ))}
      </View>
      <Leitura texto={sel !== null && semanas[sel] ? descrever(semanas[sel]) : null} padrao="Passe o mouse ou toque numa semana para ver os números." />
      <Legenda itens={ordem.map((e) => ({ cor: cores[e], rotulo: ROTULO_ESTAGIO[e], ajuda: AJUDA_ESTAGIO[e] }))} />
    </View>
  );

  return (
    <ComTabela
      grafico={grafico}
      colunas={['Semana', ...ordem.map((e) => ROTULO_ESTAGIO[e].split(' (')[0]), 'Total']}
      linhas={semanas.map((s) => [diaMes(s.inicio), ...ordem.map((e) => s[e]), totalSemana(s)])}
    />
  );
}

// ---------------------------------------------------------------- mapa de calor genérico

type PropsMapa = {
  linhas: string[];
  colunas: string[];
  valor: (linha: number, coluna: number) => number | null | undefined;
  /** valor máximo da escala (100 para %) */
  max: number;
  formatar: (v: number) => string;
  descrever: (linha: number, coluna: number, v: number | null | undefined) => string;
  /** texto das células sem número (ex.: menos de 5 pessoas) */
  rotuloSemDado?: string;
  larguraRotulo?: number;
};

export function MapaCalor({ linhas, colunas, valor, max, formatar, descrever, rotuloSemDado = 'Poucos dados (menos de 5 pessoas)', larguraRotulo = 64 }: PropsMapa) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [sel, setSel] = useState<[number, number] | null>(null);
  const corDe = (v: number | null | undefined) => {
    if (v === null || v === undefined) return null;
    const n = nivel(v, max);
    return n < 0 ? tema.superficieSuave : tema.rampaUso[n];
  };
  // texto dentro da célula: claro sobre os dois passos mais fortes, escuro nos outros
  const tintaDe = (v: number | null | undefined) => {
    if (v === null || v === undefined) return tema.textoSuave;
    const n = nivel(v, max);
    const forte = tema.nome === 'escuro' ? n <= 1 && n >= 0 : n >= 2;
    return forte ? colors.white : tema.texto;
  };

  const grafico = (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ gap: 2 }}>
          <View style={styles.mapaLinha}>
            <View style={{ width: larguraRotulo }} />
            {colunas.map((c) => <AppText key={c} style={styles.mapaColuna} numberOfLines={1}>{c}</AppText>)}
          </View>
          {linhas.map((l, r) => (
            <View key={l} style={styles.mapaLinha}>
              <AppText style={[styles.mapaRotulo, { width: larguraRotulo }]} numberOfLines={1}>{l}</AppText>
              {colunas.map((_, c) => {
                const v = valor(r, c);
                const cor = corDe(v);
                const ativa = sel?.[0] === r && sel?.[1] === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setSel([r, c])}
                    onHoverIn={() => setSel([r, c])}
                    accessibilityRole="button"
                    accessibilityLabel={descrever(r, c, v)}
                    style={[styles.celula, cor ? { backgroundColor: cor } : styles.celulaSemDado, ativa && styles.celulaFoco]}
                  >
                    <AppText style={[styles.celulaTexto, { color: tintaDe(v) }]}>{v === null || v === undefined ? '·' : formatar(v)}</AppText>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      <Leitura texto={sel ? descrever(sel[0], sel[1], valor(sel[0], sel[1])) : null} padrao="Passe o mouse ou toque numa célula para ver o detalhe." />
      <View style={styles.escala}>
        <AppText style={styles.legendaTexto}>Menos</AppText>
        {tema.rampaUso.map((c) => <View key={c} style={[styles.escalaPasso, { backgroundColor: c }]} />)}
        <AppText style={styles.legendaTexto}>Mais</AppText>
        <View style={[styles.escalaPasso, styles.celulaSemDado, { marginLeft: 12 }]} />
        <AppText style={styles.legendaTexto}>{rotuloSemDado}</AppText>
      </View>
    </View>
  );

  return (
    <ComTabela
      grafico={grafico}
      colunas={['', ...colunas]}
      linhas={linhas.map((l, r) => [l, ...colunas.map((_, c) => { const v = valor(r, c); return v === null || v === undefined ? '—' : formatar(v); })])}
    />
  );
}

// ---------------------------------------------------------------- calendário individual

const NIVEL_DIA = ['Abriu o app', '2 tipos de uso', 'Abriu, registrou e fez lição'];

/** Intensidade do dia: quantos TIPOS de uso houve (app, registro, lição). */
function tiposDeUso(d: DiaCalendario): number {
  return (d.acoes > 0 ? 1 : 0) + (d.registro ? 1 : 0) + (d.licoes > 0 ? 1 : 0);
}

export function CalendarioAtividade({ calendario }: { calendario: DiaCalendario[] }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [sel, setSel] = useState<DiaCalendario | null>(null);
  const semanas = semanasCalendario(calendario);
  const corTipos = [tema.superficieSuave, tema.rampaUso[0], tema.rampaUso[2], tema.rampaUso[3]];
  const descrever = (d: DiaCalendario) => {
    if (d.antes_do_cadastro) return `${diaMes(d.data)}: antes do cadastro.`;
    const partes = [d.acoes > 0 && `${d.acoes} ação(ões) no app`, d.registro && 'fez registro do dia', d.licoes > 0 && `${d.licoes} lição(ões) concluída(s)`].filter(Boolean);
    return `${diaMes(d.data)}: ${partes.length ? partes.join(', ') : 'sem uso'}.`;
  };

  const grafico = (
    <View style={{ gap: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 3 }}>
          <View style={{ gap: 3, marginRight: 4 }}>
            {DIAS_SEMANA.map((d, i) => <AppText key={d} style={styles.calRotulo}>{i % 2 === 0 ? d : ''}</AppText>)}
          </View>
          {semanas.map((sem, k) => (
            <View key={k} style={{ gap: 3 }}>
              {sem.map((d, i) =>
                d ? (
                  <Pressable
                    key={i}
                    onPress={() => setSel(d)}
                    onHoverIn={() => setSel(d)}
                    accessibilityRole="button"
                    accessibilityLabel={descrever(d)}
                    style={[
                      styles.calDia,
                      d.antes_do_cadastro ? styles.calAntes : { backgroundColor: corTipos[tiposDeUso(d)] },
                      sel?.data === d.data && styles.celulaFoco,
                    ]}
                  />
                ) : (
                  <View key={i} style={[styles.calDia, { backgroundColor: 'transparent' }]} />
                )
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      <Leitura texto={sel ? descrever(sel) : null} padrao="Passe o mouse ou toque num dia para ver o que aconteceu." />
      <Legenda
        itens={[
          { cor: tema.superficieSuave, rotulo: 'Sem uso' },
          ...NIVEL_DIA.map((r, i) => ({ cor: corTipos[i + 1], rotulo: r })),
        ]}
      />
    </View>
  );

  const ativos = calendario.filter((d) => !d.antes_do_cadastro && tiposDeUso(d) > 0);
  return (
    <ComTabela
      grafico={grafico}
      colunas={['Dia', 'Ações no app', 'Registro', 'Lições']}
      linhas={ativos.length ? ativos.map((d) => [diaMes(d.data), d.acoes, d.registro ? 'sim' : 'não', d.licoes]) : [['Sem uso no período', '', '', '']]}
    />
  );
}

// ---------------------------------------------------------------- marcos (linha do tempo)

export function MarcosJornada({ marcos, cadastro }: { marcos: { chave: ChaveMarco; data: string | null }[]; cadastro: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const ordenados = [...marcos].sort((a, b) => (a.data && b.data ? a.data.localeCompare(b.data) : a.data ? -1 : b.data ? 1 : 0));
  return (
    <View style={{ gap: 0 }} accessibilityRole="list">
      {ordenados.map((m, i) => {
        const feito = !!m.data;
        const ultimo = i === ordenados.length - 1;
        return (
          <View key={m.chave} style={styles.marco}>
            <View style={styles.marcoTrilho}>
              <View style={[styles.marcoPonto, feito ? { backgroundColor: tema.rampaUso[3], borderColor: tema.rampaUso[3] } : styles.marcoPontoVazio]}>
                {feito && <Ionicons name="checkmark" size={12} color={tema.card} />}
              </View>
              {!ultimo && <View style={[styles.marcoLinha, feito && ordenados[i + 1]?.data ? { backgroundColor: tema.rampaUso[2] } : null]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: ultimo ? 0 : 14, gap: 1 }}>
              <AppText style={[styles.marcoTitulo, !feito && { color: tema.textoSuave }]}>{ROTULO_MARCO[m.chave]}</AppText>
              <AppText style={styles.marcoData}>
                {feito
                  ? `${diaMes(m.data!)}${m.chave !== 'cadastro' ? ` · ${diasEntre(cadastro, m.data!)} dia(s) após o cadastro` : ''}`
                  : 'Ainda não aconteceu'}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  vazio: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoSuave } as const,
  leitura: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: t.superficieSuave } as const,
  leituraTexto: { flex: 1, fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoCorpo } as const,
  legenda: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 } as const,
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 } as const,
  legendaCor: { width: 12, height: 12, borderRadius: 3 } as const,
  legendaTexto: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave } as const,
  alternar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: ALVO_TOQUE - 8 } as const,
  alternarTexto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.destaqueTexto } as const,
  tLinha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.linhaSuave } as const,
  tCabecalho: { borderBottomColor: t.cardBorda } as const,
  tCelula: { width: 88, paddingVertical: 6, paddingHorizontal: 6, fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoCorpo, textAlign: 'right' } as const,
  tPrimeira: { width: 110, textAlign: 'left' } as const,
  tTh: { fontFamily: typography.bold, color: t.textoSuave } as const,

  insights: { gap: 10 } as const,
  insight: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 12, borderWidth: t.borda, borderColor: t.cardBorda, backgroundColor: t.card } as const,
  insightIcone: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' } as const,
  insightTitulo: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.texto } as const,
  insightTexto: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoCorpo, lineHeight: 17 } as const,

  colunas: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 } as const,
  coluna: { flex: 1, minWidth: 8, justifyContent: 'flex-end', alignItems: 'stretch', borderRadius: 4, paddingHorizontal: 1 } as const,
  colunaFoco: { backgroundColor: t.superficieSuave } as const,
  rotuloDireto: { fontFamily: typography.bold, fontSize: fonte.selo, color: t.texto, textAlign: 'center', marginBottom: 2 } as const,
  eixo: { height: 1, backgroundColor: t.cardBorda, marginTop: -8 } as const,
  rotulosX: { flexDirection: 'row', gap: 4 } as const,
  rotuloX: { flex: 1, minWidth: 8, fontFamily: typography.regular, fontSize: 10, color: t.textoSuave, textAlign: 'center' } as const,

  mapaLinha: { flexDirection: 'row', alignItems: 'center', gap: 2 } as const,
  mapaColuna: { width: 52, fontFamily: typography.semiBold, fontSize: 10, color: t.textoSuave, textAlign: 'center' } as const,
  mapaRotulo: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.textoCorpo, paddingRight: 6 } as const,
  celula: { width: 52, height: 34, borderRadius: 4, alignItems: 'center', justifyContent: 'center' } as const,
  celulaSemDado: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: t.chipBorda } as const,
  celulaFoco: { borderWidth: 2, borderColor: t.texto } as const,
  celulaTexto: { fontFamily: typography.semiBold, fontSize: 11 } as const,
  escala: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 } as const,
  escalaPasso: { width: 18, height: 12, borderRadius: 3 } as const,

  calRotulo: { height: 14, fontFamily: typography.regular, fontSize: 10, color: t.textoSuave, lineHeight: 14 } as const,
  calDia: { width: 14, height: 14, borderRadius: 3 } as const,
  calAntes: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: t.linhaSuave } as const,

  marco: { flexDirection: 'row', gap: 10 } as const,
  marcoTrilho: { alignItems: 'center', width: 20 } as const,
  marcoPonto: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' } as const,
  marcoPontoVazio: { borderColor: t.chipBorda, borderStyle: 'dashed', backgroundColor: t.card } as const,
  marcoLinha: { flex: 1, width: 2, backgroundColor: t.linhaSuave, marginVertical: 2 } as const,
  marcoTitulo: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto } as const,
  marcoData: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave } as const,
});
