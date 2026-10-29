// src/features/conteudo/screens/EditarTrilhaScreen.tsx
// Criar uma trilha ou editar tudo nela: título, descrição, tema, ordem e XP bônus; organizar os
// módulos e as lições (criar, renomear, reordenar, excluir) e abrir cada lição para editar.
// Reordenar e excluir são atômicos no banco (migration_trilha_estrutura.sql); excluir é bloqueado
// se adolescentes já concluíram a lição. O status (rascunho/revisão/publicado) NÃO muda aqui.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  TrilhaEditavel, TrilhaOrdemLinha, buscarTrilhaEditavel, criarModulo, criarTrilha, excluirItem, listarTemas,
  listarTrilhasOrdem, reordenarItens, salvarModulo, salvarTrilha,
} from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';
import { MiniBotao } from '../components/MiniBotao';
import PreviaTrilhaAoVivo from '../components/preview/PreviaTrilhaAoVivo';
import { BotaoComoCriar } from '../components/GuiaCriacao';
import {
  XP_BONUS_PADRAO_MODULO, XP_BONUS_PADRAO_TRILHA, avisoOrdemTrilha, idsAposMover, lerXpBonus, posicaoNoCaminho, proximaOrdemTrilha,
  textoConfirmaExclusao, textoPosicaoNoCaminho, validarModulo, validarTrilha,
} from '../utils/trilhaEdicao';

type Props = { config: ConfigPainel; route: { params?: { trilhaId?: string; origem?: string } } };
type Exclusao = { nivel: 'MODULO' | 'LICAO'; id: string; titulo: string; qtdLicoes: number };

const txtXp = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

