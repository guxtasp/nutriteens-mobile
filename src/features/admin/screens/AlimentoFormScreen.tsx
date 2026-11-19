// src/features/admin/screens/AlimentoFormScreen.tsx
// Cadastro/edição de um alimento ou prato do catálogo (Administração e Nutricionista).
//
// Decisões de UX:
//  - Etapas visíveis para prato (Dados → Ingredientes → Receita): antes era preciso salvar, ler
//    um alerta e rolar até achar os ingredientes.
//  - Depois de criar, a tela passa a EDITAR o item salvo (antes, salvar de novo criava um
//    prato duplicado, porque a tela continuava em modo "novo").
//  - Validação no próprio campo + lista do que falta na barra fixa de ações; resultado das
//    operações em faixa na tela (sem alertas que somem) e "Cadastrar outro" para lotes.
//  - Sair com alterações não salvas pede confirmação.
//  - Níveis de nutrientes: só a nutricionista edita. O service grava sempre a fonte
//    REVISADO_NUTRICIONISTA; quando o administrador editava, o dado ficava marcado como
//    revisado sem ter sido (regra 6 do AGENTS.md). O administrador vê os níveis só para leitura.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { confirmar } from '../../../shared/ui/dialogo';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { Selo, type TomSelo } from '../../../shared/painel/components/ControlesLista';
import {
  AvisoPainel, CampoTexto, EtapasCadastro, OpcoesMultipla, OpcoesUnica, RotuloCampo, type TomAviso,
} from '../../../shared/painel/components/Formulario';
import { ALVO_TOQUE, fonte } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import {
  Alimento, ClassificacaoNova, GrupoAlimentar, NivelNutriente, NivelAtencao, NutrienteChave, NutrienteAtencaoChave,
  NutrientesAlimento, FonteNutrientes, TipoRefeicaoRecordatorio,
  criarAlimento, atualizarAlimento, excluirAlimento, buscarNutrientesDoAlimento, salvarNutrientesDoAlimento,
  buscarReceitaDoAlimento, type Receita,
} from '../services/alimentosAdminService';
import { obterPapelAtual } from '../../conteudo/services/conteudoService';
import type { Papel } from '../../conteudo/utils/regrasAprovacao';
import IngredientesPratoSection from '../components/IngredientesPratoSection';
import { ROTULO_GRUPO, ROTULO_NOVA, ROTULO_REFEICAO } from '../utils/filtrosAlimentosAdmin';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

const CLASSIFICACOES: ClassificacaoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];
const DESCRICAO_NOVA: Record<ClassificacaoNova, string> = {
  IN_NATURA: 'Como vem da natureza (fruta, ovo, feijão cru).',
  INGREDIENTE_CULINARIO: 'Extraído para cozinhar (óleo, sal, açúcar).',
  PROCESSADO: 'Alimento com sal/açúcar adicionado (pão, queijo, conserva).',
  ULTRAPROCESSADO: 'Formulação industrial (refrigerante, biscoito recheado).',
};
const TOM_NOVA: Record<ClassificacaoNova, TomSelo> = { IN_NATURA: 'ok', INGREDIENTE_CULINARIO: 'info', PROCESSADO: 'aviso', ULTRAPROCESSADO: 'erro' };
const GRUPOS = Object.keys(ROTULO_GRUPO) as GrupoAlimentar[];
const REFEICOES = Object.keys(ROTULO_REFEICAO) as TipoRefeicaoRecordatorio[];

const NIVEIS_NUTRIENTE: { valor: NivelNutriente; rotulo: string }[] = [
  { valor: 'AUSENTE', rotulo: 'Não tem' }, { valor: 'FONTE', rotulo: 'Fonte' }, { valor: 'ALTO_TEOR', rotulo: 'Alto teor' },
];
const NIVEIS_ATENCAO: { valor: NivelAtencao; rotulo: string }[] = [
  { valor: 'BAIXO', rotulo: 'Baixo' }, { valor: 'MODERADO', rotulo: 'Moderado' }, { valor: 'ALTO', rotulo: 'Alto' },
];
const ROTULO_NIVEL: Record<string, string> = Object.fromEntries([...NIVEIS_NUTRIENTE, ...NIVEIS_ATENCAO].map((n) => [n.valor, n.rotulo]));

