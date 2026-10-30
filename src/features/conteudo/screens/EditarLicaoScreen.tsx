// src/features/conteudo/screens/EditarLicaoScreen.tsx
// Criar e editar uma lição COMPLETA: dados da lição + todos os passos (cartão, múltipla escolha,
// verdadeiro/falso, completar, ordene, associe, classifique, memória, prato, enquete, meta) e
// lição de hábito (prática real). A gravação é atômica (conteudo_salvar_licao): valida tudo
// antes e grava lição, passos e alternativas numa única transação. Só grava se algo mudou,
// para não subir a versão do conteúdo à toa.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { buscarLicaoEditavel, salvarLicaoCompleta, type LicaoEditavel } from '../services/edicaoService';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';
import PassoEditor from '../components/PassoEditor';
import BlocoPasso from '../components/BlocoPasso';
import PaletaBlocos from '../components/PaletaBlocos';
import PreviaAoVivo from '../components/preview/PreviaAoVivo';
import { BotaoComoCriar } from '../components/GuiaCriacao';
import { posicaoDeInsercao, selecaoAposMover, selecaoAposRemover } from '../utils/blocos';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  HABITOS,
  ICONES_SUGERIDOS,
  LIMITES,
  ROTULO_HABITO,
  ROTULO_TIPO_LICAO,
  assinaturaLicao,
  deQuestao,
  mover,
  novaChave,
  paraPayloadLicao,
  passoVazio,
  validarLicaoEdicao,
  validarPasso,
  type FormatoPasso,
  type LicaoEmEdicao,
  type PassoEdicao,
  type TipoLicaoEdicao,
} from '../utils/passosEdicao';

type Props = {
  config: ConfigPainel;
  route: { params?: { licaoId?: string; moduloId?: string; proximaOrdem?: number; origem?: string; tipoNovo?: TipoLicaoEdicao } };
};

const TIPOS: TipoLicaoEdicao[] = ['conteudo', 'quiz', 'atividade_rastreavel'];

function Chip({ texto, ligado, onPress }: { texto: string; ligado: boolean; onPress: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, ligado && styles.chipOn]}>
      <AppText style={[styles.chipTexto, ligado && { color: tema.botaoTexto }]}>{texto}</AppText>
    </Pressable>
  );
}