export default function EditarTrilhaScreen({ config, route }: Props) {
  const trilhaId = route.params?.trilhaId;
  const origem = route.params?.origem;
  const criando = !trilhaId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [trilha, setTrilha] = useState<TrilhaEditavel | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [temas, setTemas] = useState<string[]>([]);
  const [tema, setTema] = useState('');
  const [ordem, setOrdem] = useState('');
  const [xpBonus, setXpBonus] = useState('');
  const [trilhasOrdem, setTrilhasOrdem] = useState<TrilhaOrdemLinha[]>([]);
  const [novoModulo, setNovoModulo] = useState('');
  const [nomesModulo, setNomesModulo] = useState<Record<string, string>>({});
  const [xpModulo, setXpModulo] = useState<Record<string, string>>({});
  const [excluindo, setExcluindo] = useState<Exclusao | null>(null);
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // prévia ao vivo: ao lado do editor em telas largas; numa aba nas estreitas
  const [aba, setAba] = useState<'editar' | 'previa'>('editar');
  const { width: larguraJanela } = useWindowDimensions();
  const lado = larguraJanela >= 1280;

  useEffect(() => {
    obterPapelAtual().then(setPapel);
    listarTemas().then((t) => { setTemas(t); if (criando && t[0]) setTema((atual) => atual || t[0]); }).catch((e) => setErro(e?.message ?? 'Não foi possível carregar os temas.'));
    listarTrilhasOrdem().then(setTrilhasOrdem).catch(() => setTrilhasOrdem([]));
  }, [criando]);

  // trilha nova: sugere a ordem depois de todas as existentes (não passa na frente de nenhuma)
  useEffect(() => {
    if (criando && ordem === '') setOrdem(String(proximaOrdemTrilha(trilhasOrdem.map((t) => t.ordem))));
  }, [criando, ordem, trilhasOrdem]);

  const carregar = useCallback(async () => {
    if (!trilhaId) return;
    try {
      const t = await buscarTrilhaEditavel(trilhaId);
      setTrilha(t);
      setTitulo(t.titulo);
      setDescricao(t.descricao ?? '');
      setTema(t.tema);
      setOrdem(String(t.ordem));
      setXpBonus(txtXp(t.xpBonus));
      setNomesModulo(Object.fromEntries(t.modulos.map((m) => [m.id, m.titulo])));
      setXpModulo(Object.fromEntries(t.modulos.map((m) => [m.id, txtXp(m.xpBonus)])));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [trilhaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function executar(fn: () => Promise<void>, sucesso: string) {
    setOcupado(true);
    setErro(null);
    setMsg(null);
    try {
      await fn();
      setMsg(sucesso);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  async function salvar() {
    setMsg(null);
    const problemas = validarTrilha({ titulo, descricao, tema, ordem, xpBonus });
    if (problemas.length > 0) return setErro(problemas[0]);
    const xp = lerXpBonus(xpBonus);
    if (criando) {
      setOcupado(true);
      setErro(null);
      try {
        const id = await criarTrilha({ titulo, descricao, tema, ordem: Number(ordem), xpBonus: xp });
        navigation.replace('EditarTrilha', { trilhaId: id, origem });
      } catch (e: any) {
        setErro(e?.message ?? 'Não foi possível criar a trilha.');
        setOcupado(false);
      }
      return;
    }
    if (!trilha) return;
    // só os campos que mudaram (o trigger do fluxo dispara em quem aparece no UPDATE)
    const mudou: Parameters<typeof salvarTrilha>[1] = {};
    if (titulo.trim() !== trilha.titulo) mudou.titulo = titulo;
    if (descricao.trim() !== (trilha.descricao ?? '')) mudou.descricao = descricao;
    if (tema !== trilha.tema) mudou.tema = tema;
    if (Number(ordem) !== trilha.ordem) mudou.ordem = Number(ordem);
    if (xp !== trilha.xpBonus) mudou.xpBonus = xp;
    if (Object.keys(mudou).length === 0) return setMsg('Nada para salvar: nenhuma alteração.');
    await executar(async () => { await salvarTrilha(trilha.id, mudou); await carregar(); setTrilhasOrdem(await listarTrilhasOrdem()); }, 'Trilha salva.');
  }

  async function adicionarModulo() {
    if (!trilha) return;
    const problemas = validarModulo({ titulo: novoModulo, xpBonus: '' });
    if (problemas.length > 0) return setErro(problemas[0]);
    const proxima = (trilha.modulos.reduce((m, x) => Math.max(m, x.ordem), 0) || 0) + 1;
    await executar(async () => { await criarModulo(trilha.id, novoModulo, proxima); setNovoModulo(''); await carregar(); }, 'Módulo adicionado.');
  }

  async function salvarDadosModulo(id: string) {
    const original = trilha?.modulos.find((m) => m.id === id);
    if (!original) return;
    const novoTitulo = nomesModulo[id] ?? original.titulo;
    const novoXp = xpModulo[id] ?? '';
    const problemas = validarModulo({ titulo: novoTitulo, xpBonus: novoXp });
    if (problemas.length > 0) return setErro(problemas[0]);
    const mudou: Parameters<typeof salvarModulo>[1] = {};
    if (novoTitulo.trim() !== original.titulo) mudou.titulo = novoTitulo;
    if (lerXpBonus(novoXp) !== original.xpBonus) mudou.xpBonus = lerXpBonus(novoXp);
    if (Object.keys(mudou).length === 0) return;
    await executar(async () => { await salvarModulo(id, mudou); await carregar(); }, 'Módulo salvo.');
  }

  async function moverItem(nivel: 'MODULO' | 'LICAO', paiId: string, ids: string[], i: number, dir: -1 | 1) {
    const novos = idsAposMover(ids, i, dir);
    if (novos === ids) return;
    await executar(async () => { await reordenarItens(nivel, paiId, novos); await carregar(); }, 'Ordem atualizada.');
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    setExcluindo(null);
    await executar(async () => { await excluirItem(alvo.nivel, alvo.id); await carregar(); }, alvo.nivel === 'MODULO' ? 'Módulo excluído.' : 'Lição excluída.');
  }

  const ordemNum = Number.isInteger(Number(ordem)) && ordem.trim() !== '' ? Number(ordem) : null;
  const posicao = useMemo(
    () => posicaoNoCaminho(trilhasOrdem, { id: trilha?.id, ordem: ordemNum ?? 0, titulo }),
    [trilhasOrdem, trilha?.id, ordemNum, titulo]
  );
  const publicada = trilhasOrdem.find((t) => t.id === trilha?.id)?.status === 'aprovada';
  const avisoOrdem = useMemo(
    () => (ordemNum === null ? null : avisoOrdemTrilha(trilhasOrdem, { id: trilha?.id, ordem: ordemNum })),
    [ordemNum, trilhasOrdem, trilha?.id]
  );
  // módulos como estão na tela AGORA (nomes digitados, ainda não salvos) para a prévia ao vivo
  const modulosRascunho = useMemo(
    () => (trilha ? trilha.modulos.map((m) => ({ ...m, titulo: (nomesModulo[m.id] ?? m.titulo).trim() || 'Sem nome' })) : []),
    [trilha, nomesModulo]
  );
  const previa = (
    <PreviaTrilhaAoVivo
      titulo={titulo}
      modulos={modulosRascunho}
      numero={posicao.posicao}
      total={posicao.total}
      onPressNo={(licaoId) => navigation.navigate('LicaoPreview', { licaoId, origem })}
    />
  );

  function CaixaExclusao({ alvo }: { alvo: Exclusao }) {
    if (!excluindo || excluindo.id !== alvo.id) return null;
    return (
      <View style={styles.confirma}>
        <AppText style={styles.confirmaTexto}>{textoConfirmaExclusao(alvo.nivel, alvo.titulo, alvo.qtdLicoes)}</AppText>
        <View style={styles.linhaBotoes}>
          <AppButton label="EXCLUIR" fullWidth={false} size="compact" backgroundColor={colors.error} textColor={colors.white} shadowColor="#7a1f1f" disabled={ocupado} style={styles.botaoPequeno} onPress={confirmarExclusao} />
          <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={styles.botaoPequeno} onPress={() => setExcluindo(null)} />
        </View>
      </View>
    );
  }

  return (
    <PainelLayout config={config} titulo={criando ? 'Nova trilha' : 'Editar trilha'} subtitulo={criando ? 'A trilha nasce como rascunho' : trilha?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !trilha ? (
        <EstadoErro mensagem={erro ?? 'Trilha não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <View style={lado ? styles.linhaLarga : styles.coluna}>
          <View style={lado ? styles.colEditor : styles.coluna}>
            {!lado && (
              <View style={styles.chips} accessibilityRole="tablist">
                {([['editar', 'Editar trilha'], ['previa', 'Prévia ao vivo']] as const).map(([id, rotulo]) => (
                  <Pressable key={id} onPress={() => setAba(id)} accessibilityRole="tab" accessibilityState={{ selected: aba === id }} style={[styles.chip, aba === id && styles.chipOn]}>
                    <AppText style={[styles.chipTexto, aba === id && { color: colors.white }]}>{rotulo}</AppText>
                  </Pressable>
                ))}
              </View>
            )}
            {!lado && aba === 'previa' && previa}
            {(lado || aba === 'editar') && (
              <>
          <BotaoComoCriar passo={criando ? 0 : 1} />
          <IntroSecao
            chave="editar_trilha"
            titulo="Criar e editar trilhas"
            linhas={[
              'Trilha → módulos → lições. Aqui você muda título, descrição, tema, ordem e XP bônus, organiza os módulos e as lições (criar, renomear, reordenar, excluir) e abre cada lição para editar o texto e os passos.',
              'Conteúdo novo nasce como rascunho. Depois de salvar, volte à página do conteúdo para enviar para revisão (ou aprovar e publicar, se você for nutricionista).',
            ]}
          />
          <AvisoEdicao papel={papel} />

          <CartaoSecao titulo="Dados da trilha" ajuda="Título e descrição aparecem para os adolescentes quando a trilha é publicada.">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Alimentação no dia a dia" maxLength={120} />
            <LabeledInput label="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Resumo curto da trilha" multiline maxLength={500} style={campoMultilinha} />
            <View style={{ gap: 6 }}>
              <AppText style={styles.rotulo}>Tema</AppText>
              {temas.length === 0 ? (
                <AppText style={styles.suave}>Carregando temas…</AppText>
              ) : (
                <View style={styles.chips}>
                  {temas.map((t) => (
                    <Pressable key={t} onPress={() => setTema(t)} accessibilityRole="button" style={[styles.chip, tema === t && styles.chipOn]}>
                      <AppText style={[styles.chipTexto, tema === t && { color: colors.white }]}>{t.replace(/_/g, ' ').toLowerCase()}</AppText>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.linha}>
              <View style={{ flex: 1, minWidth: 140 }}>
                <LabeledInput label="Ordem (1 aparece primeiro)" value={ordem} onChangeText={(t) => setOrdem(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={3} />
              </View>
              <View style={{ flex: 1, minWidth: 140 }}>
                <LabeledInput label={`XP bônus ao concluir (vazio = ${XP_BONUS_PADRAO_TRILHA})`} value={xpBonus} onChangeText={(t) => setXpBonus(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={4} />
              </View>
            </View>
            <AppText style={styles.suave}>{textoPosicaoNoCaminho(posicao, publicada)}</AppText>
            {!!avisoOrdem && <AppText style={styles.alerta}>{avisoOrdem}</AppText>}
            {!criando && <AppText style={styles.suave}>Mudar título, descrição, tema, ordem ou XP bônus de uma trilha já enviada ou publicada conta como edição: o Administrador a devolve para rascunho (ela sai do ar até a nutricionista aprovar de novo); a nutricionista mantém o status e a versão sobe.</AppText>}
            {!criando && trilha && (
              <View style={{ flexDirection: 'row' }}>
                <AppButton label="PRÉ-VISUALIZAR TRILHA" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={styles.botaoPequeno} onPress={() => navigation.navigate('TrilhaPreview', { trilhaId: trilha.id, origem })} />
              </View>
            )}
            <BarraSalvar
              rotulo={criando ? 'CRIAR TRILHA' : 'SALVAR'}
              ocupado={ocupado}
              onSalvar={salvar}
              onCancelar={() => navigation.goBack()}
              erro={erro}
              mensagem={msg}
            />
          </CartaoSecao>

          {!criando && trilha && (
            <CartaoSecao titulo="Módulos e lições" subtitulo="Toque em uma lição para editar" ajuda="Cada módulo agrupa lições. Use as setas para mudar a ordem; excluir remove também os passos e não é possível se adolescentes já concluíram a lição.">
              {trilha.modulos.length === 0 && <AppText style={styles.suave}>Esta trilha ainda não tem módulos. Adicione o primeiro abaixo.</AppText>}
              {trilha.modulos.map((m, mi) => {
                const idsModulos = trilha.modulos.map((x) => x.id);
                const idsLicoes = m.licoes.map((x) => x.id);
                const alvoModulo: Exclusao = { nivel: 'MODULO', id: m.id, titulo: m.titulo, qtdLicoes: m.licoes.length };
                const sujo = (nomesModulo[m.id] ?? m.titulo).trim() !== m.titulo || lerXpBonus(xpModulo[m.id] ?? '') !== m.xpBonus;
                return (
                  <View key={m.id} style={styles.modulo}>
                    <View style={styles.linha}>
                      <View style={{ flex: 1, minWidth: 140 }}>
                        <LabeledInput label={`Módulo ${m.ordem}`} value={nomesModulo[m.id] ?? m.titulo} onChangeText={(t) => setNomesModulo((a) => ({ ...a, [m.id]: t }))} maxLength={120} />
                      </View>
                      <View style={{ width: 130 }}>
                        <LabeledInput label={`XP bônus (${XP_BONUS_PADRAO_MODULO})`} value={xpModulo[m.id] ?? ''} onChangeText={(t) => setXpModulo((a) => ({ ...a, [m.id]: t.replace(/\D/g, '') }))} keyboardType="numeric" maxLength={4} />
                      </View>
                    </View>
                    <View style={styles.linhaBotoes}>
                      {sujo && (
                        <AppButton label="SALVAR MÓDULO" fullWidth={false} size="compact" backgroundColor={colors.primaryDark} textColor={colors.white} shadowColor="#123024" disabled={ocupado} style={styles.botaoPequeno} onPress={() => salvarDadosModulo(m.id)} />
                      )}
                      <MiniBotao label="↑" acessibilidade="Mover módulo para cima" desativado={ocupado || mi === 0} onPress={() => moverItem('MODULO', trilha.id, idsModulos, mi, -1)} />
                      <MiniBotao label="↓" acessibilidade="Mover módulo para baixo" desativado={ocupado || mi === trilha.modulos.length - 1} onPress={() => moverItem('MODULO', trilha.id, idsModulos, mi, 1)} />
                      <MiniBotao label="EXCLUIR MÓDULO" perigo desativado={ocupado} onPress={() => setExcluindo(alvoModulo)} />
                    </View>
                    <CaixaExclusao alvo={alvoModulo} />

                    {m.licoes.map((l, li) => {
                      const alvoLicao: Exclusao = { nivel: 'LICAO', id: l.id, titulo: l.titulo, qtdLicoes: 0 };
                      return (
                        <View key={l.id} style={styles.licao}>
                          <View style={styles.linha}>
                            <Pressable onPress={() => navigation.navigate('EditarLicao', { licaoId: l.id, origem })} accessibilityRole="button" style={{ flex: 1, minHeight: 48, justifyContent: 'center' }}>
                              <AppText style={styles.licaoTitulo}>{l.ordem}. {l.titulo}</AppText>
                              <AppText style={styles.suave}>{l.tipo} · {l.xp} XP  ›</AppText>
                            </Pressable>
                            <MiniBotao label="↑" acessibilidade="Mover lição para cima" desativado={ocupado || li === 0} onPress={() => moverItem('LICAO', m.id, idsLicoes, li, -1)} />
                            <MiniBotao label="↓" acessibilidade="Mover lição para baixo" desativado={ocupado || li === m.licoes.length - 1} onPress={() => moverItem('LICAO', m.id, idsLicoes, li, 1)} />
                            <MiniBotao label="✕" acessibilidade="Excluir lição" perigo desativado={ocupado} onPress={() => setExcluindo(alvoLicao)} />
                          </View>
                          <CaixaExclusao alvo={alvoLicao} />
                        </View>
                      );
                    })}
                    <View style={styles.linhaBotoes}>
                      {([['conteudo', '+ LEITURA'], ['quiz', '+ QUIZ'], ['atividade_rastreavel', '+ PRÁTICA REAL']] as const).map(([tipoNovo, rotulo]) => (
                        <AppButton
                          key={tipoNovo}
                          label={rotulo}
                          fullWidth={false}
                          size="compact"
                          outlineColor={colors.primaryDark}
                          textColor={colors.primaryDark}
                          style={styles.botaoPequeno}
                          onPress={() => navigation.navigate('EditarLicao', { moduloId: m.id, origem, tipoNovo, proximaOrdem: (m.licoes.reduce((x, l) => Math.max(x, l.ordem), 0) || 0) + 1 })}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
              <LabeledInput label="Novo módulo" value={novoModulo} onChangeText={setNovoModulo} placeholder="Nome do módulo" maxLength={120} />
              <View style={{ flexDirection: 'row' }}>
                <AppButton label="ADICIONAR MÓDULO" fullWidth={false} size="compact" backgroundColor={colors.primaryDark} textColor={colors.white} shadowColor="#123024" disabled={ocupado} style={styles.botaoPequeno} onPress={adicionarModulo} />
              </View>
              {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
              {!!msg && <AppText style={styles.ok}>{msg}</AppText>}
            </CartaoSecao>
          )}
              </>
            )}
          </View>

          {lado && (
            <View style={styles.colPrevia}>
              <View style={Platform.OS === 'web' ? ({ position: 'sticky', top: 16 } as any) : undefined}>{previa}</View>
            </View>
          )}
        </View>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  coluna: { gap: 16 },
  linhaLarga: { flexDirection: 'row', gap: 24 },
  colEditor: { flex: 1, minWidth: 0, gap: 16 },
  colPrevia: { width: 420 },
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark },
  suave: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, lineHeight: 17 },
  alerta: { fontFamily: typography.semiBold, fontSize: 12, color: colors.warningShadow, backgroundColor: colors.warningSoft, borderRadius: 10, padding: 10, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, justifyContent: 'center', backgroundColor: painel.card },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark, textTransform: 'capitalize' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  modulo: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 8 },
  licao: { borderTopWidth: 1, borderTopColor: '#EFEFEF', paddingVertical: 4, gap: 6 },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textOnLight },
  confirma: { backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12, gap: 8 },
  confirmaTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.warningShadow, lineHeight: 18 },
  botaoPequeno: { paddingHorizontal: 14, minHeight: 44 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: colors.error },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: '#2F6B12', backgroundColor: '#E2F3D3', borderRadius: 10, padding: 10 },
});
