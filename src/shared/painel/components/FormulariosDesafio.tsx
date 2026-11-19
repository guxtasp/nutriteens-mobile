// src/shared/painel/components/FormulariosDesafio.tsx
// Formulários do painel para desafios e conquistas, em etapas (Assistente) com a prévia do
// cartão que o adolescente vê. As regras de validação e as chamadas ao banco são as mesmas de
// antes; só mudou a forma de preencher (uma etapa por vez, em vez de 8 a 10 campos de uma vez).
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { Assistente } from './Assistente';
import { PreviaApp, corApp } from './PreviaApp';
import { AvisoPainel, CampoTexto, OpcoesUnica, RotuloCampo, type TomAviso } from './Formulario';
import { SeletorIconeMissao } from './SeletorIconeMissao';
import { IconeMissao } from '../../ui/IconeMissao';
import { ICONE_MISSAO_PADRAO, resolverIconeMissao } from '../../ui/iconesMissao';
import {
  CRITERIO_LABEL, ICONES_CONQUISTA, METRICA_LABEL, NUTRIENTES_DESAFIO,
  DesafioPeriodico, InsigniaPainel, salvarDesafioPeriodico, salvarInsignia,
  REGRAS_DIARIAS, salvarDiarioCustom, type DesafioDiarioCustom, definirPontosDiario, type DesafioDiario,
} from '../../../features/nutricionista/services/desafiosService';

type Aviso = { tom: TomAviso; texto: string } | null;
const opcoes = (l: { chave: string; label: string }[]) => l.map((o) => ({ valor: o.chave, rotulo: o.label }));

// ---------------------------------------------------------------- prévias

/** Cartão de missão como aparece na lista de desafios do adolescente (aproximação). */
export function PreviaMissao({ icone, titulo, descricao, pontos, selo }: { icone: string; titulo: string; descricao: string; pontos: number | null; selo: string }) {
  const s = useEstilos(criarEstilos);
  return (
    <PreviaApp nota="Prévia ilustrativa da missão na tela de desafios do app.">
      <View style={s.pCard}>
        <View style={s.pIcone}><IconeMissao valor={icone} tamanho={24} cor={corApp.texto} /></View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={s.pSelo}><AppText style={s.pSeloTexto}>{selo}</AppText></View>
          <AppText style={[s.pTitulo, !titulo.trim() && s.pVazio]}>{titulo.trim() || 'Título do desafio'}</AppText>
          <AppText style={[s.pTexto, !descricao.trim() && s.pVazio]}>{descricao.trim() || 'A descrição aparece aqui.'}</AppText>
        </View>
      </View>
      <View style={s.pRodape}>
        <View style={s.pBarra}><View style={s.pBarraCheia} /></View>
        {pontos !== null && <View style={s.pPontos}><AppText style={s.pPontosTexto}>+{pontos} pts</AppText></View>}
      </View>
    </PreviaApp>
  );
}

function PreviaConquista({ icone, nome, descricao, meta, categoria }: { icone: string; nome: string; descricao: string; meta: string; categoria: string }) {
  const s = useEstilos(criarEstilos);
  return (
    <PreviaApp nota="Prévia ilustrativa de como a conquista aparece no perfil do adolescente.">
      <View style={[s.pCard, { flexDirection: 'column', alignItems: 'center' }]}>
        <View style={s.pMedalha}><Ionicons name={icone as any} size={30} color={corApp.texto} /></View>
        <View style={s.pSelo}><AppText style={s.pSeloTexto}>{categoria}</AppText></View>
        <AppText style={[s.pTitulo, { textAlign: 'center' }, !nome.trim() && s.pVazio]}>{nome.trim() || 'Nome da conquista'}</AppText>
        <AppText style={[s.pTexto, { textAlign: 'center' }, !descricao.trim() && s.pVazio]}>{descricao.trim() || 'Como ganhar aparece aqui.'}</AppText>
        <AppText style={s.pMeta}>{meta}</AppText>
      </View>
    </PreviaApp>
  );
}

