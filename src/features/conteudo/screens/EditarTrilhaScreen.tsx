// src/features/conteudo/screens/EditarTrilhaScreen.tsx
// Criar uma trilha ou editar tudo nela: título, descrição, tema, ordem e XP bônus; organizar os
// módulos e as lições (criar, renomear, reordenar, excluir) e abrir cada lição para editar.
// Reordenar e excluir são atômicos no banco (migration_trilha_estrutura.sql); excluir é bloqueado
// se adolescentes já concluíram a lição. O status (rascunho/revisão/publicado) NÃO muda aqui.
//
// UX: etapas visíveis (Dados → Módulos → Lições → Revisão), campos do painel (seguem o tema),
// avisos ao lado da ação que os gerou (dados da trilha x estrutura) e lições com ícone e nome do
// tipo. Logo depois de criar, a tela avisa o próximo passo (adicionar o primeiro módulo).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { AbasPainel } from '../../../shared/painel/components/AbasPainel';
import { Selo } from '../../../shared/painel/components/ControlesLista';
import { AvisoPainel, CampoTexto, EtapasCadastro, OpcoesUnica, RotuloCampo, type TomAviso } from '../../../shared/painel/components/Formulario';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  TrilhaEditavel, TrilhaOrdemLinha, buscarTrilhaEditavel, criarModulo, criarTrilha, excluirItem, listarTemas,
  listarTrilhasOrdem, reordenarItens, salvarModulo, salvarTrilha,
} from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao } from '../components/CamposEdicao';
import PreviaTrilhaAoVivo from '../components/preview/PreviaTrilhaAoVivo';
import { BotaoComoCriar } from '../components/GuiaCriacao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  XP_BONUS_PADRAO_MODULO, XP_BONUS_PADRAO_TRILHA, avisoOrdemTrilha, etapaAtualTrilha, idsAposMover, lerXpBonus, posicaoNoCaminho,
  proximaOrdemTrilha, rotuloTema, rotuloTipoLicao, textoConfirmaExclusao, textoPosicaoNoCaminho, validarModulo, validarTrilha,
} from '../utils/trilhaEdicao';

type Props = { config: ConfigPainel; route: { params?: { trilhaId?: string; origem?: string; criada?: boolean } } };
type Exclusao = { nivel: 'MODULO' | 'LICAO'; id: string; titulo: string; qtdLicoes: number };
type Aviso = { tom: TomAviso; texto: string; onde: 'dados' | 'estrutura' };
type Icone = React.ComponentProps<typeof Ionicons>['name'];

const ICONE_TIPO: Record<string, Icone> = { conteudo: 'book-outline', quiz: 'help-circle-outline', atividade_rastreavel: 'walk-outline' };
const NOVAS_LICOES: { tipo: 'conteudo' | 'quiz' | 'atividade_rastreavel'; rotulo: string; icone: Icone }[] = [
  { tipo: 'conteudo', rotulo: 'Leitura', icone: 'book-outline' },
  { tipo: 'quiz', rotulo: 'Quiz', icone: 'help-circle-outline' },
  { tipo: 'atividade_rastreavel', rotulo: 'Prática real', icone: 'walk-outline' },
];

const txtXp = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));

function BotaoIcone({ icone, rotulo, onPress, desativado, perigo }: { icone: Icone; rotulo: string; onPress: () => void; desativado?: boolean; perigo?: boolean }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !!desativado }}
      style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.botaoIcone, hovered && !desativado && { backgroundColor: tema.superficieSuave }, desativado && { opacity: 0.35 }]}
    >
      <Ionicons name={icone} size={18} color={perigo ? tema.erro : tema.texto} />
    </Pressable>
  );
}

