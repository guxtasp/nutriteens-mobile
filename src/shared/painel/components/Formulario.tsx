// src/shared/painel/components/Formulario.tsx
//
// Peças de formulário do painel, iguais em todas as telas de cadastro (alimento, prato,
// produto do scanner, trilha). Antes cada tela tinha seu próprio chip/campo e algumas usavam
// o LabeledInput do app do adolescente, que não segue o tema do painel (fica ilegível no escuro).
import React from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { erroAmigavel } from '../utils/mensagemErro';

// ---------------------------------------------------------------- campo de texto

type PropsCampo = TextInputProps & {
  rotulo: string;
  /** texto de apoio abaixo do campo */
  ajuda?: string;
  /** mensagem de erro (substitui a ajuda e pinta a borda) */
  erro?: string | null;
  obrigatorio?: boolean;
  multilinha?: boolean;
};

export function CampoTexto({ rotulo, ajuda, erro, obrigatorio, multilinha, style, ...props }: PropsCampo) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.campo}>
      {!!rotulo && (
        <AppText style={styles.rotulo}>
          {rotulo}
          {obrigatorio && <AppText style={styles.obrigatorio}> *</AppText>}
        </AppText>
      )}
      <TextInput
        placeholderTextColor={tema.placeholder}
        accessibilityLabel={(rotulo || props.placeholder || '') + (obrigatorio ? ', obrigatório' : '')}
        accessibilityHint={erro ?? ajuda}
        multiline={multilinha}
        style={[styles.input, multilinha && styles.inputMulti, !!erro && styles.inputErro, style]}
        {...props}
      />
      {!!erro ? (
        <View style={styles.linhaErro}>
          <Ionicons name="alert-circle" size={14} color={tema.erro} />
          <AppText style={styles.erroTexto}>{erro}</AppText>
        </View>
      ) : !!ajuda ? (
        <AppText style={styles.ajuda}>{ajuda}</AppText>
      ) : null}
    </View>
  );
}

/**
 * Mesma interface do LabeledInput do app (label/hasError), com o visual do painel.
 * Usado nos editores de conteúdo que antes importavam o campo do adolescente.
 */
export function CampoRotulado({ label, hasError, ...props }: TextInputProps & { label: string; hasError?: boolean }) {
  return <CampoTexto rotulo={label} erro={hasError ? 'Confira este campo.' : null} {...props} />;
}

/** Rótulo de um grupo de opções (mesma tipografia do CampoTexto). */
export function RotuloCampo({ texto, obrigatorio, ajuda }: { texto: string; obrigatorio?: boolean; ajuda?: string }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={{ gap: 2 }}>
      <AppText style={styles.rotulo}>
        {texto}
        {obrigatorio && <AppText style={styles.obrigatorio}> *</AppText>}
      </AppText>
      {!!ajuda && <AppText style={styles.ajuda}>{ajuda}</AppText>}
    </View>
  );
}

// ---------------------------------------------------------------- opções (chips)

export type Opcao<T extends string> = { valor: T; rotulo: string; icone?: React.ComponentProps<typeof Ionicons>['name'] };

/** Escolha única. Com `limpavel`, tocar na opção ligada desliga. */
export function OpcoesUnica<T extends string>({
  opcoes,
  valor,
  onChange,
  limpavel,
  erro,
  rotulo,
}: {
  opcoes: Opcao<T>[];
  valor: T | null | undefined;
  onChange: (v: T | null) => void;
  limpavel?: boolean;
  erro?: boolean;
  rotulo?: string;
}) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.chips, erro && styles.blocoErro]} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
      {opcoes.map((o) => {
        const on = valor === o.valor;
        return (
          <Chip key={o.valor} rotulo={o.rotulo} icone={o.icone} ligado={on} papel="radio" onPress={() => onChange(on && limpavel ? null : o.valor)} />
        );
      })}
    </View>
  );
}

