// src/features/admin/screens/AlimentoFormScreen.tsx
// Cadastro/edição de um alimento, em seções: o que é, como se classifica, onde aparece e
// nutrientes. Em telas largas as seções ficam em duas colunas. A gravação não mudou.
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { avisar, confirmar } from '../../../shared/ui/dialogo';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { Selo, type TomSelo } from '../../../shared/painel/components/ControlesLista';
import {
  Alimento, ClassificacaoNova, GrupoAlimentar, NivelNutriente, NivelAtencao, NutrienteChave, NutrienteAtencaoChave,
  NutrientesAlimento, FonteNutrientes, TipoRefeicaoRecordatorio,
  criarAlimento, atualizarAlimento, excluirAlimento, buscarNutrientesDoAlimento, salvarNutrientesDoAlimento,
  buscarReceitaDoAlimento, type Receita,
} from '../services/alimentosAdminService';
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

type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';
const NIVEIS_EBIA: { valor: ClassificacaoEbia; rotulo: string }[] = [
  { valor: 'SEGURANCA_ALIMENTAR', rotulo: 'Só sem insegurança' },
  { valor: 'INSEGURANCA_LEVE', rotulo: 'Até leve' },
  { valor: 'INSEGURANCA_MODERADA', rotulo: 'Até moderada' },
  { valor: 'INSEGURANCA_GRAVE', rotulo: 'Todos (padrão)' },
];

/** botões lado a lado onde só um fica ligado; tocar no ligado desliga (quando `limpavel`) */
function Segmentado<T extends string>({ opcoes, valor, onChange, limpavel }: { opcoes: { valor: T; rotulo: string }[]; valor: T | null | undefined; onChange: (v: T | null) => void; limpavel?: boolean }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.segmentado} accessibilityRole="radiogroup">
      {opcoes.map((o) => {
        const on = valor === o.valor;
        return (
          <Pressable key={o.valor} onPress={() => onChange(on && limpavel ? null : o.valor)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.seg, on && styles.segOn]}>
            <AppText style={[styles.segTexto, on && styles.segTextoOn]}>{o.rotulo}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function Chip({ texto, ligado, onPress }: { texto: string; ligado: boolean; onPress: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: ligado }} style={[styles.chip, ligado && styles.chipOn]}>
      {ligado && <Ionicons name="checkmark" size={14} color={tema.texto} />}
      <AppText style={[styles.chipTexto, ligado && { color: tema.texto }]}>{texto}</AppText>
    </Pressable>
  );
}

function LinhaNutriente({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.linhaNutriente}>
      <AppText style={styles.rotuloNutriente}>{rotulo}</AppText>
      {children}
    </View>
  );
}

