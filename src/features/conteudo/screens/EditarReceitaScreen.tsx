// src/features/conteudo/screens/EditarReceitaScreen.tsx
// Criar e editar uma receita COMPLETA: prato produzido, dados (título, tempo, porções, dificuldade,
// foto, modo de preparo), ingredientes com quantidade (receita_ingredientes) e passo a passo.
// A gravação é atômica (conteudo_salvar_receita): valida tudo e grava receita + ingredientes +
// passos numa única transação. Só grava se algo mudou (para não subir a versão à toa).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import { buscarReceitaEditavel, listarAlimentosBusca, listarPratos, salvarReceitaCompleta, type ReceitaEditavel } from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';
import BlocoBase from '../components/BlocoBase';
import PreviaReceitaAoVivo from '../components/preview/PreviaReceitaAoVivo';
import { COR_RECEITA, ingredienteIncompleto, passoIncompleto, resumoDoPasso } from '../utils/blocosReceita';
import { posicaoDeInsercao, selecaoAposMover, selecaoAposRemover } from '../utils/blocos';
import {
  DIFICULDADES, LIMITES_RECEITA, assinaturaReceita, moverPasso, paraPayloadReceita, urlValida, validarReceita,
  type IngredienteEdicao, type PassoReceitaEdicao, type ReceitaEmEdicao,
} from '../utils/receitaEdicao';

type Props = { config: ConfigPainel; route: { params?: { receitaId?: string; origem?: string } } };
type Item = { id: string; nome: string };

function Chip({ texto, ligado, onPress }: { texto: string; ligado: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, ligado && styles.chipOn]}>
      <AppText style={[styles.chipTexto, ligado && { color: colors.white }]}>{texto}</AppText>
    </Pressable>
  );
}

/** Busca no catálogo e devolve o item escolhido. `somentePratos` limita a pratos compostos. */
function BuscaAlimento({ rotulo, somentePratos, onEscolher }: { rotulo: string; somentePratos?: boolean; onEscolher: (i: Item) => void }) {
  const [busca, setBusca] = useState('');
  const [lista, setLista] = useState<Item[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const t = setTimeout(() => {
      (somentePratos ? listarPratos(busca) : listarAlimentosBusca(busca))
        .then((l) => { if (ativo) { setLista(l); setErro(null); } })
        .catch((e) => { if (ativo) setErro(e?.message ?? 'Não foi possível buscar.'); });
    }, 250);
    return () => { ativo = false; clearTimeout(t); };
  }, [busca, somentePratos]);

  return (
    <View style={{ gap: 6 }}>
      <LabeledInput label={rotulo} value={busca} onChangeText={setBusca} placeholder="Digite para buscar" />
      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
      <View style={styles.chips}>
        {lista.map((i) => <Chip key={i.id} texto={i.nome} ligado={false} onPress={() => { onEscolher(i); setBusca(''); }} />)}
        {lista.length === 0 && !erro && <AppText style={styles.suave}>Nenhum resultado.</AppText>}
      </View>
    </View>
  );
}