export default function EditarTrilhaScreen({ config, route }: Props) {
  const { tema: cores } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
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
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(
    route.params?.criada ? { tom: 'ok', texto: 'Trilha criada como rascunho. Agora adicione o primeiro módulo.', onde: 'estrutura' } : null
  );
  // prévia ao vivo: ao lado do editor em telas largas; numa aba nas estreitas
  const [aba, setAba] = useState<'editar' | 'previa'>('editar');
  const { width: larguraJanela } = useWindowDimensions();
  const lado = larguraJanela >= 1280;

  useEffect(() => {
    obterPapelAtual().then(setPapel);
    listarTemas()
      .then((t) => { setTemas(t); if (criando && t[0]) setTema((atual) => atual || t[0]); })
      .catch((e) => setAviso({ tom: 'erro', texto: e?.message ?? '', onde: 'dados' }));
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
      setErroCarga(null);
    } catch (e: any) {
      setErroCarga(e?.message ?? 'Não foi possível abrir a trilha.');
    } finally {
      setCarregando(false);
    }
  }, [trilhaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function executar(fn: () => Promise<void>, sucesso: string, onde: Aviso['onde']) {
    setOcupado(true);
    setAviso(null);
    try {
      await fn();
      setAviso({ tom: 'ok', texto: sucesso, onde });
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '', onde });
    } finally {
      setOcupado(false);
    }
  }

  const problemasDados = validarTrilha({ titulo, descricao, tema, ordem, xpBonus });

  async function salvar() {
    setAviso(null);
    setTentouSalvar(true);
    if (problemasDados.length > 0) return setAviso({ tom: 'aviso', texto: problemasDados[0], onde: 'dados' });
    const xp = lerXpBonus(xpBonus);
    if (criando) {
      setOcupado(true);
      try {
        const id = await criarTrilha({ titulo, descricao, tema, ordem: Number(ordem), xpBonus: xp });
        navigation.replace('EditarTrilha', { trilhaId: id, origem, criada: true });
      } catch (e: any) {
        setAviso({ tom: 'erro', texto: e?.message ?? '', onde: 'dados' });
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
    if (Object.keys(mudou).length === 0) return setAviso({ tom: 'info', texto: 'Nada para salvar: nenhuma alteração.', onde: 'dados' });
    await executar(async () => { await salvarTrilha(trilha.id, mudou); await carregar(); setTrilhasOrdem(await listarTrilhasOrdem()); }, 'Dados da trilha salvos.', 'dados');
  }

  async function adicionarModulo() {
    if (!trilha) return;
    const problemas = validarModulo({ titulo: novoModulo, xpBonus: '' });
    if (problemas.length > 0) return setAviso({ tom: 'aviso', texto: problemas[0], onde: 'estrutura' });
    const proxima = (trilha.modulos.reduce((m, x) => Math.max(m, x.ordem), 0) || 0) + 1;
    const nome = novoModulo.trim();
    await executar(async () => { await criarModulo(trilha.id, novoModulo, proxima); setNovoModulo(''); await carregar(); }, `Módulo "${nome}" adicionado. Agora crie as lições dele.`, 'estrutura');
  }

  async function salvarDadosModulo(id: string) {
    const original = trilha?.modulos.find((m) => m.id === id);
    if (!original) return;
    const novoTitulo = nomesModulo[id] ?? original.titulo;
    const novoXp = xpModulo[id] ?? '';
    const problemas = validarModulo({ titulo: novoTitulo, xpBonus: novoXp });
    if (problemas.length > 0) return setAviso({ tom: 'aviso', texto: problemas[0], onde: 'estrutura' });
    const mudou: Parameters<typeof salvarModulo>[1] = {};
    if (novoTitulo.trim() !== original.titulo) mudou.titulo = novoTitulo;
    if (lerXpBonus(novoXp) !== original.xpBonus) mudou.xpBonus = lerXpBonus(novoXp);
    if (Object.keys(mudou).length === 0) return;
    await executar(async () => { await salvarModulo(id, mudou); await carregar(); }, 'Módulo salvo.', 'estrutura');
  }

  async function moverItem(nivel: 'MODULO' | 'LICAO', paiId: string, ids: string[], i: number, dir: -1 | 1) {
    const novos = idsAposMover(ids, i, dir);
    if (novos === ids) return;
    await executar(async () => { await reordenarItens(nivel, paiId, novos); await carregar(); }, 'Ordem atualizada.', 'estrutura');
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    const alvo = excluindo;
    setExcluindo(null);
    await executar(async () => { await excluirItem(alvo.nivel, alvo.id); await carregar(); }, alvo.nivel === 'MODULO' ? 'Módulo excluído.' : 'Lição excluída.', 'estrutura');
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
  const etapa = etapaAtualTrilha(criando ? null : trilha);
  const totalLicoes = trilha?.modulos.reduce((n, m) => n + m.licoes.length, 0) ?? 0;
  const dadosSujos =
    !!trilha &&
    (titulo.trim() !== trilha.titulo || descricao.trim() !== (trilha.descricao ?? '') || tema !== trilha.tema || Number(ordem) !== trilha.ordem || lerXpBonus(xpBonus) !== trilha.xpBonus);

  const previa = (
    <PreviaTrilhaAoVivo
      titulo={titulo}
      modulos={modulosRascunho}
      numero={posicao.posicao}
      total={posicao.total}
      onPressNo={(licaoId) => navigation.navigate('LicaoPreview', { licaoId, origem })}
    />
  );

  const avisoEm = (onde: Aviso['onde']) =>
    aviso && aviso.onde === onde ? <AvisoPainel tom={aviso.tom} texto={aviso.texto} onFechar={() => setAviso(null)} /> : null;

  function CaixaExclusao({ alvo }: { alvo: Exclusao }) {
    if (!excluindo || excluindo.id !== alvo.id) return null;
    return (
      <View style={styles.confirma}>
        <Ionicons name="warning" size={18} color={cores.alertaTexto} />
        <View style={{ flex: 1, gap: 8 }}>
          <AppText style={styles.confirmaTexto}>{textoConfirmaExclusao(alvo.nivel, alvo.titulo, alvo.qtdLicoes)}</AppText>
          <View style={styles.linhaBotoes}>
            <AppButton label="SIM, EXCLUIR" fullWidth={false} size="compact" outlineColor={cores.erro} textColor={cores.erro} disabled={ocupado} style={styles.botaoPequeno} onPress={confirmarExclusao} />
            <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={cores.texto} textColor={cores.texto} style={styles.botaoPequeno} onPress={() => setExcluindo(null)} />
          </View>
        </View>
      </View>
    );
  }

  const cartaoDados = (
    <CartaoSecao titulo="1. Dados da trilha" subtitulo="O que os adolescentes veem no caminho" ajuda="Título e descrição aparecem para os adolescentes quando a trilha é publicada.">
      <CampoTexto
        rotulo="Título"
        obrigatorio
        value={titulo}
        onChangeText={setTitulo}
        placeholder="Ex.: Alimentação no dia a dia"
        maxLength={120}
        erro={tentouSalvar && titulo.trim().length < 3 ? 'Dê um título com pelo menos 3 letras.' : null}
        ajuda={`${titulo.length}/120`}
      />
      <CampoTexto rotulo="Descrição" value={descricao} onChangeText={setDescricao} placeholder="Resumo curto: o que o adolescente vai descobrir?" multilinha maxLength={500} ajuda={`${descricao.length}/500`} />
      <View style={{ gap: 8 }}>
        <RotuloCampo texto="Tema" obrigatorio />
        {temas.length === 0 ? (
          <AppText style={styles.suave}>Carregando temas…</AppText>
        ) : (
          <OpcoesUnica rotulo="Tema da trilha" opcoes={temas.map((t) => ({ valor: t, rotulo: rotuloTema(t) }))} valor={tema} onChange={(v) => v && setTema(v)} />
        )}
      </View>
      <View style={styles.grade}>
        <View style={styles.campoMetade}>
          <CampoTexto rotulo="Ordem no caminho" value={ordem} onChangeText={(t) => setOrdem(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={3} ajuda="1 aparece primeiro." />
        </View>
        <View style={styles.campoMetade}>
          <CampoTexto rotulo="XP bônus ao concluir" value={xpBonus} onChangeText={(t) => setXpBonus(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={4} placeholder={String(XP_BONUS_PADRAO_TRILHA)} ajuda={`Vazio = ${XP_BONUS_PADRAO_TRILHA} XP (padrão).`} />
        </View>
      </View>
      <AvisoPainel tom="info" texto={textoPosicaoNoCaminho(posicao, publicada)} />
      {!!avisoOrdem && <AvisoPainel tom="aviso" texto={avisoOrdem} />}
      {avisoEm('dados')}
      <View style={styles.rodapeCartao}>
        {!criando && trilha && (
          <AppButton label="PRÉ-VISUALIZAR" fullWidth={false} size="compact" outlineColor={cores.texto} textColor={cores.texto} style={styles.botaoPequeno} onPress={() => navigation.navigate('TrilhaPreview', { trilhaId: trilha.id, origem })} />
        )}
        <View style={{ flex: 1 }} />
        {criando && <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={cores.texto} textColor={cores.texto} disabled={ocupado} style={styles.botaoPequeno} onPress={() => navigation.goBack()} />}
        <AppButton
          label={ocupado && !trilha ? 'CRIANDO…' : criando ? 'CRIAR TRILHA E CONTINUAR' : 'SALVAR DADOS'}
          fullWidth={false}
          size="compact"
          backgroundColor={cores.botaoFundo}
          textColor={cores.botaoTexto}
          shadowColor={cores.botaoSombra}
          disabled={ocupado || (!criando && !dadosSujos)}
          style={styles.botaoPequeno}
          onPress={salvar}
        />
      </View>
    </CartaoSecao>
  );

  const cartaoEstrutura = !criando && trilha && (
    <CartaoSecao
      titulo="2. Módulos e lições"
      subtitulo={`${trilha.modulos.length} módulo${trilha.modulos.length === 1 ? '' : 's'} · ${totalLicoes} lição${totalLicoes === 1 ? '' : 'ões'}`}
      ajuda="Cada módulo agrupa lições. Use as setas para mudar a ordem; excluir remove também os passos e não é possível se adolescentes já concluíram a lição."
    >
      {avisoEm('estrutura')}

      {trilha.modulos.length === 0 && (
        <View style={styles.vazio}>
          <Ionicons name="albums-outline" size={24} color={cores.textoSuave} />
          <AppText style={styles.vazioTexto}>Esta trilha ainda não tem módulos. Módulos são os capítulos da trilha: dois ou três costumam bastar.</AppText>
        </View>
      )}

      {trilha.modulos.map((m, mi) => {
        const idsModulos = trilha.modulos.map((x) => x.id);
        const idsLicoes = m.licoes.map((x) => x.id);
        const alvoModulo: Exclusao = { nivel: 'MODULO', id: m.id, titulo: m.titulo, qtdLicoes: m.licoes.length };
        const sujo = (nomesModulo[m.id] ?? m.titulo).trim() !== m.titulo || lerXpBonus(xpModulo[m.id] ?? '') !== m.xpBonus;
        const proximaOrdem = (m.licoes.reduce((x, l) => Math.max(x, l.ordem), 0) || 0) + 1;
        return (
          <View key={m.id} style={styles.modulo}>
            <View style={styles.moduloTopo}>
              <View style={styles.moduloNumero}>
                <AppText style={styles.moduloNumeroTexto}>{mi + 1}</AppText>
              </View>
              <TextInput
                value={nomesModulo[m.id] ?? m.titulo}
                onChangeText={(t) => setNomesModulo((a) => ({ ...a, [m.id]: t }))}
                maxLength={120}
                style={styles.moduloNome}
                placeholderTextColor={cores.placeholder}
                placeholder="Nome do módulo"
                accessibilityLabel={`Nome do módulo ${mi + 1}`}
              />
              <View style={styles.xpBox}>
                <TextInput
                  value={xpModulo[m.id] ?? ''}
                  onChangeText={(t) => setXpModulo((a) => ({ ...a, [m.id]: t.replace(/\D/g, '') }))}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder={String(XP_BONUS_PADRAO_MODULO)}
                  placeholderTextColor={cores.placeholder}
                  style={styles.xpInput}
                  accessibilityLabel={`XP bônus do módulo ${mi + 1} (vazio = ${XP_BONUS_PADRAO_MODULO})`}
                />
                <AppText style={styles.xpRotulo}>XP</AppText>
              </View>
              <BotaoIcone icone="arrow-up" rotulo="Mover módulo para cima" desativado={ocupado || mi === 0} onPress={() => moverItem('MODULO', trilha.id, idsModulos, mi, -1)} />
              <BotaoIcone icone="arrow-down" rotulo="Mover módulo para baixo" desativado={ocupado || mi === trilha.modulos.length - 1} onPress={() => moverItem('MODULO', trilha.id, idsModulos, mi, 1)} />
              <BotaoIcone icone="trash-outline" rotulo={`Excluir módulo ${m.titulo}`} perigo desativado={ocupado} onPress={() => setExcluindo(alvoModulo)} />
            </View>
            {sujo && (
              <View style={styles.linhaBotoes}>
                <AppText style={styles.pendente}>Nome ou XP alterado</AppText>
                <AppButton label="SALVAR MÓDULO" fullWidth={false} size="compact" backgroundColor={cores.botaoFundo} textColor={cores.botaoTexto} shadowColor={cores.botaoSombra} disabled={ocupado} style={styles.botaoPequeno} onPress={() => salvarDadosModulo(m.id)} />
              </View>
            )}
            <CaixaExclusao alvo={alvoModulo} />

            <View style={styles.licoes}>
              {m.licoes.length === 0 && <AppText style={styles.suave}>Nenhuma lição neste módulo ainda. Escolha o tipo abaixo.</AppText>}
              {m.licoes.map((l, li) => {
                const alvoLicao: Exclusao = { nivel: 'LICAO', id: l.id, titulo: l.titulo, qtdLicoes: 0 };
                return (
                  <View key={l.id}>
                    <View style={styles.licao}>
                      <Pressable
                        onPress={() => navigation.navigate('EditarLicao', { licaoId: l.id, origem })}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar lição ${l.ordem}: ${l.titulo}, ${rotuloTipoLicao(l.tipo)}`}
                        style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.licaoCorpo, hovered && { backgroundColor: cores.superficieSuave }]}
                      >
                        <View style={styles.licaoIcone}>
                          <Ionicons name={ICONE_TIPO[l.tipo] ?? 'document-outline'} size={18} color={cores.destaqueTexto} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                          <AppText style={styles.licaoTitulo} numberOfLines={2}>{l.ordem}. {l.titulo}</AppText>
                          <View style={styles.linhaSelos}>
                            <Selo texto={rotuloTipoLicao(l.tipo)} tom="info" />
                            <Selo texto={`${l.xp} XP`} tom="neutro" />
                            {l.passos > 0 && <Selo texto={`${l.passos} passo${l.passos === 1 ? '' : 's'}`} tom="neutro" />}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={cores.textoSuave} />
                      </Pressable>
                      <BotaoIcone icone="arrow-up" rotulo="Mover lição para cima" desativado={ocupado || li === 0} onPress={() => moverItem('LICAO', m.id, idsLicoes, li, -1)} />
                      <BotaoIcone icone="arrow-down" rotulo="Mover lição para baixo" desativado={ocupado || li === m.licoes.length - 1} onPress={() => moverItem('LICAO', m.id, idsLicoes, li, 1)} />
                      <BotaoIcone icone="trash-outline" rotulo={`Excluir lição ${l.titulo}`} perigo desativado={ocupado} onPress={() => setExcluindo(alvoLicao)} />
                    </View>
                    <CaixaExclusao alvo={alvoLicao} />
                  </View>
                );
              })}
            </View>

            <View style={styles.novaLicao}>
              <AppText style={styles.novaLicaoRotulo}>Nova lição:</AppText>
              {NOVAS_LICOES.map((n) => (
                <Pressable
                  key={n.tipo}
                  onPress={() => navigation.navigate('EditarLicao', { moduloId: m.id, origem, tipoNovo: n.tipo, proximaOrdem })}
                  accessibilityRole="button"
                  accessibilityLabel={`Criar lição de ${n.rotulo} no módulo ${m.titulo}`}
                  style={styles.novaLicaoBotao}
                >
                  <Ionicons name={n.icone} size={16} color={cores.destaqueTexto} />
                  <AppText style={styles.novaLicaoTexto}>+ {n.rotulo}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.novoModulo}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <CampoTexto
            rotulo={trilha.modulos.length === 0 ? 'Primeiro módulo' : 'Novo módulo'}
            value={novoModulo}
            onChangeText={setNovoModulo}
            placeholder="Ex.: Por que beber água"
            maxLength={120}
            onSubmitEditing={adicionarModulo}
            returnKeyType="done"
          />
        </View>
        <AppButton label="+ ADICIONAR MÓDULO" fullWidth={false} size="compact" backgroundColor={cores.botaoFundo} textColor={cores.botaoTexto} shadowColor={cores.botaoSombra} disabled={ocupado || novoModulo.trim().length === 0} style={styles.botaoPequeno} onPress={adicionarModulo} />
      </View>
    </CartaoSecao>
  );

  const cartaoRevisao = !criando && trilha && (
    <CartaoSecao titulo="3. Enviar para revisão" subtitulo="Quando a estrutura estiver pronta">
      <AppText style={styles.suave}>
        {papel === 'NUTRICIONISTA'
          ? 'Na página do conteúdo você aprova e publica a trilha. Depois de publicada, ela entra no caminho dos adolescentes em sequência.'
          : 'Na página do conteúdo você envia a trilha para a nutricionista revisar. Ela aprova e publica.'}
      </AppText>
      <View style={styles.rodapeCartao}>
        <AppButton
          label="ABRIR PÁGINA DO CONTEÚDO"
          fullWidth={false}
          size="compact"
          outlineColor={cores.texto}
          textColor={cores.texto}
          style={styles.botaoPequeno}
          onPress={() => navigation.navigate('ConteudoDetalhe', { tipo: 'TRILHA', conteudoId: trilha.id, origem })}
        />
        {etapa !== 'revisao' && <AppText style={styles.suave}>Antes de enviar, crie pelo menos um módulo, com uma lição em cada.</AppText>}
      </View>
    </CartaoSecao>
  );

  return (
    <PainelLayout
      config={config}
      titulo={criando ? 'Nova trilha' : 'Editar trilha'}
      subtitulo={criando ? 'A trilha nasce como rascunho' : trilha?.titulo}
      voltar
      acao={<BotaoComoCriar passo={etapa === 'dados' ? 0 : etapa === 'modulos' ? 1 : etapa === 'licoes' ? 2 : 5} />}
    >
      {carregando ? (
        <EstadoCarregando texto="Abrindo a trilha…" />
      ) : !criando && !trilha ? (
        <EstadoErro mensagem={erroCarga ?? 'Trilha não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <View style={{ gap: 16 }}>
          <EtapasCadastro
            atual={etapa}
            etapas={[
              { chave: 'dados', rotulo: 'Dados', feita: !criando },
              { chave: 'modulos', rotulo: 'Módulos', feita: !!trilha && trilha.modulos.length > 0 },
              { chave: 'licoes', rotulo: 'Lições', feita: etapa === 'revisao' },
              { chave: 'revisao', rotulo: 'Revisão', feita: false },
            ]}
          />
          {!lado && (
            <AbasPainel
              abas={[{ chave: 'editar', label: 'Editar', icone: 'create-outline' }, { chave: 'previa', label: 'Prévia ao vivo', icone: 'phone-portrait-outline' }]}
              ativa={aba}
              onChange={setAba}
            />
          )}
          <View style={lado ? styles.linhaLarga : styles.coluna}>
            <View style={lado ? styles.colEditor : styles.coluna}>
              {!lado && aba === 'previa' && previa}
              {(lado || aba === 'editar') && (
                <>
                  <IntroSecao
                    chave="editar_trilha"
                    titulo="Criar e editar trilhas"
                    linhas={[
                      'Trilha → módulos → lições. Aqui você muda título, descrição, tema, ordem e XP bônus, organiza os módulos e as lições (criar, renomear, reordenar, excluir) e abre cada lição para editar o texto e os passos.',
                      'Conteúdo novo nasce como rascunho. Depois de montar, abra a página do conteúdo para enviar para revisão (ou aprovar e publicar, se você for nutricionista).',
                    ]}
                  />
                  {!criando && <AvisoEdicao papel={papel} />}
                  {cartaoDados}
                  {cartaoEstrutura}
                  {cartaoRevisao}
                </>
              )}
            </View>

            {lado && (
              <View style={styles.colPrevia}>
                <View style={Platform.OS === 'web' ? ({ position: 'sticky', top: 16 } as any) : undefined}>{previa}</View>
              </View>
            )}
          </View>
        </View>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  coluna: { gap: 16 },
  linhaLarga: { flexDirection: 'row', gap: 24 },
  colEditor: { flex: 1, minWidth: 0, gap: 16 },
  colPrevia: { width: 420 },
  suave: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, lineHeight: 17, flexShrink: 1 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  campoMetade: { flex: 1, minWidth: 180 },
  rodapeCartao: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  vazio: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: t.borda, borderStyle: 'dashed', borderColor: t.chipBorda },
  vazioTexto: { flex: 1, fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoSuave, lineHeight: 19 },

  modulo: { borderWidth: t.borda, borderColor: t.cardBorda, borderRadius: 14, padding: 12, gap: 10, backgroundColor: t.card },
  moduloTopo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  moduloNumero: { width: 32, height: 32, borderRadius: 10, backgroundColor: t.chipAtivoFundo, alignItems: 'center', justifyContent: 'center' },
  moduloNumeroTexto: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.chipAtivoTexto },
  moduloNome: {
    flex: 1, minWidth: 160, minHeight: ALVO_TOQUE, paddingHorizontal: 10, borderRadius: 10, borderWidth: t.borda, borderColor: t.campoBorda,
    fontFamily: typography.bold, fontSize: fonte.corpo, color: t.texto, backgroundColor: t.card,
  },
  xpBox: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingRight: 10, borderRadius: 10, borderWidth: t.borda, borderColor: t.campoBorda, backgroundColor: t.card },
  xpInput: { width: 52, minHeight: ALVO_TOQUE, textAlign: 'right', fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.textoCorpo },
  xpRotulo: { fontFamily: typography.bold, fontSize: fonte.selo, color: t.textoSuave },
  pendente: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.alertaTexto },
  licoes: { gap: 6, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: t.linhaSuave, marginLeft: 15 },
  licao: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  licaoCorpo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  licaoIcone: { width: 34, height: 34, borderRadius: 10, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  licaoTitulo: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.textoCorpo },
  linhaSelos: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  botaoIcone: { width: ALVO_TOQUE, height: ALVO_TOQUE, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  novaLicao: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingTop: 4 },
  novaLicaoRotulo: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.textoSuave, marginRight: 2 },
  novaLicaoBotao: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: ALVO_TOQUE, paddingHorizontal: 12, borderRadius: 22,
    borderWidth: t.borda, borderStyle: 'dashed', borderColor: t.destaqueTexto, backgroundColor: t.card,
  },
  novaLicaoTexto: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.destaqueTexto },
  novoModulo: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10, paddingTop: 4 },
  confirma: { flexDirection: 'row', gap: 10, backgroundColor: t.alertaSuave, borderRadius: 12, padding: 12 },
  confirmaTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.selos.aviso.texto, lineHeight: 18 },
  botaoPequeno: { paddingHorizontal: 14, minHeight: ALVO_TOQUE },
}) as const;
