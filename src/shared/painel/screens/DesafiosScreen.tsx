// src/shared/painel/screens/DesafiosScreen.tsx
// Catálogo de desafios (missões diárias e periódicas) e de conquistas, com uso real e
// ativar/desativar. Compartilhado por Admin e Nutricionista; o banco confere o papel em cada chamada.
//
// Arquitetura da informação: cada catálogo é uma aba (antes eram 4 seções empilhadas numa página
// só). Criar/editar abre um assistente em etapas no lugar da lista, com a prévia da missão, e
// "Voltar à lista" devolve a pessoa para a aba de onde saiu.
import React, { useCallback, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../PainelLayout';
import { IntroSecao } from '../components/IntroSecao';
import { AbasPainel } from '../components/AbasPainel';
import { GridResponsiva } from '../components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../components/EstadosPainel';
import { Selo, VazioPainel } from '../components/ControlesLista';
import { AvisoPainel, type TomAviso } from '../components/Formulario';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import { IconeMissao } from '../../ui/IconeMissao';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import type { ConfigPainel } from '../types';
import { FormConquista, FormDesafioDiario, FormDesafioPeriodico, FormPontosDiario } from '../components/FormulariosDesafio';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import {
  CRITERIO_LABEL, InsigniaPainel, definirInsigniaAtiva, listarInsignias,
  DesafioDiario, DesafioPeriodico, METRICA_LABEL, definirDesafioAtivo, listarDesafios,
  DesafioDiarioCustom, REGRAS_DIARIAS, excluirDesafioPeriodico, excluirDiarioCustom, excluirInsignia,
  listarDiariosCustom, salvarDiarioCustom,
} from '../../../features/nutricionista/services/desafiosService';

type Aba = 'diarios' | 'periodicos' | 'conquistas';
type Edicao =
  | { tipo: 'pontos'; item: DesafioDiario }
  | { tipo: 'diario'; item: DesafioDiarioCustom | null }
  | { tipo: 'periodico'; item: DesafioPeriodico | null }
  | { tipo: 'conquista'; item: InsigniaPainel | null };

const ROTULO_CAT: Record<string, string> = { conquista: 'Conquista', marco: 'Marco', insignia: 'Insígnia' };

function CartaoDesafio(p: {
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  selos: { texto: string; tom?: 'info' | 'neutro' | 'ok' }[];
  ativa: boolean;
  uso: string;
  ocupado: boolean;
  erro?: string | null;
  onAlternar: () => void;
  onEditar?: () => void;
  rotuloEditar?: string;
  onExcluir?: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.card, !p.ativa && styles.cardInativo]}>
      <View style={styles.topo}>
        <View style={styles.icone}>{p.icone}</View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <AppText style={styles.titulo} numberOfLines={2}>{p.titulo}</AppText>
          <View style={styles.selos}>
            {p.selos.map((s) => <Selo key={s.texto} texto={s.texto} tom={s.tom ?? 'info'} />)}
          </View>
        </View>
        <View style={styles.interruptor}>
          <Switch
            value={p.ativa}
            disabled={p.ocupado}
            onValueChange={p.onAlternar}
            trackColor={{ true: tema.destaqueTexto, false: tema.chipBorda }}
            thumbColor={tema.card}
            accessibilityLabel={`${p.titulo}: ${p.ativa ? 'ativo' : 'desativado'}`}
          />
          <AppText style={[styles.interruptorTexto, p.ativa && { color: tema.destaqueTexto }]}>{p.ativa ? 'Ativo' : 'Desativado'}</AppText>
        </View>
      </View>
      {!!p.descricao && <AppText style={styles.descricao}>{p.descricao}</AppText>}
      <View style={styles.uso}>
        <Ionicons name="stats-chart-outline" size={14} color={tema.textoSuave} />
        <AppText style={styles.usoTexto}>{p.uso}</AppText>
      </View>
      {!!p.erro && <AvisoPainel tom="erro" texto={p.erro} />}
      {confirmando ? (
        <AvisoPainel
          tom="aviso"
          titulo="Excluir de vez?"
          texto="Esta ação não pode ser desfeita. Se houver histórico de uso, prefira desativar."
          acao={{ rotulo: 'Sim, excluir', onPress: () => { setConfirmando(false); p.onExcluir?.(); } }}
          onFechar={() => setConfirmando(false)}
        />
      ) : (
        <View style={styles.acoes}>
          {!!p.onEditar && (
            <AppButton label={p.rotuloEditar ?? 'EDITAR'} fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botao} onPress={p.onEditar} />
          )}
          {!!p.onExcluir && (
            <Pressable onPress={() => setConfirmando(true)} disabled={p.ocupado} accessibilityRole="button" accessibilityLabel={`Excluir ${p.titulo}`} style={styles.lixeira}>
              <Ionicons name="trash-outline" size={18} color={tema.erro} />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

/** Ícone da missão (nome escolhido no painel ou emoji antigo convertido). */
function IconeDesafio({ valor }: { valor: string | null | undefined }) {
  const { tema } = useTemaPainel();
  return <IconeMissao valor={valor} tamanho={22} cor={tema.destaqueTexto} />;
}

export default function DesafiosScreen({ config }: { config: ConfigPainel }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [diarios, setDiarios] = useState<DesafioDiario[]>([]);
  const [periodicos, setPeriodicos] = useState<DesafioPeriodico[]>([]);
  const [insignias, setInsignias] = useState<InsigniaPainel[]>([]);
  const [diariosCustom, setDiariosCustom] = useState<DesafioDiarioCustom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erroItem, setErroItem] = useState<{ ref: string; msg: string } | null>(null);
  const [aba, setAba] = useState<Aba>('diarios');
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [resultado, setResultado] = useState<{ tom: TomAviso; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await listarDesafios();
      setDiarios(r.diarios);
      setPeriodicos(r.periodicos);
      // falha aqui (migration ainda não rodou) não derruba a tela dos desafios
      setInsignias(await listarInsignias().catch(() => []));
      setDiariosCustom(await listarDiariosCustom().catch(() => []));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar os desafios.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setCarregando(true); carregar(); }, [carregar]));

  async function executar(ref: string, fn: () => Promise<void>, ok?: string) {
    setOcupado(ref);
    setErroItem(null);
    try {
      await fn();
      await carregar();
      if (ok) setResultado({ tom: 'ok', texto: ok });
    } catch (e: any) {
      setErroItem({ ref, msg: e?.message ?? '' });
    } finally {
      setOcupado(null);
    }
  }

  function usoDiarioCustom(d: DesafioDiarioCustom) {
    const r = REGRAS_DIARIAS.find((x) => x.chave === d.regra.regra);
    if (!r) return `Sorteado ${d.sorteada}x`;
    const sel = r.seletor?.opcoes.find((o) => o.chave === d.regra[r.seletor!.campo])?.label;
    const qtd = r.campo ? `${d.regra[r.campo]} ${r.unidade}` : '';
    return `Meta: ${[sel, qtd].filter(Boolean).join(' · ') || r.label} · Sorteado ${d.sorteada}x`;
  }

  function salvou(texto: string) {
    setEdicao(null);
    setResultado({ tom: 'ok', texto });
    carregar();
  }

  const ativos = (l: { ativa: boolean }[]) => l.filter((x) => x.ativa).length;
  const totalDiarios = diarios.length + diariosCustom.length;

  // ---- modo edição: o assistente ocupa a tela ----
  if (edicao) {
    const titulos: Record<Edicao['tipo'], string> = {
      pontos: 'Pontos do desafio diário',
      diario: edicao.item ? 'Editar desafio diário' : 'Novo desafio diário',
      periodico: edicao.item ? 'Editar desafio semanal ou mensal' : 'Novo desafio semanal ou mensal',
      conquista: edicao.item ? 'Editar conquista' : 'Nova conquista ou marco',
    };
    return (
      <PainelLayout config={config} titulo={titulos[edicao.tipo]} subtitulo="Desafios e conquistas">
        <Pressable onPress={() => setEdicao(null)} accessibilityRole="button" style={styles.voltarLista}>
          <Ionicons name="arrow-back" size={16} color={tema.destaqueTexto} />
          <AppText style={styles.voltarListaTexto}>Voltar à lista</AppText>
        </Pressable>
        {edicao.tipo === 'pontos' && <FormPontosDiario inicial={edicao.item} onSalvo={() => salvou('Pontos atualizados.')} onCancelar={() => setEdicao(null)} />}
        {edicao.tipo === 'diario' && <FormDesafioDiario inicial={edicao.item} onSalvo={() => salvou(edicao.item ? 'Desafio diário salvo.' : 'Desafio diário criado. Ele já entra no sorteio do dia.')} onCancelar={() => setEdicao(null)} />}
        {edicao.tipo === 'periodico' && <FormDesafioPeriodico inicial={edicao.item} onSalvo={() => salvou(edicao.item ? 'Desafio salvo.' : 'Desafio criado.')} onCancelar={() => setEdicao(null)} />}
        {edicao.tipo === 'conquista' && <FormConquista inicial={edicao.item} onSalvo={() => salvou(edicao.item ? 'Conquista salva.' : 'Conquista criada.')} onCancelar={() => setEdicao(null)} />}
      </PainelLayout>
    );
  }

  const botaoNovo =
    aba === 'diarios' ? { label: '+ NOVO DESAFIO DIÁRIO', onPress: () => setEdicao({ tipo: 'diario', item: null }) }
    : aba === 'periodicos' ? { label: '+ NOVO DESAFIO', onPress: () => setEdicao({ tipo: 'periodico', item: null }) }
    : { label: '+ NOVA CONQUISTA', onPress: () => setEdicao({ tipo: 'conquista', item: null }) };

  return (
    <PainelLayout
      config={config}
      titulo="Desafios e conquistas"
      subtitulo="Missões e reconhecimentos que os adolescentes recebem"
      acao={!carregando && !erro ? <AppButton label={botaoNovo.label} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botao} onPress={botaoNovo.onPress} /> : undefined}
    >
      <IntroSecao
        chave="painel_desafios"
        titulo="Como funcionam os desafios"
        linhas={[
          'Desafios diários: cada dia o adolescente recebe missões (ex.: beber água, registrar refeição). Ao concluir, ganha pontos.',
          'Desafios semanais e mensais: metas maiores, que somam vários dias de hábito.',
          'Os desafios diários do catálogo base podem ser ativados, desativados e ter os pontos ajustados (o texto de cada missão vem das regras do app). Você também pode criar novos desafios diários escolhendo entre os tipos que o app já mede.',
          'Desafios criados por você, semanais, mensais, conquistas e marcos podem ser editados e excluídos. Se já houver histórico de uso, prefira desativar.',
          'Desativar um desafio o tira dos próximos sorteios e metas; o histórico de quem já concluiu permanece.',
        ]}
      />
      {!!resultado && <AvisoPainel tom={resultado.tom} texto={resultado.texto} onFechar={() => setResultado(null)} />}
      {carregando ? (
        <EstadoCarregando texto="Carregando os desafios…" />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <AbasPainel<Aba>
            ativa={aba}
            onChange={(a) => { setAba(a); setResultado(null); }}
            abas={[
              { chave: 'diarios', label: `Diários · ${ativos(diarios) + ativos(diariosCustom)}/${totalDiarios} ativos`, icone: 'sunny-outline' },
              { chave: 'periodicos', label: `Semanais e mensais · ${ativos(periodicos)}/${periodicos.length}`, icone: 'calendar-outline' },
              { chave: 'conquistas', label: `Conquistas · ${ativos(insignias)}/${insignias.length}`, icone: 'ribbon-outline' },
            ]}
          />

          {aba === 'diarios' && (
            <View style={{ gap: 18 }}>
              <View style={{ gap: 10 }}>
                <AppText style={styles.secao}>Criados no painel ({diariosCustom.length})</AppText>
                {diariosCustom.length === 0 ? (
                  <VazioPainel titulo="Nenhum desafio diário criado" texto="Crie missões com as ações que o app já mede (água, atividade, refeições, grupos alimentares...)." acao={{ label: 'CRIAR O PRIMEIRO', onPress: () => setEdicao({ tipo: 'diario', item: null }) }} />
                ) : (
                  <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                    {diariosCustom.map((d) => (
                      <CartaoDesafio
                        key={d.codigo}
                        icone={<IconeDesafio valor={d.icone} />}
                        titulo={d.titulo}
                        descricao={d.descricao}
                        selos={[{ texto: 'Criado no painel', tom: 'neutro' }]}
                        ativa={d.ativa}
                        uso={usoDiarioCustom(d)}
                        ocupado={ocupado === d.codigo}
                        erro={erroItem?.ref === d.codigo ? erroItem.msg : null}
                        onAlternar={() => executar(d.codigo, async () => { await salvarDiarioCustom({ codigo: d.codigo, titulo: d.titulo, descricao: d.descricao, icone: d.icone ?? '', regra: d.regra, ativa: !d.ativa }); })}
                        onEditar={() => setEdicao({ tipo: 'diario', item: d })}
                        onExcluir={() => executar(d.codigo, () => excluirDiarioCustom(d.codigo), 'Desafio excluído.')}
                      />
                    ))}
                  </GridResponsiva>
                )}
              </View>
              <View style={{ gap: 10 }}>
                <AppText style={styles.secao}>Catálogo base do app ({diarios.length})</AppText>
                <AppText style={styles.ajuda}>O texto vem das regras do app; aqui você ativa, desativa e ajusta os pontos.</AppText>
                {diarios.length === 0 ? (
                  <VazioPainel titulo="Nenhum desafio diário" texto="O catálogo de missões diárias está vazio." />
                ) : (
                  <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                    {diarios.map((d) => (
                      <CartaoDesafio
                        key={d.ref}
                        icone={<Ionicons name="sunny-outline" size={22} color={tema.destaqueTexto} />}
                        titulo={d.titulo}
                        descricao={d.descricao}
                        selos={[{ texto: `${d.pontos} pontos` }]}
                        ativa={d.ativa}
                        uso={`Sorteado ${d.sorteada}x · Concluído ${d.concluida}x`}
                        ocupado={ocupado === d.ref}
                        erro={erroItem?.ref === d.ref ? erroItem.msg : null}
                        onAlternar={() => executar(d.ref, () => definirDesafioAtivo('DIARIO', d.ref, !d.ativa))}
                        onEditar={() => setEdicao({ tipo: 'pontos', item: d })}
                        rotuloEditar="AJUSTAR PONTOS"
                      />
                    ))}
                  </GridResponsiva>
                )}
              </View>
            </View>
          )}

          {aba === 'periodicos' &&
            (periodicos.length === 0 ? (
              <VazioPainel titulo="Nenhum desafio semanal ou mensal" texto="Metas maiores, que somam vários dias de hábito." acao={{ label: 'CRIAR O PRIMEIRO', onPress: () => setEdicao({ tipo: 'periodico', item: null }) }} />
            ) : (
              <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                {periodicos.map((d) => (
                  <CartaoDesafio
                    key={d.ref}
                    icone={<IconeDesafio valor={d.icone} />}
                    titulo={d.titulo}
                    descricao={d.descricao}
                    selos={[{ texto: d.periodo === 'SEMANAL' ? 'Semanal' : 'Mensal', tom: 'neutro' }, { texto: `${d.pontos} pontos` }]}
                    ativa={d.ativa}
                    uso={`Meta: ${d.alvo} ${METRICA_LABEL[d.metrica] ?? d.metrica}${d.parametros?.passos ? ` (${d.parametros.passos} passos/dia)` : ''}${d.parametros?.grupos ? ` (${d.parametros.grupos}+ grupos/dia)` : ''} · Resgatado ${d.resgatada}x`}
                    ocupado={ocupado === d.ref}
                    erro={erroItem?.ref === d.ref ? erroItem.msg : null}
                    onAlternar={() => executar(d.ref, () => definirDesafioAtivo('PERIODICO', d.ref, !d.ativa))}
                    onEditar={() => setEdicao({ tipo: 'periodico', item: d })}
                    onExcluir={() => executar(d.ref, () => excluirDesafioPeriodico(d.ref), 'Desafio excluído.')}
                  />
                ))}
              </GridResponsiva>
            ))}

          {aba === 'conquistas' && (
            <View style={{ gap: 10 }}>
              <AppText style={styles.ajuda}>Reconhecimentos que o adolescente ganha sozinho ao atingir a meta. Insígnias têm arte exclusiva do app: aqui dá para editar o texto e a meta delas.</AppText>
              {insignias.length === 0 ? (
                <VazioPainel titulo="Nada por aqui ainda" texto="Se você acabou de atualizar o app, rode a migration migration_painel_mvp_final.sql no Supabase." acao={{ label: 'CRIAR CONQUISTA', onPress: () => setEdicao({ tipo: 'conquista', item: null }) }} />
              ) : (
                <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                  {insignias.map((i) => (
                    <CartaoDesafio
                      key={i.id}
                      icone={<Ionicons name={(i.icone ?? 'ribbon') as any} size={22} color={tema.destaqueTexto} />}
                      titulo={i.nome}
                      descricao={i.descricao ?? ''}
                      selos={[{ texto: ROTULO_CAT[i.categoria] ?? i.categoria, tom: i.categoria === 'insignia' ? 'ok' : 'info' }]}
                      ativa={i.ativa}
                      uso={`Ganha com ${i.min ?? '?'} ${CRITERIO_LABEL[i.tipo ?? ''] ?? i.tipo ?? ''} · Conquistada ${i.ganhas}x`}
                      ocupado={ocupado === i.id}
                      erro={erroItem?.ref === i.id ? erroItem.msg : null}
                      onAlternar={() => executar(i.id, () => definirInsigniaAtiva(i.id, !i.ativa))}
                      onEditar={() => setEdicao({ tipo: 'conquista', item: i })}
                      onExcluir={i.categoria === 'insignia' ? undefined : () => executar(i.id, () => excluirInsignia(i.id), 'Conquista excluída.')}
                    />
                  ))}
                </GridResponsiva>
              )}
            </View>
          )}
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 14, gap: 10, minWidth: 0, flex: 1 },
  cardInativo: { backgroundColor: t.superficieSuave },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  icone: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  interruptor: { alignItems: 'center', gap: 2, minWidth: 64 },
  interruptorTexto: { fontFamily: typography.semiBold, fontSize: fonte.selo, color: t.textoSuave },
  titulo: { fontFamily: typography.bold, fontSize: fonte.corpo + 1, color: t.texto },
  descricao: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoCorpo, lineHeight: 19 },
  uso: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  usoTexto: { flex: 1, fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 'auto' },
  lixeira: { width: ALVO_TOQUE, height: ALVO_TOQUE, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  botao: { paddingHorizontal: 16, minHeight: ALVO_TOQUE },
  secao: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.textoSuave, textTransform: 'uppercase', letterSpacing: 0.6 },
  ajuda: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoSuave, lineHeight: 19 },
  voltarLista: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: ALVO_TOQUE },
  voltarListaTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.destaqueTexto },
}) as const;