const VITAMINAS: { chave: NutrienteChave; rotulo: string }[] = [
  { chave: 'vitamina_a', rotulo: 'Vitamina A' }, { chave: 'vitamina_c', rotulo: 'Vitamina C' }, { chave: 'vitamina_d', rotulo: 'Vitamina D' },
  { chave: 'tiamina', rotulo: 'B1 (tiamina)' }, { chave: 'riboflavina', rotulo: 'B2 (riboflavina)' },
  { chave: 'niacina', rotulo: 'B3 (niacina)' }, { chave: 'piridoxina', rotulo: 'B6 (piridoxina)' },
];
const MINERAIS: { chave: NutrienteChave; rotulo: string }[] = [
  { chave: 'calcio', rotulo: 'Cálcio' }, { chave: 'ferro', rotulo: 'Ferro' }, { chave: 'magnesio', rotulo: 'Magnésio' },
  { chave: 'fosforo', rotulo: 'Fósforo' }, { chave: 'potassio', rotulo: 'Potássio' }, { chave: 'zinco', rotulo: 'Zinco' },
];
const MACROS: { chave: NutrienteChave; rotulo: string }[] = [{ chave: 'proteina', rotulo: 'Proteína' }, { chave: 'fibra', rotulo: 'Fibra' }];
const ATENCAO: { chave: NutrienteAtencaoChave; rotulo: string }[] = [
  { chave: 'sodio', rotulo: 'Sódio' }, { chave: 'carboidrato', rotulo: 'Carboidrato' }, { chave: 'lipideos', rotulo: 'Gordura total' },
];
type ChaveNutriente = NutrienteChave | NutrienteAtencaoChave;
const GRUPOS_NUTRIENTES: { titulo: string; itens: { chave: ChaveNutriente; rotulo: string }[]; niveis: { valor: string; rotulo: string }[]; ajuda?: string }[] = [
  { titulo: 'Vitaminas', itens: VITAMINAS, niveis: NIVEIS_NUTRIENTE },
  { titulo: 'Minerais', itens: MINERAIS, niveis: NIVEIS_NUTRIENTE },
  { titulo: 'Proteína e fibra', itens: MACROS, niveis: NIVEIS_NUTRIENTE },
  { titulo: 'Sódio, carboidrato e gordura total', itens: ATENCAO, niveis: NIVEIS_ATENCAO, ajuda: 'Escala de quantidade: mais alto não é benefício, é só mais presente.' },
];
const TODOS_NUTRIENTES = GRUPOS_NUTRIENTES.flatMap((g) => g.itens);
const TOTAL_NUTRIENTES = VITAMINAS.length + MINERAIS.length + MACROS.length + ATENCAO.length;

type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';
const NIVEIS_EBIA: { valor: ClassificacaoEbia; rotulo: string }[] = [
  { valor: 'SEGURANCA_ALIMENTAR', rotulo: 'Só sem insegurança' },
  { valor: 'INSEGURANCA_LEVE', rotulo: 'Até leve' },
  { valor: 'INSEGURANCA_MODERADA', rotulo: 'Até moderada' },
  { valor: 'INSEGURANCA_GRAVE', rotulo: 'Todos (padrão)' },
];

type AlimentoParam = Alimento & { nivel_maximo_ebia?: ClassificacaoEbia };
type Props = { config: ConfigPainel; navigation: any; route: { params?: { alimento?: AlimentoParam; novoPrato?: boolean } } };

type Campos = {
  nome: string;
  ehPratoComposto: boolean;
  classificacao: ClassificacaoNova | null;
  acessivelEbia: boolean;
  nivelMaximoEbia: ClassificacaoEbia;
  grupos: GrupoAlimentar[];
  refeicoes: TipoRefeicaoRecordatorio[];
};

function camposIniciais(existente: AlimentoParam | undefined, novoPrato: boolean): Campos {
  return {
    nome: existente?.nome ?? '',
    ehPratoComposto: existente?.eh_prato_composto ?? novoPrato,
    classificacao: existente?.classificacao_nova ?? null,
    acessivelEbia: existente?.acessivel_ebia ?? true,
    nivelMaximoEbia: existente?.nivel_maximo_ebia ?? 'INSEGURANCA_GRAVE',
    grupos: existente?.grupos_alimentares ?? [],
    refeicoes: existente?.tipos_refeicao_recordatorio ?? [],
  };
}