export default function EditarLicaoScreen({ config, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { licaoId, moduloId, proximaOrdem, origem, tipoNovo } = route.params ?? {};
  const criando = !licaoId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [licao, setLicao] = useState<LicaoEditavel | null>(null);
  const [tipo, setTipo] = useState<TipoLicaoEdicao>(tipoNovo ?? 'conteudo');
  const [titulo, setTitulo] = useState('');
  const [xp, setXp] = useState('10');
  const [icone, setIcone] = useState('');
  const [texto, setTexto] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [habito, setHabito] = useState<string>('alimentacao');
  const [janela, setJanela] = useState(String(LIMITES.janelaPadrao));
  const [passos, setPassos] = useState<PassoEdicao[]>([]);
  const [assinaturaInicial, setAssinaturaInicial] = useState<string | null>(criando ? null : '');
  const [mostrarErros, setMostrarErros] = useState(false);
  const [carregando, setCarregando] = useState(!criando);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  // editor em blocos: bloco aberto (e de onde a prévia ao vivo começa) + aba no layout estreito
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [aba, setAba] = useState<'editar' | 'previa'>('editar');
  const { width: larguraJanela } = useWindowDimensions();
  // com sidebar (248px) só sobra espaço para editor + celular lado a lado a partir de ~1280px
  const lado = larguraJanela >= 1280;

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const estado = useMemo<LicaoEmEdicao>(
    () => ({ tipo, titulo, xp, icone, texto, objetivo, habito, janelaHoras: janela, passos }),
    [tipo, titulo, xp, icone, texto, objetivo, habito, janela, passos]
  );

  const carregar = useCallback(async () => {
    if (!licaoId) return;
    try {
      const l = await buscarLicaoEditavel(licaoId);
      const inicial: LicaoEmEdicao = {
        tipo: (TIPOS as string[]).includes(l.tipo) ? (l.tipo as TipoLicaoEdicao) : 'conteudo',
        titulo: l.titulo,
        xp: String(l.xp),
        icone: l.icone ?? '',
        texto: typeof l.conteudo?.texto === 'string' ? l.conteudo.texto : '',
        objetivo: typeof l.conteudo?.objetivo === 'string' ? l.conteudo.objetivo : '',
        habito: l.tipoHabito ?? 'alimentacao',
        janelaHoras: String(l.janelaHoras ?? LIMITES.janelaPadrao),
        passos: l.questoes.map(deQuestao),
      };
      setLicao(l);
      setTipo(inicial.tipo);
      setTitulo(inicial.titulo);
      setXp(String(inicial.xp));
      setIcone(inicial.icone);
      setTexto(inicial.texto);
      setObjetivo(inicial.objetivo);
      setHabito(inicial.habito);
      setJanela(String(inicial.janelaHoras));
      setPassos(inicial.passos);
      setSelecionado(null);
      setAssinaturaInicial(assinaturaLicao(inicial));
      setMostrarErros(false);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a lição.');
    } finally {
      setCarregando(false);
    }
  }, [licaoId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const alterada = assinaturaInicial === null ? true : assinaturaInicial !== '' && assinaturaLicao(estado) !== assinaturaInicial;
  const errosLicao = useMemo(() => (mostrarErros ? validarLicaoEdicao(estado) : []), [mostrarErros, estado]);
  const errosPorPasso = useMemo(() => (mostrarErros ? passos.map(validarPasso) : passos.map(() => [])), [mostrarErros, passos]);
  const errosGerais = errosLicao.filter((e) => !/^Passo \d+:/.test(e));

  const incompletos = useMemo(() => passos.map((p) => validarPasso(p).length > 0), [passos]);

  function adicionarPasso(f: FormatoPasso) {
    if (passos.length >= LIMITES.passosMax) return;
    const pos = posicaoDeInsercao(passos.length, selecionado);
    setPassos((a) => [...a.slice(0, pos), passoVazio(f), ...a.slice(pos)]);
    setSelecionado(pos); // abre o bloco novo e a prévia já começa nele
  }

  function moverBloco(i: number, dir: -1 | 1) {
    setPassos((a) => mover(a, i, dir));
    setSelecionado((sel) => selecaoAposMover(sel, i, dir));
  }

  function duplicarBloco(i: number) {
    if (passos.length >= LIMITES.passosMax) return;
    const copia: PassoEdicao = { ...JSON.parse(JSON.stringify(passos[i])), chave: novaChave() };
    setPassos((a) => [...a.slice(0, i + 1), copia, ...a.slice(i + 1)]);
    setSelecionado(i + 1);
  }

  function removerBloco(i: number) {
    setPassos((a) => a.filter((_, k) => k !== i));
    setSelecionado((sel) => selecaoAposRemover(sel, i, passos.length - 1));
  }

  async function salvar() {
    setMsg(null);
    setErro(null);
    if (!criando && !alterada) {
      setMsg('Nada para salvar: nenhuma alteração.');
      return;
    }
    const problemas = validarLicaoEdicao(estado);
    if (problemas.length > 0) {
      setMostrarErros(true);
      setErro(problemas.length === 1 ? problemas[0] : `${problemas.length} problemas para corrigir antes de salvar (veja os avisos em vermelho).`);
      return;
    }
    if (criando && !moduloId) {
      setErro('Módulo não informado.');
      return;
    }
    setOcupado(true);
    try {
      const { licao: dadosLicao, passos: dadosPassos } = paraPayloadLicao(estado);
      await salvarLicaoCompleta({
        id: licao?.id,
        moduloId,
        ordem: criando ? proximaOrdem : undefined,
        licao: dadosLicao,
        passos: dadosPassos,
      });
      if (criando) {
        navigation.goBack();
        return;
      }
      await carregar();
      setMsg('Lição salva.');
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
    } finally {
      setOcupado(false);
    }
  }

  const habitoTipo = tipo === 'atividade_rastreavel';

  return (
    <PainelLayout
      config={config}
      titulo={criando ? `Nova lição · ${ROTULO_TIPO_LICAO[tipo]}` : 'Editar lição'}
      subtitulo={licao?.titulo}
      voltar
    >
      {carregando ? (
        <EstadoCarregando />
      ) : !criando && !licao ? (
        <EstadoErro mensagem={erro ?? 'Lição não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <View style={lado ? styles.linhaLarga : styles.coluna}>
          <View style={lado ? styles.colEditor : styles.coluna}>
            {!lado && (
              <View style={styles.abas} accessibilityRole="tablist">
                <Chip texto="Editar blocos" ligado={aba === 'editar'} onPress={() => setAba('editar')} />
                <Chip texto="Prévia ao vivo" ligado={aba === 'previa'} onPress={() => setAba('previa')} />
              </View>
            )}
            {!lado && aba === 'previa' && <PreviaAoVivo estado={estado} selecionado={selecionado} />}
            {(lado || aba === 'editar') && (
              <>
          <AvisoEdicao papel={papel} />
          <BotaoComoCriar passo={3} />

          {criando && (
            <CartaoSecao titulo="Tipo de lição" ajuda="Leitura: texto e passos. Quiz: só passos. Prática real: o adolescente registra um hábito (água, atividade física ou alimentação) e a lição conclui sozinha.">
              <View style={styles.chips}>
                {TIPOS.map((t) => (
                  <Chip key={t} texto={ROTULO_TIPO_LICAO[t]} ligado={tipo === t} onPress={() => { setTipo(t); if (t === 'atividade_rastreavel') { setPassos([]); setSelecionado(null); } }} />
                ))}
              </View>
            </CartaoSecao>
          )}

          <CartaoSecao titulo="Lição" ajuda="Título, ícone e XP aparecem para o adolescente. XP é a pontuação ganha ao concluir a lição.">
            <LabeledInput label="Título" value={titulo} onChangeText={setTitulo} maxLength={LIMITES.titulo} />
            <LabeledInput label="XP ao concluir" value={xp} onChangeText={(t) => setXp(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={3} />
            <View style={{ gap: 6 }}>
              <LabeledInput label="Ícone (opcional)" value={icone} onChangeText={setIcone} autoCapitalize="none" maxLength={40} placeholder="Ex.: leaf-outline" />
              <View style={styles.chips}>
                {ICONES_SUGERIDOS.map((i) => (
                  <Chip key={i} texto={i} ligado={icone === i} onPress={() => setIcone(i)} />
                ))}
              </View>
            </View>
            {(tipo === 'conteudo' || habitoTipo) && (
              <>
                <LabeledInput
                  label={habitoTipo ? 'Desafio do dia' : passos.length > 0 ? 'Texto de abertura (opcional)' : 'Texto da lição'}
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  style={campoMultilinha}
                  placeholder={habitoTipo ? 'Ex.: registre a água que você beber hoje.' : 'Escreva o conteúdo que o adolescente vai ler'}
                />
                <LabeledInput label="Objetivo (opcional)" value={objetivo} onChangeText={setObjetivo} multiline style={{ minHeight: 64, textAlignVertical: 'top' }} />
              </>
            )}
            {habitoTipo && (
              <>
                <View style={{ gap: 6 }}>
                  <AppText style={styles.rotulo}>Hábito a registrar</AppText>
                  <View style={styles.chips}>
                    {HABITOS.map((h) => (
                      <Chip key={h} texto={ROTULO_HABITO[h]} ligado={habito === h} onPress={() => setHabito(h)} />
                    ))}
                  </View>
                </View>
                <LabeledInput label="Janela de verificação (horas)" value={janela} onChangeText={(t) => setJanela(t.replace(/\D/g, ''))} keyboardType="numeric" maxLength={3} />
              </>
            )}
            {errosGerais.length > 0 && (
              <View style={styles.erros}>
                {errosGerais.map((e, i) => <AppText key={i} style={styles.erroTexto}>• {e}</AppText>)}
              </View>
            )}
          </CartaoSecao>

          {!habitoTipo && (
            <>
              <PaletaBlocos
                total={passos.length}
                max={LIMITES.passosMax}
                aposDoBloco={selecionado !== null && selecionado < passos.length ? selecionado + 1 : null}
                onAdicionar={adicionarPasso}
              />
              {passos.length === 0 && (
                <AppText style={styles.suave}>
                  {tipo === 'quiz' ? 'Um quiz precisa de pelo menos 1 bloco. Toque em um da paleta acima.' : 'Esta lição ainda não tem blocos. Adicione da paleta acima, ou use só o texto de leitura.'}
                </AppText>
              )}
              <View style={styles.pilha}>
                {passos.map((p, i) => (
                  <BlocoPasso
                    key={p.chave}
                    passo={p}
                    indice={i}
                    total={passos.length}
                    selecionado={selecionado === i}
                    incompleto={incompletos[i] ?? false}
                    erros={errosPorPasso[i] ?? []}
                    onSelecionar={() => setSelecionado(i)}
                    onMover={(dir) => moverBloco(i, dir)}
                    onDuplicar={() => duplicarBloco(i)}
                    onRemover={() => removerBloco(i)}
                  >
                    <PassoEditor
                      embutido
                      passo={p}
                      indice={i}
                      total={passos.length}
                      erros={errosPorPasso[i] ?? []}
                      onChange={(novo) => setPassos((a) => a.map((x, k) => (k === i ? novo : x)))}
                      onMover={() => {}}
                      onRemover={() => {}}
                    />
                  </BlocoPasso>
                ))}
              </View>
            </>
          )}

          {!criando && licao && (
            <View style={{ flexDirection: 'row' }}>
              <AppButton
                label="ABRIR REVISÃO (VERSÃO SALVA)"
                fullWidth={false}
                size="compact"
                outlineColor={tema.texto}
                textColor={tema.texto}
                style={{ paddingHorizontal: 14, minHeight: 44 }}
                onPress={() => navigation.navigate('LicaoPreview', { licaoId: licao.id, origem })}
              />
            </View>
          )}
          {!criando && alterada && <AppText style={styles.suave}>Há alterações não salvas. A prévia ao vivo já mostra tudo; a tela de revisão abre a versão salva.</AppText>}

              </>
            )}
            <BarraSalvar rotulo={criando ? 'CRIAR LIÇÃO' : 'SALVAR LIÇÃO'} ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
          </View>

          {lado && (
            <View style={styles.colPrevia}>
              <View style={Platform.OS === 'web' ? ({ position: 'sticky', top: 16 } as any) : undefined}>
                <PreviaAoVivo estado={estado} selecionado={selecionado} />
              </View>
            </View>
          )}
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
  abas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pilha: { gap: 10, paddingTop: 6 },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, justifyContent: 'center', backgroundColor: t.card },
  chipOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  erros: { backgroundColor: t.selos.erro.fundo + '55', borderRadius: 12, padding: 10, gap: 2 },
  erroTexto: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
}) as const;