export default function EditarReceitaScreen({ config, route }: Props) {
  const receitaId = route.params?.receitaId;
  const origem = route.params?.origem;
  const criando = !receitaId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [receita, setReceita] = useState<ReceitaEditavel | null>(null);
  const [prato, setPrato] = useState<Item | null>(null);
  const [titulo, setTitulo] = useState('');
  const [modo, setModo] = useState('');
  const [tempo, setTempo] = useState('');
  const [porcoes, setPorcoes] = useState('');
  const [dificuldade, setDificuldade] = useState<string>('FACIL');
  const [fotoUrl, setFotoUrl] = useState('');
  const [ingredientes, setIngredientes] = useState<IngredienteEdicao[]>([]);
  const [passos, setPassos] = useState<PassoReceitaEdicao[]>([]);
  const [assinaturaInicial, setAssinaturaInicial] = useState<string | null>(criando ? null : '');
  const [mostrarErros, setMostrarErros] = useState(false);
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // editor em blocos: passo aberto (a prévia ao vivo abre o passo a passo nele) + aba no layout estreito
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [aba, setAba] = useState<'editar' | 'previa'>('editar');
  const { width: larguraJanela } = useWindowDimensions();
  // com sidebar (248px) só sobra espaço para editor + celular lado a lado a partir de ~1280px
  const lado = larguraJanela >= 1280;

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const estado = useMemo<ReceitaEmEdicao>(
    () => ({ titulo, modo, tempo, porcoes, dificuldade, fotoUrl, ingredientes, passos }),
    [titulo, modo, tempo, porcoes, dificuldade, fotoUrl, ingredientes, passos]
  );

  const carregar = useCallback(async () => {
    if (!receitaId) return;
    try {
      const r = await buscarReceitaEditavel(receitaId);
      const inicial: ReceitaEmEdicao = {
        titulo: r.titulo,
        modo: r.modoPreparo,
        tempo: r.tempoPreparoMin != null ? String(r.tempoPreparoMin) : '',
        porcoes: r.porcoes != null ? String(r.porcoes) : '',
        dificuldade: r.dificuldade ?? 'FACIL',
        fotoUrl: r.fotoUrl ?? '',
        ingredientes: r.ingredientes.map((i) => ({ alimentoId: i.alimentoId, nome: i.nome, quantidade: i.quantidade })),
        passos: r.passos.map((p) => ({ titulo: p.titulo, descricao: p.descricao, fotoUrl: p.fotoUrl ?? '' })),
      };
      setReceita(r);
      setTitulo(inicial.titulo); setModo(inicial.modo); setTempo(inicial.tempo); setPorcoes(inicial.porcoes);
      setDificuldade(inicial.dificuldade); setFotoUrl(inicial.fotoUrl); setIngredientes(inicial.ingredientes); setPassos(inicial.passos);
      setAssinaturaInicial(assinaturaReceita(inicial));
      setMostrarErros(false);
      setSelecionado(null);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a receita.');
    } finally {
      setCarregando(false);
    }
  }, [receitaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const alterada = assinaturaInicial === null ? true : assinaturaInicial !== '' && assinaturaReceita(estado) !== assinaturaInicial;
  const problemas = useMemo(() => validarReceita(estado, { criando, pratoId: prato?.id }), [estado, criando, prato?.id]);

  async function salvar() {
    setMsg(null);
    setErro(null);
    if (!criando && !alterada) return setMsg('Nada para salvar: nenhuma alteração.');
    if (problemas.length > 0) {
      setMostrarErros(true);
      return setErro(problemas.length === 1 ? problemas[0] : `${problemas.length} problemas para corrigir antes de salvar (veja os avisos em vermelho).`);
    }
    setOcupado(true);
    try {
      const id = await salvarReceitaCompleta({ id: receita?.id, alimentoId: prato?.id, dados: paraPayloadReceita(estado) });
      if (criando) {
        navigation.replace('EditarReceita', { receitaId: id, origem });
        return;
      }
      await carregar();
      setMsg('Receita salva.');
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  const trocar = <T,>(lista: T[], i: number, patch: Partial<T>): T[] => lista.map((x, k) => (k === i ? { ...x, ...patch } : x));
  const tirar = <T,>(lista: T[], i: number): T[] => lista.filter((_, k) => k !== i);
  const mostrar = mostrarErros ? problemas : [];

  function adicionarPasso() {
    if (passos.length >= LIMITES_RECEITA.passos) return;
    const pos = posicaoDeInsercao(passos.length, selecionado);
    setPassos((a) => [...a.slice(0, pos), { titulo: '', descricao: '', fotoUrl: '' }, ...a.slice(pos)]);
    setSelecionado(pos); // abre o bloco novo e a prévia já mostra o passo
  }
  function moverBloco(i: number, dir: -1 | 1) {
    setPassos((a) => moverPasso(a, i, dir));
    setSelecionado((sel) => selecaoAposMover(sel, i, dir));
  }
  function duplicarBloco(i: number) {
    if (passos.length >= LIMITES_RECEITA.passos) return;
    setPassos((a) => [...a.slice(0, i + 1), { ...a[i] }, ...a.slice(i + 1)]);
    setSelecionado(i + 1);
  }
  function removerBloco(i: number) {
    setPassos((a) => tirar(a, i));
    setSelecionado((sel) => selecaoAposRemover(sel, i, passos.length - 1));
  }

  const previa = <PreviaReceitaAoVivo estado={estado} passoSelecionado={selecionado} />;

  return (
    <PainelLayout config={config} titulo={criando ? 'Nova receita' : 'Editar receita'} subtitulo={receita?.titulo} voltar>
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !receita ? (
        <EstadoErro mensagem={erro ?? 'Receita não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <View style={lado ? styles.linhaLarga : styles.coluna}>
          <View style={lado ? styles.colEditor : styles.coluna}>
            {!lado && (
              <View style={styles.chips} accessibilityRole="tablist">
                <Chip texto="Editar receita" ligado={aba === 'editar'} onPress={() => setAba('editar')} />
                <Chip texto="Prévia ao vivo" ligado={aba === 'previa'} onPress={() => setAba('previa')} />
              </View>
            )}
            {!lado && aba === 'previa' && previa}
            {(lado || aba === 'editar') && (
              <>
          <AvisoEdicao papel={papel} />

          <CartaoSecao titulo="Prato" ajuda="O prato do catálogo de alimentos que esta receita produz. Não muda depois de criada.">
            {criando ? (
              <>
                <AppText style={styles.rotulo}>{prato ? `Escolhido: ${prato.nome}` : 'Nenhum prato escolhido'}</AppText>
                <BuscaAlimento rotulo="Buscar prato composto" somentePratos onEscolher={setPrato} />
              </>
            ) : (
              <AppText style={styles.rotulo}>{receita?.alimentoResultanteNome || 'Prato do catálogo'}</AppText>
            )}
          </CartaoSecao>

          <CartaoSecao titulo="Dados da receita">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} maxLength={LIMITES_RECEITA.titulo.max} />
            <View style={styles.linha}>
              <View style={{ flex: 1, minWidth: 130 }}>
                <LabeledInput label="Tempo (minutos)" value={tempo} onChangeText={(t) => setTempo(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={4} />
              </View>
              <View style={{ flex: 1, minWidth: 130 }}>
                <LabeledInput label="Porções" value={porcoes} onChangeText={(t) => setPorcoes(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={2} />
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <AppText style={styles.rotulo}>Dificuldade</AppText>
              <View style={styles.chips}>
                {DIFICULDADES.map((d) => <Chip key={d.chave} texto={d.label} ligado={dificuldade === d.chave} onPress={() => setDificuldade(d.chave)} />)}
              </View>
            </View>
            <LabeledInput label="Foto (link da imagem, opcional)" value={fotoUrl} onChangeText={setFotoUrl} autoCapitalize="none" keyboardType="url" placeholder="https://..." />
            {urlValida(fotoUrl) && <Image source={{ uri: fotoUrl.trim() }} style={styles.foto} accessibilityLabel="Prévia da foto" />}
            <LabeledInput label="Modo de preparo (resumo)" value={modo} onChangeText={setModo} multiline style={campoMultilinha} maxLength={LIMITES_RECEITA.modo.max} />
          </CartaoSecao>

          <CartaoSecao titulo="Ingredientes" subtitulo={`${ingredientes.length} ingrediente(s)`} ajuda="Alimento do catálogo + quantidade em texto (ex.: 2 xícaras). Aparecem para o adolescente em ordem alfabética.">
            {ingredientes.map((i, k) => (
              <BlocoBase
                key={`${i.alimentoId}-${k}`}
                cor={COR_RECEITA.ingrediente}
                titulo={i.nome || 'Alimento'}
                incompleto={ingredienteIncompleto(i)}
                botoes={[{ rotulo: '✕', acessivel: 'Remover ingrediente', onPress: () => setIngredientes((a) => tirar(a, k)) }]}
              >
                <LabeledInput label="Quantidade" placeholder="ex.: 2 xícaras" value={i.quantidade} maxLength={LIMITES_RECEITA.quantidade} onChangeText={(t) => setIngredientes((a) => trocar(a, k, { quantidade: t }))} />
              </BlocoBase>
            ))}
            <BuscaAlimento
              rotulo="Adicionar ingrediente"
              onEscolher={(a) => setIngredientes((l) => (l.some((x) => x.alimentoId === a.id) ? l : [...l, { alimentoId: a.id, nome: a.nome, quantidade: '' }]))}
            />
          </CartaoSecao>

          <CartaoSecao titulo="Passo a passo" subtitulo={`${passos.length} passo(s)`} ajuda="Cada passo tem título, descrição e, se quiser, o link de uma foto.">
            {passos.map((p, k) => (
              <BlocoBase
                key={k}
                cor={COR_RECEITA.passo}
                titulo={`Passo ${k + 1}`}
                resumo={resumoDoPasso(p)}
                recolhivel
                selecionado={selecionado === k}
                incompleto={passoIncompleto(p)}
                onSelecionar={() => setSelecionado(k)}
                botoes={[
                  { rotulo: '↑', acessivel: 'Subir passo', desativado: k === 0, onPress: () => moverBloco(k, -1) },
                  { rotulo: '↓', acessivel: 'Descer passo', desativado: k === passos.length - 1, onPress: () => moverBloco(k, 1) },
                  { rotulo: '⧉', acessivel: 'Duplicar passo', onPress: () => duplicarBloco(k) },
                  { rotulo: '✕', acessivel: 'Remover passo', onPress: () => removerBloco(k) },
                ]}
              >
                <LabeledInput label="Título" value={p.titulo} maxLength={LIMITES_RECEITA.passoTitulo} onChangeText={(t) => setPassos((a) => trocar(a, k, { titulo: t }))} />
                <LabeledInput label="Descrição" value={p.descricao} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} maxLength={LIMITES_RECEITA.passoDescricao} onChangeText={(t) => setPassos((a) => trocar(a, k, { descricao: t }))} />
                <LabeledInput label="Foto do passo (link, opcional)" value={p.fotoUrl} autoCapitalize="none" keyboardType="url" onChangeText={(t) => setPassos((a) => trocar(a, k, { fotoUrl: t }))} />
              </BlocoBase>
            ))}
            <View style={{ flexDirection: 'row' }}>
              <Pressable
                disabled={passos.length >= LIMITES_RECEITA.passos}
                onPress={adicionarPasso}
                accessibilityRole="button"
                accessibilityLabel="Adicionar passo"
                style={({ pressed }) => [styles.peca, pressed && { marginTop: 2, borderBottomWidth: 2 }, passos.length >= LIMITES_RECEITA.passos && { opacity: 0.4 }]}
              >
                <AppText style={styles.pecaTexto}>
                  {selecionado !== null && selecionado < passos.length ? `+ PASSO (depois do ${selecionado + 1})` : '+ PASSO'}
                </AppText>
              </Pressable>
            </View>
          </CartaoSecao>

          {mostrar.length > 0 && (
            <View style={styles.erros}>
              {mostrar.map((e, i) => <AppText key={i} style={styles.erroTexto}>• {e}</AppText>)}
            </View>
          )}
          {!criando && receita && (
            <View style={{ flexDirection: 'row' }}>
              <AppButton label="ABRIR REVISÃO (VERSÃO SALVA)" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={styles.botaoPequeno} onPress={() => navigation.navigate('ReceitaPreview', { receitaId: receita.id, origem })} />
            </View>
          )}
          {!criando && alterada && <AppText style={styles.suave}>Há alterações não salvas. A prévia ao vivo já mostra tudo; a tela de revisão abre a versão salva.</AppText>}

              </>
            )}
            <BarraSalvar rotulo={criando ? 'CRIAR RECEITA' : 'SALVAR RECEITA'} ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
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
  peca: { minHeight: 44, paddingHorizontal: 16, borderRadius: 12, borderWidth: 2, borderBottomWidth: 5, justifyContent: 'center', backgroundColor: COR_RECEITA.passo.fundo, borderColor: COR_RECEITA.passo.borda },
  pecaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  rotulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
  suave: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave, lineHeight: 17 },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, justifyContent: 'center', backgroundColor: painel.card },
  chipOn: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  linha: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  passo: { borderWidth: 2, borderColor: painel.cardBorda, borderRadius: 14, padding: 12, gap: 8 },
  foto: { width: '100%', maxWidth: 320, height: 180, borderRadius: 12, backgroundColor: '#EFEFEF' },
  botaoPequeno: { paddingHorizontal: 14, minHeight: 44 },
  erros: { backgroundColor: colors.exercicioErroSuave + '55', borderRadius: 12, padding: 10, gap: 2 },
  erroTexto: { fontFamily: typography.regular, fontSize: 12, color: colors.error },
});