/** Foto comparável dos campos, para saber se há alteração não salva. */
const assinatura = (c: Campos, n: NutrientesAlimento) =>
  JSON.stringify({ ...c, nome: c.nome.trim(), grupos: [...c.grupos].sort(), refeicoes: [...c.refeicoes].sort(), n });

export default function AlimentoFormScreen({ config, navigation, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { width } = useWindowDimensions();
  const util = width >= 1024 ? width - 256 : width >= 700 ? width - 92 : width;
  const duasColunas = util >= 960;
  const existente = route.params?.alimento;
  const novoPrato = route.params?.novoPrato === true;

  const [papel, setPapel] = useState<Papel | null>(null);
  const [idSalvo, setIdSalvo] = useState<string | null>(existente?.id ?? null);
  const [campos, setCampos] = useState<Campos>(() => camposIniciais(existente, novoPrato));
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [aviso, setAviso] = useState<{ tom: TomAviso; texto: string; titulo?: string; outro?: boolean } | null>(null);

  const [nutrientes, setNutrientes] = useState<NutrientesAlimento>({});
  const [nutrientesFonte, setNutrientesFonte] = useState<FonteNutrientes>(null);
  const [carregandoNutrientes, setCarregandoNutrientes] = useState(!!existente);
  const [nutrientesAbertos, setNutrientesAbertos] = useState(false);
  const [receita, setReceita] = useState<Receita | null | undefined>(existente?.eh_prato_composto ? undefined : null);
  const [qtdIngredientes, setQtdIngredientes] = useState(0);
  const [salvo, setSalvo] = useState(() => assinatura(camposIniciais(existente, novoPrato), {}));

  const scrollRef = useRef<ScrollView>(null);
  const yIngredientes = useRef(0);
  // liberado depois de excluir: a saída não deve perguntar "sair sem salvar?"
  const saidaLiberada = useRef(false);

  const ehNutricionista = papel === 'NUTRICIONISTA';
  const editando = !!idSalvo;
  const { nome, ehPratoComposto, classificacao, acessivelEbia, nivelMaximoEbia } = campos;
  const grupos = useMemo(() => new Set(campos.grupos), [campos.grupos]);
  const refeicoes = useMemo(() => new Set(campos.refeicoes), [campos.refeicoes]);
  const sujo = assinatura(campos, nutrientes) !== salvo;

  useEffect(() => {
    obterPapelAtual().then(setPapel).catch(() => setPapel(null));
  }, []);

  useEffect(() => {
    if (!existente) return;
    let ativo = true;
    buscarNutrientesDoAlimento(existente.id)
      .then(({ nutrientes: n, fonte }) => {
        if (!ativo) return;
        setNutrientes(n);
        setNutrientesFonte(fonte);
        setSalvo(assinatura(camposIniciais(existente, novoPrato), n));
        if (fonte === 'INFERIDO_POR_GRUPO') setNutrientesAbertos(true); // precisa de revisão
      })
      .catch(() => ativo && setAviso({ tom: 'aviso', texto: 'Não foi possível carregar os nutrientes deste alimento. Os outros dados podem ser editados normalmente.' }))
      .finally(() => ativo && setCarregandoNutrientes(false));
    if (existente.eh_prato_composto) {
      buscarReceitaDoAlimento(existente.id).then((r) => ativo && setReceita(r)).catch(() => ativo && setReceita(null));
    }
    return () => { ativo = false; };
  }, [existente?.id]);

  // Prevenção de erro: sair com alterações não salvas pede confirmação.
  useEffect(() => {
    const sair = navigation.addListener('beforeRemove', (e: any) => {
      if (!sujo || salvando || saidaLiberada.current) return;
      e.preventDefault();
      confirmar('Sair sem salvar?', 'As alterações feitas neste alimento serão perdidas.', { confirmar: 'Sair sem salvar', destrutivo: true })
        .then((ok) => ok && navigation.dispatch(e.data.action));
    });
    return sair;
  }, [navigation, sujo, salvando]);

  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setCampos((c) => ({ ...c, [k]: v }));
  const alternarLista = <K extends 'grupos' | 'refeicoes'>(k: K, v: Campos[K][number]) =>
    setCampos((c) => {
      const lista = c[k] as string[];
      return { ...c, [k]: lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v] };
    });
  const definirNivel = (chave: NutrienteChave | NutrienteAtencaoChave, nivel: NivelNutriente | NivelAtencao | null) =>
    setNutrientes((a) => ({ ...a, [chave]: nivel }));

  const preenchidos = useMemo(() => Object.values(nutrientes).filter((v) => v != null).length, [nutrientes]);
  const erroNome = tentouSalvar && !nome.trim() ? 'Informe o nome.' : null;
  const faltando: string[] = [];
  if (nome.trim().length === 0) faltando.push('nome');
  if (classificacao === null) faltando.push('classificação NOVA');
  if (grupos.size === 0) faltando.push('grupo alimentar');
  const podeSalvar = faltando.length === 0;
  const rotuloItem = ehPratoComposto ? 'prato' : 'alimento';

  async function salvar(): Promise<boolean> {
    if (!podeSalvar || !classificacao) {
      setTentouSalvar(true);
      setAviso({ tom: 'aviso', titulo: 'Faltam informações', texto: `Preencha: ${faltando.join(', ')}.` });
      return false;
    }
    setSalvando(true);
    setAviso(null);
    try {
      const payload = {
        nome: nome.trim(),
        eh_prato_composto: ehPratoComposto,
        classificacao_nova: classificacao,
        acessivel_ebia: acessivelEbia,
        nivel_maximo_ebia: nivelMaximoEbia,
        grupos_alimentares: campos.grupos,
        tipos_refeicao_recordatorio: campos.refeicoes,
      };
      let id = idSalvo;
      if (id) {
        await atualizarAlimento(id, payload as any);
      } else {
        const novo = await criarAlimento(payload as any);
        id = novo?.id ?? null;
        setIdSalvo(id);
      }
      // só a nutricionista grava níveis (ver cabeçalho); e só se algum foi marcado
      if (id && ehNutricionista && Object.values(nutrientes).some((v) => v != null)) {
        await salvarNutrientesDoAlimento(id, nutrientes);
        setNutrientesFonte('REVISADO_NUTRICIONISTA' as FonteNutrientes);
      }
      setSalvo(assinatura(campos, nutrientes));
      setTentouSalvar(false);
      const criou = !editando;
      if (criou && ehPratoComposto) {
        setAviso({ tom: 'ok', titulo: 'Prato criado', texto: 'Agora adicione os ingredientes logo abaixo.' });
        setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, yIngredientes.current - 12), animated: true }), 250);
      } else if (criou) {
        setAviso({ tom: 'ok', titulo: 'Alimento cadastrado', texto: `"${nome.trim()}" já está no catálogo.`, outro: true });
      } else {
        setAviso({ tom: 'ok', texto: 'Alterações salvas.' });
      }
      return true;
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
      return false;
    } finally {
      setSalvando(false);
    }
  }

  function cadastrarOutro() {
    const vazio = camposIniciais(undefined, ehPratoComposto);
    setCampos(vazio);
    setNutrientes({});
    setNutrientesFonte(null);
    setIdSalvo(null);
    setReceita(null);
    setSalvo(assinatura(vazio, {}));
    setAviso(null);
    setTentouSalvar(false);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  async function confirmarExclusao() {
    if (!idSalvo) return;
    const ok = await confirmar(`Excluir ${rotuloItem}?`, `"${nome.trim() || 'Sem nome'}" sai do catálogo. Esta ação não pode ser desfeita.`, { confirmar: 'Excluir', destrutivo: true });
    if (!ok) return;
    try {
      await excluirAlimento(idSalvo);
      saidaLiberada.current = true;
      navigation.goBack();
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
    }
  }

  // ---- seções ----
  const etapasPrato = ehPratoComposto ? (
    <EtapasCadastro
      atual={!editando ? 'dados' : qtdIngredientes === 0 ? 'ingredientes' : 'receita'}
      etapas={[
        { chave: 'dados', rotulo: 'Dados do prato', feita: editando },
        { chave: 'ingredientes', rotulo: 'Ingredientes', feita: qtdIngredientes > 0 },
        { chave: 'receita', rotulo: 'Receita (opcional)', feita: !!receita },
      ]}
    />
  ) : null;

  const secaoBasico = (
    <CartaoSecao titulo="Identificação" subtitulo="Como o item aparece para os adolescentes">
      <CampoTexto
        rotulo="Nome"
        obrigatorio
        value={nome}
        onChangeText={(t) => set('nome', t)}
        placeholder={ehPratoComposto ? 'Ex.: Arroz com feijão' : 'Ex.: Banana prata'}
        maxLength={80}
        erro={erroNome}
        ajuda={`${nome.length}/80 caracteres`}
      />
      <View style={{ gap: 8 }}>
        <RotuloCampo
          texto="Tipo"
          ajuda={ehPratoComposto ? 'Feito de outros alimentos do catálogo; pode ter receita.' : 'Registrado sozinho, como fruta, arroz ou leite.'}
        />
        <OpcoesUnica
          rotulo="Tipo"
          opcoes={[
            { valor: 'SIMPLES', rotulo: 'Ingrediente / alimento', icone: 'nutrition-outline' },
            { valor: 'PRATO', rotulo: 'Prato composto', icone: 'restaurant-outline' },
          ]}
          valor={ehPratoComposto ? 'PRATO' : 'SIMPLES'}
          onChange={(v) => set('ehPratoComposto', v === 'PRATO')}
        />
      </View>
    </CartaoSecao>
  );

  const secaoClassificacao = (
    <CartaoSecao titulo="Classificação" subtitulo="Segundo o Guia Alimentar (obrigatório)">
      <View style={{ gap: 8 }}>
        <RotuloCampo texto="Nível de processamento (NOVA)" obrigatorio />
        <View style={[styles.gradeNova, tentouSalvar && !classificacao && styles.blocoErro]} accessibilityRole="radiogroup">
          {CLASSIFICACOES.map((c) => {
            const on = classificacao === c;
            return (
              <Pressable
                key={c}
                onPress={() => set('classificacao', c)}
                accessibilityRole="radio"
                accessibilityState={{ checked: on, selected: on }}
                accessibilityLabel={`${ROTULO_NOVA[c]}. ${DESCRICAO_NOVA[c]}`}
                style={[styles.opcaoNova, on && styles.opcaoNovaOn]}
              >
                <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? tema.destaqueTexto : tema.textoSuave} />
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText style={styles.opcaoNovaTitulo}>{ROTULO_NOVA[c]}</AppText>
                  <AppText style={styles.ajuda}>{DESCRICAO_NOVA[c]}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
        {tentouSalvar && !classificacao && <AppText style={styles.erroCampo}>Escolha o nível de processamento.</AppText>}
      </View>
      <View style={{ gap: 8 }}>
        <RotuloCampo texto={`Grupos alimentares (${grupos.size} marcado${grupos.size === 1 ? '' : 's'})`} obrigatorio ajuda="Marque todos que se aplicam." />
        <OpcoesMultipla
          rotulo="Grupos alimentares"
          opcoes={GRUPOS.map((g) => ({ valor: g, rotulo: ROTULO_GRUPO[g] }))}
          valores={grupos}
          onAlternar={(g) => alternarLista('grupos', g)}
          erro={tentouSalvar && grupos.size === 0}
        />
        {tentouSalvar && grupos.size === 0 && <AppText style={styles.erroCampo}>Marque pelo menos um grupo.</AppText>}
      </View>
    </CartaoSecao>
  );

  const secaoOnde = (
    <CartaoSecao
      titulo="Onde aparece"
      subtitulo="Recordatório da triagem e busca do dia a dia"
      ajuda="Define em quais refeições do recordatório o alimento é uma opção, e até qual nível de insegurança alimentar ele aparece na busca do adolescente (uso interno: o adolescente nunca vê isso)."
    >
      <View style={{ gap: 8 }}>
        <RotuloCampo texto="Recordatório: em quais refeições?" ajuda="Sem nenhuma marcada, o alimento fica fora do recordatório (continua na busca do dia a dia)." />
        <OpcoesMultipla
          rotulo="Refeições do recordatório"
          opcoes={REFEICOES.map((r) => ({ valor: r, rotulo: ROTULO_REFEICAO[r] }))}
          valores={refeicoes}
          onAlternar={(r) => alternarLista('refeicoes', r)}
        />
      </View>
      <View style={{ gap: 8 }}>
        <RotuloCampo texto="Aparece na busca para quem tem" />
        <OpcoesUnica rotulo="Nível máximo de insegurança alimentar" opcoes={NIVEIS_EBIA} valor={nivelMaximoEbia} onChange={(v) => v && set('nivelMaximoEbia', v)} />
      </View>
      <View style={styles.linhaSwitch}>
        <View style={{ flex: 1 }}>
          <RotuloCampo texto="Acessível no EBIA" ajuda="Usado nas regras de acesso conforme a situação alimentar." />
        </View>
        <Switch
          value={acessivelEbia}
          onValueChange={(v) => set('acessivelEbia', v)}
          trackColor={{ true: tema.destaqueTexto, false: tema.chipBorda }}
          thumbColor={tema.card}
          accessibilityLabel="Acessível no EBIA"
        />
      </View>
    </CartaoSecao>
  );

  const secaoIngredientes = ehPratoComposto ? (
    <View onLayout={(e) => { yIngredientes.current = e.nativeEvent.layout.y; }}>
      <CartaoSecao titulo="Ingredientes do prato" subtitulo={editando ? 'Busque no catálogo, ajuste as proporções e salve' : 'Disponível depois de salvar os dados do prato'}>
        {editando ? (
          <IngredientesPratoSection pratoId={idSalvo} onQuantidade={setQtdIngredientes} />
        ) : (
          <AvisoPainel tom="info" texto="Preencha os dados obrigatórios e salve. Em seguida, os ingredientes aparecem aqui." acao={{ rotulo: 'Salvar e continuar', onPress: () => { salvar(); } }} />
        )}
      </CartaoSecao>
    </View>
  ) : null;

  const secaoReceita = ehPratoComposto && editando ? (
    <CartaoSecao titulo="Receita" subtitulo={receita === undefined ? 'Verificando…' : receita ? 'Este prato tem receita' : 'Opcional: ensina a preparar o prato'}>
      {receita === undefined ? (
        <ActivityIndicator color={tema.destaqueTexto} />
      ) : receita ? (
        <View style={styles.linhaReceita}>
          <Ionicons name="book" size={18} color={tema.destaqueTexto} />
          <AppText style={[styles.opcaoNovaTitulo, { flex: 1 }]}>{receita.titulo}</AppText>
          <AppButton label="ABRIR RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botaoPequeno} onPress={() => navigation.navigate('EditarReceita', { receitaId: receita.id })} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <AppText style={styles.ajuda}>Na tela da receita, escolha este prato para ligar os dois. A receita passa pela aprovação da nutricionista.</AppText>
          <View style={{ flexDirection: 'row' }}>
            <AppButton label="+ CRIAR RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botaoPequeno} onPress={() => navigation.navigate('EditarReceita')} />
          </View>
        </View>
      )}
    </CartaoSecao>
  ) : null;

  const preenchidosTexto = `${preenchidos} de ${TOTAL_NUTRIENTES} preenchidos`;
  const secaoNutrientes = (
    <CartaoSecao
      titulo="Nutrientes"
      subtitulo={ehNutricionista ? `${preenchidosTexto} (opcional)` : preenchidosTexto}
      ajuda="Níveis categóricos (não são quantidades). Fonte dos valores de referência: TACO."
      direita={
        ehNutricionista ? (
          <Pressable onPress={() => setNutrientesAbertos((a) => !a)} accessibilityRole="button" accessibilityState={{ expanded: nutrientesAbertos }} style={styles.alternar}>
            <AppText style={styles.alternarTexto}>{nutrientesAbertos ? 'Recolher' : 'Preencher'}</AppText>
            <Ionicons name={nutrientesAbertos ? 'chevron-up' : 'chevron-down'} size={16} color={tema.destaqueTexto} />
          </Pressable>
        ) : undefined
      }
    >
      <View style={styles.barraProgresso} accessibilityLabel={preenchidosTexto}>
        <View style={[styles.barraProgressoCheia, { width: `${Math.round((preenchidos / TOTAL_NUTRIENTES) * 100)}%` }]} />
      </View>
      {nutrientesFonte === 'INFERIDO_POR_GRUPO' && (
        <AvisoPainel tom="aviso" texto="Os níveis foram estimados pelo grupo alimentar e ainda não foram revisados. Confirme ou ajuste." />
      )}
      {nutrientesFonte === 'REVISADO_NUTRICIONISTA' && <Selo texto="Revisado pela nutricionista" tom="ok" />}
      {carregandoNutrientes ? (
        <ActivityIndicator color={tema.destaqueTexto} />
      ) : !ehNutricionista ? (
        <>
          <AvisoPainel tom="info" texto="Os níveis de nutrientes são definidos e revisados pela nutricionista. Aqui você só consulta." />
          {preenchidos > 0 && (
            <View style={styles.chipsLeitura}>
              {TODOS_NUTRIENTES
                .filter(({ chave }) => nutrientes[chave] != null)
                .map(({ chave, rotulo }) => <Selo key={chave} texto={`${rotulo}: ${ROTULO_NIVEL[String(nutrientes[chave])] ?? nutrientes[chave]}`} tom="neutro" />)}
            </View>
          )}
        </>
      ) : !nutrientesAbertos ? (
        <AppText style={styles.ajuda}>Toque em "Preencher" para informar vitaminas, minerais, proteína, fibra, sódio, carboidrato e gordura.</AppText>
      ) : (
        GRUPOS_NUTRIENTES.map((g) => (
          <View key={g.titulo} style={{ gap: 4 }}>
            <AppText style={styles.subLabel}>{g.titulo}</AppText>
            {!!g.ajuda && <AppText style={styles.ajuda}>{g.ajuda}</AppText>}
            {g.itens.map(({ chave, rotulo }) => (
              <View key={chave} style={styles.linhaNutriente}>
                <AppText style={styles.rotuloNutriente}>{rotulo}</AppText>
                <View style={styles.segmentado} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
                  {g.niveis.map((o) => {
                    const on = nutrientes[chave] === o.valor;
                    return (
                      <Pressable
                        key={o.valor}
                        onPress={() => definirNivel(chave, on ? null : (o.valor as any))}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on, selected: on }}
                        accessibilityLabel={`${rotulo}: ${o.rotulo}`}
                        style={[styles.seg, on && styles.segOn]}
                      >
                        <AppText style={[styles.segTexto, on && styles.segTextoOn]}>{o.rotulo}</AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        ))
      )}
    </CartaoSecao>
  );

  const titulo = existente || editando ? (ehPratoComposto ? 'Editar prato' : 'Editar alimento') : ehPratoComposto ? 'Novo prato' : 'Novo alimento';

  return (
    <PainelLayout config={config} titulo={titulo} subtitulo="Catálogo · os campos com * são obrigatórios" voltar rolagem={false}>
      <View style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.resumo}>
            <View style={[styles.resumoIcone, ehPratoComposto && styles.resumoIconePrato]}>
              <Ionicons name={ehPratoComposto ? 'restaurant' : 'nutrition'} size={22} color={ehPratoComposto ? tema.selos.aviso.texto : tema.destaqueTexto} />
            </View>
            <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
              <AppText style={styles.resumoNome} numberOfLines={2}>{nome.trim() || (ehPratoComposto ? 'Prato sem nome' : 'Alimento sem nome')}</AppText>
              <View style={styles.selos}>
                <Selo texto={ehPratoComposto ? 'Prato composto' : 'Ingrediente'} tom="neutro" />
                {classificacao && <Selo texto={ROTULO_NOVA[classificacao]} tom={TOM_NOVA[classificacao]} />}
                {refeicoes.size > 0 && <Selo texto={`Recordatório (${refeicoes.size})`} tom="info" />}
                {editando && sujo && <Selo texto="Alterações não salvas" tom="aviso" />}
              </View>
            </View>
          </View>

          {etapasPrato}

          {!!aviso && (
            <AvisoPainel
              tom={aviso.tom}
              titulo={aviso.titulo}
              texto={aviso.texto}
              onFechar={() => setAviso(null)}
              acao={aviso.outro ? { rotulo: `Cadastrar outro ${rotuloItem}`, onPress: cadastrarOutro } : undefined}
            />
          )}

          <View style={duasColunas ? styles.duas : styles.uma}>
            <View style={duasColunas ? styles.col : styles.uma}>
              {secaoBasico}
              {secaoIngredientes}
              {secaoClassificacao}
              {secaoOnde}
            </View>
            <View style={duasColunas ? styles.col : styles.uma}>
              {secaoReceita}
              {secaoNutrientes}
            </View>
          </View>
        </ScrollView>

        {/* Barra fixa: a ação principal fica sempre à mão, mesmo com o formulário longo */}
        <View style={styles.barraAcoes}>
          <View style={{ flex: 1, minWidth: 160 }}>
            {podeSalvar ? (
              <AppText style={styles.statusOk}>
                {sujo ? (editando ? 'Há alterações para salvar.' : 'Pronto para salvar.') : editando ? 'Tudo salvo.' : 'Preencha os dados.'}
              </AppText>
            ) : (
              <AppText style={styles.statusFalta}>Falta: {faltando.join(', ')}</AppText>
            )}
          </View>
          <View style={styles.acoes}>
            {editando && (
              <AppButton label="EXCLUIR" fullWidth={false} size="compact" outlineColor={tema.erro} textColor={tema.erro} disabled={salvando} style={styles.botao} onPress={confirmarExclusao} />
            )}
            <AppButton label={editando ? 'VOLTAR' : 'CANCELAR'} fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={salvando} style={styles.botao} onPress={() => navigation.goBack()} />
            <AppButton
              label={salvando ? 'SALVANDO…' : editando ? 'SALVAR' : ehPratoComposto ? 'SALVAR E CONTINUAR' : `CADASTRAR ${rotuloItem.toUpperCase()}`}
              fullWidth={false}
              size="compact"
              backgroundColor={tema.botaoFundo}
              textColor={tema.botaoTexto}
              shadowColor={tema.botaoSombra}
              disabled={salvando || (editando && !sujo)}
              style={styles.botao}
              onPress={() => { salvar(); }}
            />
          </View>
        </View>
      </View>
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  content: { paddingBottom: 24, gap: 16 },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  resumoIcone: { width: 48, height: 48, borderRadius: 14, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  resumoIconePrato: { backgroundColor: t.alertaSuave },
  resumoNome: { fontFamily: typography.bold, fontSize: 20, color: t.texto },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  uma: { gap: 16 },
  duas: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0, gap: 16 },
  subLabel: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.textoSuave, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  ajuda: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, lineHeight: 17 },
  erroCampo: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.erro },
  blocoErro: { borderWidth: 2, borderColor: t.erro, borderRadius: 12, padding: 6 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: ALVO_TOQUE },
  gradeNova: { gap: 8 },
  opcaoNova: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: ALVO_TOQUE + 8, padding: 12, borderRadius: 12, borderWidth: t.borda, borderColor: t.cardBorda, backgroundColor: t.card },
  opcaoNovaOn: { borderColor: t.destaqueTexto, borderWidth: 2, backgroundColor: t.destaqueSuave },
  opcaoNovaTitulo: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.texto },
  linhaReceita: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  barraProgresso: { height: 6, borderRadius: 3, backgroundColor: t.linhaSuave, overflow: 'hidden' },
  barraProgressoCheia: { height: 6, borderRadius: 3, backgroundColor: t.destaque },
  chipsLeitura: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linhaNutriente: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.linhaSuave },
  rotuloNutriente: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto, minWidth: 120 },
  segmentado: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, backgroundColor: t.superficieSuave, borderRadius: 10, padding: 3 },
  seg: { minHeight: 38, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  segOn: { backgroundColor: t.chipAtivoFundo },
  segTexto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.chipTexto },
  segTextoOn: { color: t.chipAtivoTexto },
  alternar: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: ALVO_TOQUE, paddingHorizontal: 6 },
  alternarTexto: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.destaqueTexto },
  barraAcoes: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, paddingTop: 12, marginTop: 4,
    borderTopWidth: 1, borderTopColor: t.cardBorda, backgroundColor: t.fundo,
  },
  statusOk: { fontFamily: typography.medium, fontSize: fonte.apoio, color: t.textoSuave },
  statusFalta: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.alertaTexto },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  botaoPequeno: { paddingHorizontal: 14, minHeight: ALVO_TOQUE },
}) as const;