function CampoNumero({ rotulo, ajuda, valor, onChange, max = 5 }: { rotulo: string; ajuda?: string; valor: string; onChange: (v: string) => void; max?: number }) {
  return (
    <View style={{ maxWidth: 220 }}>
      <CampoTexto rotulo={rotulo} ajuda={ajuda} value={valor} onChangeText={(t) => onChange(t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={max} />
    </View>
  );
}

// ---------------------------------------------------------------- semanal / mensal

const METRICAS = Object.keys(METRICA_LABEL).map((k) => ({ chave: k, label: METRICA_LABEL[k] }));
const EXTRA_METRICA: Record<string, { rotulo: string; min: number; max: number; obrigatorio: boolean }> = {
  DIAS_PASSOS_META: { rotulo: 'Passos por dia (para o dia contar)', min: 1000, max: 30000, obrigatorio: true },
  DIAS_VARIEDADE_GRUPOS: { rotulo: 'Grupos alimentares por dia (para o dia contar)', min: 2, max: 7, obrigatorio: true },
  DIAS_ATIVIDADE_META: { rotulo: 'Minutos de atividade por dia (para o dia contar)', min: 5, max: 180, obrigatorio: false },
};
const METRICA_DIAS = new Set(['DIAS_AGUA_META', 'DIAS_ATIVIDADE_META', 'DIAS_COM_REGISTRO', 'DIAS_FONTE_NUTRIENTE', 'MISSOES_DIARIAS', 'DIAS_PASSOS_META', 'DIAS_VARIEDADE_GRUPOS']);

export function FormDesafioPeriodico({ inicial, onSalvo, onCancelar }: { inicial?: DesafioPeriodico | null; onSalvo: () => void; onCancelar: () => void }) {
  const [periodo, setPeriodo] = useState<'SEMANAL' | 'MENSAL'>(inicial?.periodo ?? 'SEMANAL');
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  // emojis antigos viram o ícone equivalente ao abrir para editar
  const [icone, setIcone] = useState(inicial?.icone ? resolverIconeMissao(inicial.icone) : ICONE_MISSAO_PADRAO);
  const [metrica, setMetrica] = useState(inicial?.metrica ?? 'DIAS_COM_REGISTRO');
  const [alvo, setAlvo] = useState(String(inicial?.alvo ?? 5));
  const [pontos, setPontos] = useState(String(inicial?.pontos ?? 30));
  const [nutriente, setNutriente] = useState(inicial?.nutriente ?? 'proteina');
  const [valor, setValor] = useState(String(inicial?.parametros?.passos ?? inicial?.parametros?.grupos ?? inicial?.parametros?.minutos_dia ?? ''));
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  const limite = periodo === 'SEMANAL' ? 7 : 31;
  const extra = EXTRA_METRICA[metrica];
  const alvoN = parseInt(alvo, 10);
  const pontosN = parseInt(pontos, 10);
  const valorN = parseInt(valor, 10);

  const validarMeta = () => {
    if (!(alvoN >= 1)) return 'A meta precisa ser 1 ou mais.';
    if (METRICA_DIAS.has(metrica) && alvoN > limite) return `Em um período ${periodo === 'SEMANAL' ? 'semanal' : 'mensal'} a meta de dias não pode passar de ${limite}.`;
    if (extra && extra.obrigatorio && !(valorN >= extra.min && valorN <= extra.max)) return `${extra.rotulo}: use um valor entre ${extra.min} e ${extra.max}.`;
    return null;
  };
  const validarTexto = () => (!titulo.trim() || !descricao.trim() ? 'Preencha o título e a descrição.' : null);
  const validarPontos = () => (!(pontosN >= 0 && pontosN <= 1000) ? 'Pontos entre 0 e 1000.' : null);

  async function salvar() {
    setSalvando(true);
    setAviso(null);
    try {
      await salvarDesafioPeriodico({
        codigo: inicial?.ref ?? null, periodo, titulo, descricao, icone, metrica, alvo: alvoN, pontos: pontosN,
        nutriente: metrica === 'DIAS_FONTE_NUTRIENTE' ? nutriente : null,
        valor: extra && valorN >= extra.min && valorN <= extra.max ? valorN : null,
      });
      onSalvo();
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
    } finally {
      setSalvando(false);
    }
  }

  const resumoMeta = `${alvoN >= 1 ? alvoN : '?'} ${METRICA_LABEL[metrica] ?? metrica} ${periodo === 'SEMANAL' ? 'na semana' : 'no mês'}`;

  return (
    <Assistente
      onCancelar={onCancelar}
      rotuloConcluir={inicial ? 'SALVAR DESAFIO' : 'CRIAR DESAFIO'}
      onConcluir={salvar}
      ocupado={salvando}
      aviso={aviso}
      previa={<PreviaMissao icone={icone} titulo={titulo} descricao={descricao} pontos={pontosN >= 0 ? pontosN : null} selo={`${periodo === 'SEMANAL' ? 'Semanal' : 'Mensal'} · ${resumoMeta}`} />}
      etapas={[
        {
          chave: 'meta',
          titulo: 'Período e meta',
          descricao: 'O que o adolescente precisa fazer. O app mede essas ações sozinho.',
          validar: validarMeta,
          conteudo: (
            <>
              <View style={{ gap: 8 }}>
                <RotuloCampo texto="Período" />
                <OpcoesUnica rotulo="Período" opcoes={[{ valor: 'SEMANAL', rotulo: 'Semanal' }, { valor: 'MENSAL', rotulo: 'Mensal' }]} valor={periodo} onChange={(v) => v && setPeriodo(v as any)} />
              </View>
              <View style={{ gap: 8 }}>
                <RotuloCampo texto="Ação medida" />
                <OpcoesUnica rotulo="Ação medida" opcoes={opcoes(METRICAS)} valor={metrica} onChange={(v) => v && setMetrica(v)} />
              </View>
              {metrica === 'DIAS_FONTE_NUTRIENTE' && (
                <View style={{ gap: 8 }}>
                  <RotuloCampo texto="Nutriente" />
                  <OpcoesUnica rotulo="Nutriente" opcoes={opcoes(NUTRIENTES_DESAFIO)} valor={nutriente} onChange={(v) => v && setNutriente(v)} />
                </View>
              )}
              {!!extra && (
                <CampoNumero rotulo={extra.rotulo} ajuda={`Entre ${extra.min} e ${extra.max}${extra.obrigatorio ? '' : ' (vazio = meta padrão do app)'}.`} valor={valor} onChange={setValor} />
              )}
              <CampoNumero rotulo="Meta (quantas vezes)" ajuda={METRICA_DIAS.has(metrica) ? `Máximo de ${limite} dias neste período.` : undefined} valor={alvo} onChange={setAlvo} max={4} />
              <AvisoPainel tom="info" texto={`Resumo: ${resumoMeta}.`} />
            </>
          ),
        },
        {
          chave: 'texto',
          titulo: 'Ícone e texto',
          descricao: 'O que o adolescente vê. Linguagem curta, sem cobrança.',
          validar: validarTexto,
          conteudo: (
            <>
              <SeletorIconeMissao valor={icone} onChange={setIcone} />
              <CampoTexto rotulo="Título" obrigatorio value={titulo} onChangeText={setTitulo} placeholder="Ex.: Semana hidratada" maxLength={60} ajuda={`${titulo.length}/60`} />
              <CampoTexto rotulo="Descrição" obrigatorio value={descricao} onChangeText={setDescricao} placeholder="Ex.: Bata sua meta de água em 5 dias da semana." multilinha maxLength={160} ajuda={`${descricao.length}/160`} />
            </>
          ),
        },
        {
          chave: 'recompensa',
          titulo: 'Recompensa',
          descricao: 'Pontos que o adolescente ganha ao completar a meta. Confira a prévia antes de salvar.',
          validar: validarPontos,
          conteudo: <CampoNumero rotulo="Pontos de recompensa" ajuda="Entre 0 e 1000." valor={pontos} onChange={setPontos} max={4} />,
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------- conquista / marco

const CRITERIOS = Object.keys(CRITERIO_LABEL).map((k) => ({ chave: k, label: CRITERIO_LABEL[k] }));
const ROTULO_CATEGORIA = { conquista: 'Conquista', marco: 'Marco', insignia: 'Insígnia' } as const;

export function FormConquista({ inicial, onSalvo, onCancelar }: { inicial?: InsigniaPainel | null; onSalvo: () => void; onCancelar: () => void }) {
  const s = useEstilos(criarEstilos);
  const { tema } = useTemaPainel();
  const ehInsignia = inicial?.categoria === 'insignia';
  const [categoria, setCategoria] = useState<'conquista' | 'marco'>(inicial?.categoria === 'marco' ? 'marco' : 'conquista');
  const [nome, setNome] = useState(inicial?.nome ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [icone, setIcone] = useState(inicial?.icone ?? 'ribbon');
  const [tipo, setTipo] = useState(inicial?.tipo ?? 'licoes');
  const [min, setMin] = useState(String(inicial?.min ?? 5));
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const minN = parseInt(min, 10);

  async function salvar() {
    setSalvando(true);
    setAviso(null);
    try {
      await salvarInsignia({ id: inicial?.id ?? null, categoria: ehInsignia ? 'insignia' : categoria, nome, descricao, icone, tipo, min: minN });
      onSalvo();
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
    } finally {
      setSalvando(false);
    }
  }

  const categoriaFinal = ehInsignia ? 'insignia' : categoria;
  return (
    <Assistente
      onCancelar={onCancelar}
      rotuloConcluir={inicial ? 'SALVAR' : 'CRIAR'}
      onConcluir={salvar}
      ocupado={salvando}
      aviso={aviso}
      previa={
        <PreviaConquista
          icone={ehInsignia ? 'ribbon' : icone}
          nome={nome}
          descricao={descricao}
          categoria={ROTULO_CATEGORIA[categoriaFinal]}
          meta={`Meta: ${minN >= 1 ? minN : '?'} ${CRITERIO_LABEL[tipo] ?? tipo}`}
        />
      }
      etapas={[
        {
          chave: 'tipo',
          titulo: ehInsignia ? 'Insígnia' : 'Tipo e ícone',
          descricao: ehInsignia ? 'Insígnia com arte exclusiva: aqui você ajusta nome, texto e meta. A arte é do app.' : 'Conquista = ação comum. Marco = grande progresso, aparece com destaque.',
          conteudo: ehInsignia ? (
            <AvisoPainel tom="info" texto="A arte desta insígnia vem do app e não muda por aqui. Continue para editar o texto e a meta." />
          ) : (
            <>
              {!inicial && (
                <View style={{ gap: 8 }}>
                  <RotuloCampo texto="Tipo" />
                  <OpcoesUnica rotulo="Tipo" opcoes={[{ valor: 'conquista', rotulo: 'Conquista', icone: 'ribbon-outline' }, { valor: 'marco', rotulo: 'Marco', icone: 'flag-outline' }]} valor={categoria} onChange={(v) => v && setCategoria(v as any)} />
                </View>
              )}
              <View style={{ gap: 8 }}>
                <RotuloCampo texto="Ícone" />
                <View style={s.icones} accessibilityRole="radiogroup">
                  {ICONES_CONQUISTA.map((n) => (
                    <Pressable key={n} onPress={() => setIcone(n)} accessibilityRole="radio" accessibilityState={{ checked: icone === n }} accessibilityLabel={`Ícone ${n}`} style={[s.icone, icone === n && s.iconeAtivo]}>
                      <Ionicons name={n as any} size={22} color={icone === n ? tema.chipAtivoTexto : tema.textoSuave} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ),
        },
        {
          chave: 'texto',
          titulo: 'Nome e descrição',
          descricao: 'O que aparece no perfil do adolescente.',
          validar: () => (!nome.trim() ? 'Informe o nome.' : null),
          conteudo: (
            <>
              <CampoTexto rotulo="Nome" obrigatorio value={nome} onChangeText={setNome} placeholder="Ex.: Cozinheiro de primeira" maxLength={40} ajuda={`${nome.length}/40`} />
              <CampoTexto rotulo="Descrição (como ganhar)" value={descricao} onChangeText={setDescricao} placeholder="Ex.: Concluiu 5 lições." multilinha maxLength={120} ajuda={`${descricao.length}/120`} />
            </>
          ),
        },
        {
          chave: 'meta',
          titulo: 'Quando ganha',
          descricao: 'O adolescente ganha sozinho ao atingir a meta.',
          validar: () => (!(minN >= 1) ? 'A meta precisa ser 1 ou mais.' : null),
          conteudo: (
            <>
              <View style={{ gap: 8 }}>
                <RotuloCampo texto="Ação contada" />
                <OpcoesUnica rotulo="Ação contada" opcoes={opcoes(CRITERIOS)} valor={tipo} onChange={(v) => v && setTipo(v)} />
              </View>
              <CampoNumero rotulo="Meta (quantidade)" valor={min} onChange={setMin} />
            </>
          ),
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------- desafio diário (regra pronta)

export function FormDesafioDiario({ inicial, onSalvo, onCancelar }: { inicial?: DesafioDiarioCustom | null; onSalvo: () => void; onCancelar: () => void }) {
  const regraInicial = REGRAS_DIARIAS.find((r) => r.chave === inicial?.regra.regra) ?? REGRAS_DIARIAS[0];
  const [chave, setChave] = useState<string>(regraInicial.chave);
  const regra = REGRAS_DIARIAS.find((r) => r.chave === chave) ?? REGRAS_DIARIAS[0];
  const [valor, setValor] = useState(String((regraInicial.campo && inicial?.regra?.[regraInicial.campo]) ?? regraInicial.padrao));
  const [selecao, setSelecao] = useState<string>((regraInicial.seletor && inicial?.regra?.[regraInicial.seletor.campo]) ?? regraInicial.seletor?.opcoes[0]?.chave ?? '');
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '');
  const [icone, setIcone] = useState(inicial?.icone ? resolverIconeMissao(inicial.icone) : ICONE_MISSAO_PADRAO);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);
  const n = parseInt(valor, 10);

  function trocarRegra(nova: string) {
    const r = REGRAS_DIARIAS.find((x) => x.chave === nova);
    setChave(nova);
    if (r) {
      setValor(String(r.padrao));
      setSelecao(r.seletor?.opcoes[0]?.chave ?? '');
    }
  }

  const validarRegra = () => {
    if (regra.campo && !(n >= regra.min && n <= regra.max)) return `Para este tipo, use um valor entre ${regra.min} e ${regra.max}.`;
    if (regra.seletor && !selecao) return `Escolha: ${regra.seletor.rotulo.toLowerCase()}.`;
    return null;
  };

  async function salvar() {
    const regraFinal: Record<string, any> = { regra: regra.chave };
    if (regra.campo) regraFinal[regra.campo] = n;
    if (regra.seletor) regraFinal[regra.seletor.campo] = selecao;
    setSalvando(true);
    setAviso(null);
    try {
      await salvarDiarioCustom({ codigo: inicial?.codigo ?? null, titulo, descricao, icone, regra: regraFinal as DesafioDiarioCustom['regra'], ativa: inicial?.ativa ?? true });
      onSalvo();
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
    } finally {
      setSalvando(false);
    }
  }

  const sel = regra.seletor?.opcoes.find((o) => o.chave === selecao)?.label;
  const resumo = [regra.label, sel, regra.campo ? `${n >= 0 ? n : '?'} ${regra.unidade}` : null].filter(Boolean).join(' · ');

  return (
    <Assistente
      onCancelar={onCancelar}
      rotuloConcluir={inicial ? 'SALVAR DESAFIO' : 'CRIAR DESAFIO'}
      onConcluir={salvar}
      ocupado={salvando}
      aviso={aviso}
      previa={<PreviaMissao icone={icone} titulo={titulo} descricao={descricao} pontos={null} selo={`Desafio do dia · ${resumo}`} />}
      etapas={[
        {
          chave: 'regra',
          titulo: 'O que medir',
          descricao: 'Escolha uma ação que o app já mede automaticamente. Os pontos seguem o padrão do tipo.',
          validar: validarRegra,
          conteudo: (
            <>
              <OpcoesUnica rotulo="Tipo de desafio" opcoes={REGRAS_DIARIAS.map((r) => ({ valor: r.chave, rotulo: r.label }))} valor={chave} onChange={(v) => v && trocarRegra(v)} />
              {regra.seletor && (
                <View style={{ gap: 8 }}>
                  <RotuloCampo texto={regra.seletor.rotulo} />
                  <OpcoesUnica rotulo={regra.seletor.rotulo} opcoes={opcoes(regra.seletor.opcoes)} valor={selecao} onChange={(v) => v && setSelecao(v)} />
                </View>
              )}
              {regra.campo && <CampoNumero rotulo={`Quantidade (${regra.unidade})`} ajuda={`Entre ${regra.min} e ${regra.max}.`} valor={valor} onChange={setValor} />}
            </>
          ),
        },
        {
          chave: 'texto',
          titulo: 'Ícone e texto',
          descricao: 'O que o adolescente vê no desafio do dia. Confira na prévia.',
          validar: () => (!titulo.trim() || !descricao.trim() ? 'Preencha o título e a descrição.' : null),
          conteudo: (
            <>
              <SeletorIconeMissao valor={icone} onChange={setIcone} />
              <CampoTexto rotulo="Título" obrigatorio value={titulo} onChangeText={setTitulo} placeholder="Ex.: Dia de muita água" maxLength={60} ajuda={`${titulo.length}/60`} />
              <CampoTexto rotulo="Descrição" obrigatorio value={descricao} onChangeText={setDescricao} placeholder="Ex.: Beba 80% da sua meta de água hoje." multilinha maxLength={160} ajuda={`${descricao.length}/160`} />
            </>
          ),
        },
      ]}
    />
  );
}

// ---------------------------------------------------------------- pontos de um diário do catálogo base

export function FormPontosDiario({ inicial, onSalvo, onCancelar }: { inicial: DesafioDiario; onSalvo: () => void; onCancelar: () => void }) {
  const s = useEstilos(criarEstilos);
  const { tema } = useTemaPainel();
  const [pontos, setPontos] = useState(String(inicial.pontos));
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<Aviso>(null);

  async function salvar() {
    const n = parseInt(pontos, 10);
    if (!(n >= 0 && n <= 1000)) return setAviso({ tom: 'aviso', texto: 'Pontos entre 0 e 1000.' });
    setSalvando(true);
    setAviso(null);
    try {
      await definirPontosDiario(inicial.ref, n);
      onSalvo();
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: e?.message ?? '' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={s.formSimples}>
      <View style={{ gap: 2 }}>
        <AppText style={s.tituloForm}>Pontos de “{inicial.titulo}”</AppText>
        <AppText style={s.dica}>Vale para todas as missões deste tipo no sorteio do dia. O texto de cada missão vem das regras do app.</AppText>
      </View>
      <CampoNumero rotulo="Pontos de recompensa" ajuda="Entre 0 e 1000." valor={pontos} onChange={setPontos} max={4} />
      {!!aviso && <AvisoPainel tom={aviso.tom} texto={aviso.texto} onFechar={() => setAviso(null)} />}
      <View style={s.botoes}>
        <AppButton label="CANCELAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={salvando} onPress={onCancelar} style={s.botao} />
        <AppButton label={salvando ? 'SALVANDO…' : 'SALVAR PONTOS'} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} disabled={salvando} onPress={salvar} style={s.botao} />
      </View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  formSimples: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.destaqueTexto, padding: 16, gap: 14 },
  tituloForm: { fontFamily: typography.bold, fontSize: 16, color: t.texto },
  dica: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, lineHeight: 17 },
  botoes: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  icones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  icone: { width: ALVO_TOQUE, height: ALVO_TOQUE, borderRadius: 12, borderWidth: t.borda, borderColor: t.chipBorda, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card },
  iconeAtivo: { borderColor: t.chipAtivoFundo, backgroundColor: t.chipAtivoFundo },
  // prévia (cores do app do adolescente)
  pCard: { flexDirection: 'row', gap: 12, backgroundColor: corApp.cartao, borderRadius: 16, borderWidth: 2, borderColor: corApp.borda, padding: 12, alignItems: 'flex-start' },
  pIcone: { width: 48, height: 48, borderRadius: 24, backgroundColor: corApp.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  pSelo: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: corApp.destaqueSuave },
  pSeloTexto: { fontFamily: typography.semiBold, fontSize: 10, color: corApp.texto },
  pTitulo: { fontFamily: typography.bold, fontSize: 15, color: corApp.texto },
  pTexto: { fontFamily: typography.regular, fontSize: 12, lineHeight: 17, color: corApp.texto },
  pVazio: { color: corApp.apoio, fontStyle: 'italic' },
  pRodape: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pBarra: { flex: 1, height: 8, borderRadius: 4, backgroundColor: corApp.borda, overflow: 'hidden' },
  pBarraCheia: { width: '35%', height: 8, borderRadius: 4, backgroundColor: corApp.destaque },
  pPontos: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: corApp.destaque },
  pPontosTexto: { fontFamily: typography.bold, fontSize: 12, color: corApp.texto },
  pMedalha: { width: 64, height: 64, borderRadius: 32, backgroundColor: corApp.destaque, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: corApp.destaqueSuave },
  pMeta: { fontFamily: typography.semiBold, fontSize: 11, color: corApp.apoio },
}) as const;