export default function AlimentoFormScreen({ navigation, route }: any) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { width } = useWindowDimensions();
  const duasColunas = width >= 1150;
  const existente: (Alimento & { nivel_maximo_ebia?: ClassificacaoEbia }) | undefined = route.params?.alimento;
  const [idSalvo, setIdSalvo] = useState<string | null>(existente?.id ?? null);

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [ehPratoComposto, setEhPratoComposto] = useState(existente?.eh_prato_composto ?? false);
  const [classificacao, setClassificacao] = useState<ClassificacaoNova | null>(existente?.classificacao_nova ?? null);
  const [acessivelEbia, setAcessivelEbia] = useState(existente?.acessivel_ebia ?? true);
  const [nivelMaximoEbia, setNivelMaximoEbia] = useState<ClassificacaoEbia>(existente?.nivel_maximo_ebia ?? 'INSEGURANCA_GRAVE');
  const [grupos, setGrupos] = useState<Set<GrupoAlimentar>>(new Set(existente?.grupos_alimentares ?? []));
  const [refeicoes, setRefeicoes] = useState<Set<TipoRefeicaoRecordatorio>>(new Set(existente?.tipos_refeicao_recordatorio ?? []));
  const [salvando, setSalvando] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

  const [nutrientes, setNutrientes] = useState<NutrientesAlimento>({});
  const [nutrientesFonte, setNutrientesFonte] = useState<FonteNutrientes>(null);
  const [carregandoNutrientes, setCarregandoNutrientes] = useState(!!existente);
  const [nutrientesAbertos, setNutrientesAbertos] = useState(false);
  const [receita, setReceita] = useState<Receita | null | undefined>(undefined); // undefined = carregando

  useEffect(() => {
    if (!existente) return;
    let ativo = true;
    buscarNutrientesDoAlimento(existente.id)
      .then(({ nutrientes: n, fonte }) => {
        if (!ativo) return;
        setNutrientes(n);
        setNutrientesFonte(fonte);
        if (fonte === 'INFERIDO_POR_GRUPO') setNutrientesAbertos(true); // precisa de revisão
      })
      .finally(() => ativo && setCarregandoNutrientes(false));
    if (existente.eh_prato_composto) {
      buscarReceitaDoAlimento(existente.id).then((r) => ativo && setReceita(r)).catch(() => ativo && setReceita(null));
    }
    return () => { ativo = false; };
  }, [existente?.id]);

  const preenchidos = useMemo(() => Object.values(nutrientes).filter((v) => v != null).length, [nutrientes]);
  const totalNutrientes = VITAMINAS.length + MINERAIS.length + MACROS.length + ATENCAO.length;

  const alternar = <T,>(set: Set<T>, setar: (s: Set<T>) => void, v: T) => {
    const n = new Set(set);
    n.has(v) ? n.delete(v) : n.add(v);
    setar(n);
  };
  const definirNivel = (chave: NutrienteChave | NutrienteAtencaoChave, nivel: NivelNutriente | NivelAtencao | null) =>
    setNutrientes((a) => ({ ...a, [chave]: nivel }));

  const faltando: string[] = [];
  if (nome.trim().length === 0) faltando.push('o nome');
  if (classificacao === null) faltando.push('a classificação NOVA');
  if (grupos.size === 0) faltando.push('pelo menos um grupo alimentar');
  const podeSalvar = faltando.length === 0;

  async function salvar() {
    if (!podeSalvar || !classificacao) { setTentouSalvar(true); return; }
    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        eh_prato_composto: ehPratoComposto,
        classificacao_nova: classificacao,
        acessivel_ebia: acessivelEbia,
        nivel_maximo_ebia: nivelMaximoEbia,
        grupos_alimentares: Array.from(grupos),
        tipos_refeicao_recordatorio: Array.from(refeicoes),
      };
      let idParaNutrientes: string | null;
      if (existente) {
        await atualizarAlimento(existente.id, payload as any);
        setIdSalvo(existente.id);
        idParaNutrientes = existente.id;
      } else {
        const novo = await criarAlimento(payload as any);
        setIdSalvo(novo?.id ?? null);
        idParaNutrientes = novo?.id ?? null;
      }
      // só grava alimento_nutrientes se pelo menos um nível foi marcado
      if (idParaNutrientes && Object.values(nutrientes).some((v) => v != null)) {
        await salvarNutrientesDoAlimento(idParaNutrientes, nutrientes);
      }
      if (!ehPratoComposto) navigation.goBack();
      else avisar('Alimento salvo', 'Agora você pode adicionar os ingredientes do prato, logo abaixo.');
    } catch (e: any) {
      avisar('Erro ao salvar', e.message ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!existente) return;
    const ok = await confirmar('Excluir alimento?', `Isso remove "${existente.nome}" do catálogo.`, { confirmar: 'Excluir', destrutivo: true });
    if (!ok) return;
    try {
      await excluirAlimento(existente.id);
      navigation.goBack();
    } catch (e: any) {
      avisar('Não foi possível excluir', e.message ?? 'Tente novamente.');
    }
  }

  // ---- seções ----
  const secaoBasico = (
    <CartaoSecao titulo="O que é" subtitulo="Nome e tipo do alimento">
      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>Nome</AppText>
        <TextInput value={nome} onChangeText={setNome} placeholder="Ex.: Arroz com feijão" placeholderTextColor={tema.placeholder} style={[styles.input, tentouSalvar && !nome.trim() && styles.inputErro]} maxLength={80} accessibilityLabel="Nome do alimento" />
      </View>
      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>Tipo</AppText>
        <Segmentado
          opcoes={[{ valor: 'SIMPLES', rotulo: 'Ingrediente / alimento' }, { valor: 'PRATO', rotulo: 'Prato composto' }]}
          valor={ehPratoComposto ? 'PRATO' : 'SIMPLES'}
          onChange={(v) => setEhPratoComposto(v === 'PRATO')}
        />
        <AppText style={styles.ajuda}>
          {ehPratoComposto ? 'Prato composto é feito de outros alimentos (você escolhe os ingredientes depois de salvar) e pode ter uma receita.' : 'Alimento que se registra sozinho, como fruta, arroz ou leite.'}
        </AppText>
      </View>
      <View style={styles.linhaSwitch}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.rotulo}>Acessível no EBIA</AppText>
          <AppText style={styles.ajuda}>Usado nas regras de acesso conforme a situação alimentar.</AppText>
        </View>
        <Switch value={acessivelEbia} onValueChange={setAcessivelEbia} />
      </View>
    </CartaoSecao>
  );

  const secaoClassificacao = (
    <CartaoSecao titulo="Classificação" subtitulo="NOVA e grupos alimentares (obrigatórios)">
      <View style={{ gap: 8 }}>
        <AppText style={styles.rotulo}>Classificação NOVA</AppText>
        {CLASSIFICACOES.map((c) => {
          const on = classificacao === c;
          return (
            <Pressable key={c} onPress={() => setClassificacao(c)} accessibilityRole="radio" accessibilityState={{ selected: on }} style={[styles.opcaoNova, on && styles.opcaoNovaOn, tentouSalvar && !classificacao && styles.inputErro]}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? tema.texto : tema.textoSuave} />
              <View style={{ flex: 1 }}>
                <AppText style={styles.opcaoNovaTitulo}>{ROTULO_NOVA[c]}</AppText>
                <AppText style={styles.ajuda}>{DESCRICAO_NOVA[c]}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: 8 }}>
        <AppText style={styles.rotulo}>Grupos alimentares ({grupos.size})</AppText>
        <View style={[styles.chips, tentouSalvar && grupos.size === 0 && styles.blocoErro]}>
          {GRUPOS.map((g) => <Chip key={g} texto={ROTULO_GRUPO[g]} ligado={grupos.has(g)} onPress={() => alternar(grupos, setGrupos, g)} />)}
        </View>
      </View>
    </CartaoSecao>
  );

  const secaoOnde = (
    <CartaoSecao titulo="Onde aparece" subtitulo="Recordatório da triagem e acesso por EBIA" ajuda="Define em quais refeições do recordatório o alimento é uma opção, e até qual nível de insegurança alimentar ele aparece na busca do adolescente (uso interno: o adolescente nunca vê isso).">
      <View style={{ gap: 8 }}>
        <AppText style={styles.rotulo}>Recordatório: em quais refeições?</AppText>
        <AppText style={styles.ajuda}>Sem nenhuma marcada, o alimento não aparece no recordatório (continua na busca do dia a dia).</AppText>
        <View style={styles.chips}>
          {REFEICOES.map((r) => <Chip key={r} texto={ROTULO_REFEICAO[r]} ligado={refeicoes.has(r)} onPress={() => alternar(refeicoes, setRefeicoes, r)} />)}
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <AppText style={styles.rotulo}>Aparece na busca para quem tem</AppText>
        <Segmentado opcoes={NIVEIS_EBIA} valor={nivelMaximoEbia} onChange={(v) => v && setNivelMaximoEbia(v)} />
      </View>
    </CartaoSecao>
  );

  const secaoReceita = existente?.eh_prato_composto ? (
    <CartaoSecao titulo="Receita" subtitulo={receita === undefined ? 'Verificando...' : receita ? 'Este prato tem receita' : 'Este prato ainda não tem receita'}>
      {receita ? (
        <>
          <AppText style={styles.rotulo}>{receita.titulo}</AppText>
          <View style={{ flexDirection: 'row' }}>
            <AppButton label="ABRIR RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botaoPequeno} onPress={() => navigation.navigate('EditarReceita', { receitaId: receita.id })} />
          </View>
        </>
      ) : receita === null ? (
        <>
          <AppText style={styles.ajuda}>Na tela da receita, escolha este prato para ligar os dois.</AppText>
          <View style={{ flexDirection: 'row' }}>
            <AppButton label="CRIAR RECEITA" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} style={styles.botaoPequeno} onPress={() => navigation.navigate('EditarReceita')} />
          </View>
        </>
      ) : null}
    </CartaoSecao>
  ) : null;

  const secaoNutrientes = (
    <CartaoSecao
      titulo="Nutrientes"
      subtitulo={`${preenchidos} de ${totalNutrientes} preenchidos (opcional)`}
      direita={
        <Pressable onPress={() => setNutrientesAbertos((a) => !a)} accessibilityRole="button" accessibilityState={{ expanded: nutrientesAbertos }} hitSlop={8} style={styles.alternar}>
          <AppText style={styles.alternarTexto}>{nutrientesAbertos ? 'Recolher' : 'Preencher'}</AppText>
          <Ionicons name={nutrientesAbertos ? 'chevron-up' : 'chevron-down'} size={14} color={tema.texto} />
        </Pressable>
      }
    >
      {nutrientesFonte === 'INFERIDO_POR_GRUPO' && (
        <View style={styles.avisoInferido}>
          <Ionicons name="alert-circle" size={18} color="#8A5A00" />
          <AppText style={styles.avisoInferidoTexto}>Cadastrado por um adolescente: os níveis foram estimados pelo grupo alimentar e ninguém revisou. Confirme ou ajuste.</AppText>
        </View>
      )}
      {carregandoNutrientes ? (
        <ActivityIndicator color={tema.texto} />
      ) : !nutrientesAbertos ? (
        <AppText style={styles.ajuda}>Toque em "Preencher" para informar vitaminas, minerais, proteína, fibra, sódio, carboidrato e gordura.</AppText>
      ) : (
        <>
          <AppText style={styles.subLabel}>Vitaminas</AppText>
          {VITAMINAS.map(({ chave, rotulo }) => (
            <LinhaNutriente key={chave} rotulo={rotulo}><Segmentado opcoes={NIVEIS_NUTRIENTE} valor={nutrientes[chave] as NivelNutriente | null | undefined} limpavel onChange={(v) => definirNivel(chave, v)} /></LinhaNutriente>
          ))}
          <AppText style={styles.subLabel}>Minerais</AppText>
          {MINERAIS.map(({ chave, rotulo }) => (
            <LinhaNutriente key={chave} rotulo={rotulo}><Segmentado opcoes={NIVEIS_NUTRIENTE} valor={nutrientes[chave] as NivelNutriente | null | undefined} limpavel onChange={(v) => definirNivel(chave, v)} /></LinhaNutriente>
          ))}
          <AppText style={styles.subLabel}>Proteína e fibra</AppText>
          {MACROS.map(({ chave, rotulo }) => (
            <LinhaNutriente key={chave} rotulo={rotulo}><Segmentado opcoes={NIVEIS_NUTRIENTE} valor={nutrientes[chave] as NivelNutriente | null | undefined} limpavel onChange={(v) => definirNivel(chave, v)} /></LinhaNutriente>
          ))}
          <AppText style={styles.subLabel}>Sódio, carboidrato e gordura total</AppText>
          <AppText style={styles.ajuda}>Escala de quantidade: mais alto não é benefício, é só mais presente.</AppText>
          {ATENCAO.map(({ chave, rotulo }) => (
            <LinhaNutriente key={chave} rotulo={rotulo}><Segmentado opcoes={NIVEIS_ATENCAO} valor={nutrientes[chave] as NivelAtencao | null | undefined} limpavel onChange={(v) => definirNivel(chave, v)} /></LinhaNutriente>
          ))}
        </>
      )}
    </CartaoSecao>
  );

  const secaoIngredientes = ehPratoComposto ? (
    <CartaoSecao titulo="Ingredientes do prato" subtitulo={idSalvo ? 'Do que o prato é feito' : 'Salve o alimento para adicionar os ingredientes'}>
      <IngredientesPratoSection pratoId={idSalvo} />
    </CartaoSecao>
  ) : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.resumo}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <AppText style={styles.resumoNome} numberOfLines={2}>{nome.trim() || (existente ? 'Alimento' : 'Novo alimento')}</AppText>
          <View style={styles.selos}>
            <Selo texto={ehPratoComposto ? 'Prato composto' : 'Ingrediente'} tom="neutro" />
            {classificacao && <Selo texto={ROTULO_NOVA[classificacao]} tom={TOM_NOVA[classificacao]} />}
            {refeicoes.size > 0 && <Selo texto={`Recordatório (${refeicoes.size})`} tom="info" />}
          </View>
        </View>
      </View>

      <View style={duasColunas ? styles.duas : styles.uma}>
        <View style={duasColunas ? styles.col : styles.uma}>
          {secaoBasico}
          {secaoClassificacao}
          {secaoOnde}
          {secaoReceita}
        </View>
        <View style={duasColunas ? styles.col : styles.uma}>
          {secaoIngredientes}
          {secaoNutrientes}
        </View>
      </View>

      {tentouSalvar && !podeSalvar && (
        <View style={styles.erros}>
          <AppText style={styles.erroTexto}>Falta informar: {faltando.join(', ')}.</AppText>
        </View>
      )}

      <View style={styles.acoes}>
        <AppButton
          label={salvando ? 'SALVANDO...' : existente ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR ALIMENTO'}
          fullWidth={false} size="compact"
          backgroundColor={podeSalvar ? tema.texto : '#B8B8B8'} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra}
          disabled={salvando} style={styles.botao} onPress={salvar}
        />
        <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={salvando} style={styles.botao} onPress={() => navigation.goBack()} />
        {existente && (
          <AppButton label="EXCLUIR" fullWidth={false} size="compact" outlineColor="#D64545" textColor="#D64545" shadowColor="transparent" style={[styles.botao, { marginLeft: 'auto' }]} onPress={confirmarExclusao} />
        )}
      </View>
    </ScrollView>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  root: { flex: 1, backgroundColor: painel.fundo },
  content: { padding: 20, paddingBottom: 60, gap: 16 },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resumoNome: { fontFamily: typography.bold, fontSize: 22, color: t.texto },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  uma: { gap: 16 },
  duas: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0, gap: 16 },
  rotulo: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  subLabel: { fontFamily: typography.bold, fontSize: 12, color: t.texto, marginTop: 6, opacity: 0.8 },
  ajuda: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  input: { borderWidth: 2, borderColor: t.cardBorda, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: typography.regular, fontSize: 15, color: t.texto, backgroundColor: t.card },
  inputErro: { borderColor: t.erro },
  blocoErro: { borderWidth: 2, borderColor: t.erro, borderRadius: 12, padding: 6 },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  segmentado: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seg: { minHeight: 38, paddingHorizontal: 12, borderRadius: 10, borderWidth: 2, borderColor: t.cardBorda, justifyContent: 'center', backgroundColor: t.card },
  segOn: { backgroundColor: t.destaqueSuave, borderColor: t.texto },
  segTexto: { fontFamily: typography.semiBold, fontSize: 12, color: t.textoSuave },
  segTextoOn: { color: t.texto, fontFamily: typography.bold },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 38, paddingHorizontal: 12, borderRadius: 19, borderWidth: 2, borderColor: t.cardBorda, backgroundColor: t.card },
  chipOn: { backgroundColor: t.destaqueSuave, borderColor: t.texto },
  chipTexto: { fontFamily: typography.semiBold, fontSize: 12, color: t.textoSuave },
  opcaoNova: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: t.cardBorda },
  opcaoNovaOn: { borderColor: t.texto, backgroundColor: t.destaqueSuave },
  opcaoNovaTitulo: { fontFamily: typography.bold, fontSize: 13, color: t.texto },
  linhaNutriente: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: t.linhaSuave },
  rotuloNutriente: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto, minWidth: 110 },
  alternar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alternarTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  avisoInferido: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: t.alertaSuave, borderRadius: 10, padding: 10 },
  avisoInferidoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, color: t.selos.aviso.texto, lineHeight: 17 },
  erros: { backgroundColor: t.selos.erro.fundo, borderRadius: 12, padding: 12 },
  erroTexto: { fontFamily: typography.semiBold, fontSize: 13, color: t.erro },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  botao: { paddingHorizontal: 20, minHeight: 46 },
  botaoPequeno: { paddingHorizontal: 14, minHeight: 44 },
}) as const;