/** Escolha múltipla (marca/desmarca). */
export function OpcoesMultipla<T extends string>({
  opcoes,
  valores,
  onAlternar,
  erro,
  rotulo,
}: {
  opcoes: Opcao<T>[];
  valores: ReadonlySet<T>;
  onAlternar: (v: T) => void;
  erro?: boolean;
  rotulo?: string;
}) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={[styles.chips, erro && styles.blocoErro]} accessibilityLabel={rotulo}>
      {opcoes.map((o) => (
        <Chip key={o.valor} rotulo={o.rotulo} icone={o.icone} ligado={valores.has(o.valor)} papel="checkbox" onPress={() => onAlternar(o.valor)} />
      ))}
    </View>
  );
}

function Chip({
  rotulo,
  icone,
  ligado,
  papel,
  onPress,
}: {
  rotulo: string;
  icone?: Opcao<string>['icone'];
  ligado: boolean;
  papel: 'radio' | 'checkbox';
  onPress: () => void;
}) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={papel}
      accessibilityState={{ checked: ligado, selected: ligado }}
      accessibilityLabel={rotulo}
      style={[styles.chip, ligado && styles.chipOn]}
    >
      {ligado ? (
        <Ionicons name="checkmark" size={14} color={tema.chipAtivoTexto} />
      ) : icone ? (
        <Ionicons name={icone} size={14} color={tema.chipTexto} />
      ) : null}
      <AppText style={[styles.chipTexto, ligado && styles.chipTextoOn]}>{rotulo}</AppText>
    </Pressable>
  );
}

// ---------------------------------------------------------------- avisos de resultado

export type TomAviso = 'ok' | 'erro' | 'aviso' | 'info';
const ICONE_AVISO: Record<TomAviso, React.ComponentProps<typeof Ionicons>['name']> = {
  ok: 'checkmark-circle',
  erro: 'alert-circle',
  aviso: 'warning',
  info: 'information-circle',
};

/**
 * Faixa de resultado de uma operação ("Alimento salvo.", "Não foi possível excluir...").
 * Para `tom="erro"`, a mensagem técnica é traduzida por erroAmigavel (nunca aparece crua).
 */
export function AvisoPainel({
  tom,
  texto,
  titulo,
  acao,
  onFechar,
}: {
  tom: TomAviso;
  texto: string;
  titulo?: string;
  acao?: { rotulo: string; onPress: () => void };
  onFechar?: () => void;
}) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const cores = tom === 'ok' ? tema.selos.ok : tom === 'erro' ? tema.selos.erro : tom === 'aviso' ? tema.selos.aviso : tema.selos.info;
  const traduzido = tom === 'erro' ? erroAmigavel(texto) : null;
  const tituloFinal = titulo ?? traduzido?.titulo;
  const textoFinal = traduzido ? traduzido.texto : texto;
  return (
    <View
      style={[styles.aviso, { backgroundColor: cores.fundo, borderLeftColor: cores.texto }]}
      accessibilityRole={tom === 'erro' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={ICONE_AVISO[tom]} size={20} color={cores.texto} />
      <View style={{ flex: 1, gap: 2 }}>
        {!!tituloFinal && <AppText style={[styles.avisoTitulo, { color: cores.texto }]}>{tituloFinal}</AppText>}
        <AppText style={[styles.avisoTexto, { color: cores.texto }]}>{textoFinal}</AppText>
        {!!acao && (
          <Pressable onPress={acao.onPress} accessibilityRole="button" style={styles.avisoAcao}>
            <AppText style={[styles.avisoAcaoTexto, { color: cores.texto }]}>{acao.rotulo}</AppText>
          </Pressable>
        )}
      </View>
      {!!onFechar && (
        <Pressable onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar aviso" hitSlop={10} style={styles.avisoFechar}>
          <Ionicons name="close" size={18} color={cores.texto} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- etapas

export type Etapa = { chave: string; rotulo: string; feita: boolean };

/**
 * Indicador de etapas de um cadastro (ex.: Dados → Ingredientes → Receita). Mostra onde a
 * pessoa está e o que falta; `onIr` é opcional (quando a etapa tem para onde rolar/navegar).
 */
export function EtapasCadastro({ etapas, atual, onIr }: { etapas: Etapa[]; atual: string; onIr?: (chave: string) => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.etapas} accessibilityRole="list">
      {etapas.map((e, i) => {
        const ativa = e.chave === atual;
        const conteudo = (
          <>
            <View style={[styles.etapaBolinha, e.feita && styles.etapaFeita, ativa && !e.feita && styles.etapaAtiva]}>
              {e.feita ? (
                <Ionicons name="checkmark" size={14} color={tema.chipAtivoTexto} />
              ) : (
                <AppText style={[styles.etapaNumero, ativa && { color: tema.chipAtivoTexto }]}>{i + 1}</AppText>
              )}
            </View>
            <AppText style={[styles.etapaRotulo, (ativa || e.feita) && styles.etapaRotuloForte]} numberOfLines={1}>
              {e.rotulo}
            </AppText>
          </>
        );
        return (
          <React.Fragment key={e.chave}>
            {i > 0 && <View style={[styles.etapaLinha, etapas[i - 1].feita && styles.etapaLinhaFeita]} />}
            {onIr ? (
              <Pressable
                onPress={() => onIr(e.chave)}
                accessibilityRole="button"
                accessibilityLabel={`Etapa ${i + 1}: ${e.rotulo}${e.feita ? ', concluída' : ativa ? ', atual' : ''}`}
                style={styles.etapa}
              >
                {conteudo}
              </Pressable>
            ) : (
              <View style={styles.etapa} accessibilityLabel={`Etapa ${i + 1}: ${e.rotulo}${e.feita ? ', concluída' : ativa ? ', atual' : ''}`}>
                {conteudo}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  campo: { gap: 6 } as const,
  rotulo: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.texto } as const,
  obrigatorio: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.erro } as const,
  input: {
    minHeight: ALVO_TOQUE,
    borderWidth: t.borda,
    borderColor: t.campoBorda,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.regular,
    fontSize: fonte.corpo,
    color: t.textoCorpo,
    backgroundColor: t.card,
  } as const,
  inputMulti: { minHeight: 96, textAlignVertical: 'top' } as const,
  inputErro: { borderColor: t.erro, borderWidth: 2 } as const,
  linhaErro: { flexDirection: 'row', alignItems: 'center', gap: 4 } as const,
  erroTexto: { flex: 1, fontFamily: typography.medium, fontSize: fonte.legenda, color: t.erro } as const,
  ajuda: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, lineHeight: 17 } as const,

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as const,
  blocoErro: { borderWidth: 2, borderColor: t.erro, borderRadius: 12, padding: 6 } as const,
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: ALVO_TOQUE,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: t.borda,
    borderColor: t.chipBorda,
    backgroundColor: t.chipFundo,
  } as const,
  chipOn: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo } as const,
  chipTexto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.chipTexto } as const,
  chipTextoOn: { color: t.chipAtivoTexto } as const,

  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderLeftWidth: 4, padding: 12 } as const,
  avisoTitulo: { fontFamily: typography.bold, fontSize: fonte.apoio } as const,
  avisoTexto: { fontFamily: typography.regular, fontSize: fonte.apoio, lineHeight: 19 } as const,
  avisoAcao: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' } as const,
  avisoAcaoTexto: { fontFamily: typography.bold, fontSize: fonte.apoio, textDecorationLine: 'underline' } as const,
  avisoFechar: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' } as const,

  etapas: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 } as const,
  etapa: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: ALVO_TOQUE, paddingHorizontal: 2 } as const,
  etapaBolinha: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: t.chipBorda,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.card,
  } as const,
  etapaAtiva: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo } as const,
  etapaFeita: { backgroundColor: t.destaqueTexto, borderColor: t.destaqueTexto } as const,
  etapaNumero: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.textoSuave } as const,
  etapaRotulo: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave } as const,
  etapaRotuloForte: { fontFamily: typography.bold, color: t.texto } as const,
  etapaLinha: { width: 24, height: 2, backgroundColor: t.chipBorda, marginHorizontal: 6 } as const,
  etapaLinhaFeita: { backgroundColor: t.destaqueTexto } as const,
});
