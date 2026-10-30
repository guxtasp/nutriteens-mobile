// src/features/conteudo/components/PassoEditor.tsx
// Formulário de UM passo da lição, com um editor por formato de exercício. O estado fica na
// tela (EditarLicaoScreen); aqui só se edita o passo recebido e se devolve o novo por onChange.
// As estruturas geradas seguem o seed (ver utils/passosEdicao.ts).
import React from 'react';
import { Pressable, View } from 'react-native';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { AppText } from '../../../shared/ui/AppText';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { typography } from '../../../shared/theme/typography';
import { ROTULO_FORMATO } from '../utils/descreverQuestao';
import { campoMultilinha } from './CamposEdicao';
import { LIMITES, parVazios, type OpcaoPasso, type PassoEdicao } from '../utils/passosEdicao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = {
  passo: PassoEdicao;
  indice: number;
  total: number;
  erros: string[];
  onChange: (p: PassoEdicao) => void;
  onMover: (dir: -1 | 1) => void;
  onRemover: () => void;
  /** true: sem o cartão/cabeçalho próprio (usado dentro do BlocoPasso) */
  embutido?: boolean;
};

const AJUDA: Record<string, string> = {
  cartao: 'Cartão de ensino, sem nota: um título e um texto curto para o adolescente ler.',
  multipla_escolha: 'Pergunta com uma única resposta certa. Toque no círculo para marcar a correta.',
  verdadeiro_falso: 'Afirmação que o adolescente classifica como verdadeira ou falsa.',
  completar: 'Frase com uma lacuna. As palavras abaixo formam o banco; marque a que completa certo.',
  ordene: 'Escreva os itens NA ORDEM CERTA. O app embaralha para o adolescente ordenar.',
  associe: 'Pares que o adolescente liga: esquerda com direita.',
  classifique: 'O adolescente coloca cada item na coluna certa.',
  memoria: 'Jogo da memória com pares (sem nota): o adolescente acha cada par.',
  prato: 'Monte seu prato (sem nota): a bandeja de alimentos e a missão que libera o CONTINUAR.',
  enquete: 'Pergunta sem certo ou errado (sem nota), com uma mensagem neutra no final.',
  meta: 'Plano "se… então…" (sem nota): o adolescente escolhe uma meta possível.',
};

const GRUPOS_SUGERIDOS = ['cereal', 'tuberculo', 'leguminosa', 'proteina', 'vegetal', 'ultraprocessado'];

function Mini({ label, onPress, desativado, perigo }: { label: string; onPress: () => void; desativado?: boolean; perigo?: boolean }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.mini, perigo && styles.miniPerigo, desativado && { opacity: 0.35 }]}
    >
      <AppText style={[styles.miniTexto, perigo && { color: tema.erro }]}>{label}</AppText>
    </Pressable>
  );
}

function Marca({ ligada, onPress, rotulo, redonda = true }: { ligada: boolean; onPress: () => void; rotulo: string; redonda?: boolean }) {
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: ligada }}
      accessibilityLabel={rotulo}
      style={[styles.marca, !redonda && { borderRadius: 8 }, ligada && styles.marcaOn]}
    >
      {ligada && <AppText style={styles.marcaCheck}>✓</AppText>}
    </Pressable>
  );
}

function Chip({ texto, ligado, onPress }: { texto: string; ligado: boolean; onPress: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.chip, ligado && styles.chipOn]}>
      <AppText style={[styles.chipTexto, ligado && { color: tema.botaoTexto }]}>{texto}</AppText>
    </Pressable>
  );
}

const trocar = <T,>(lista: T[], i: number, novo: T): T[] => lista.map((x, k) => (k === i ? novo : x));
const tirar = <T,>(lista: T[], i: number): T[] => lista.filter((_, k) => k !== i);

export default function PassoEditor({ passo, indice, total, erros, onChange, onMover, onRemover, embutido }: Props) {
  const styles = useEstilos(criarEstilos);
  const set = (patch: Partial<PassoEdicao>) => onChange({ ...passo, ...patch });
  const extra = passo.dadosExtra ?? {};
  const setExtra = (patch: Record<string, any>) => onChange({ ...passo, dadosExtra: { ...extra, ...patch } });
  const opcoes = passo.opcoes;
  const setOpcao = (i: number, p: Partial<OpcaoPasso>) => set({ opcoes: trocar(opcoes, i, { ...opcoes[i], ...p }) });
  const marcarUnica = (i: number) => set({ opcoes: opcoes.map((o, k) => ({ ...o, correta: k === i })) });
  const f = passo.formato;

  const campoOpcoes = (opts: { rotulo: string; max: number; unica?: boolean; novaCorreta?: boolean; reordenar?: boolean }) => (
    <View style={{ gap: 6 }}>
      <AppText style={styles.rotulo}>{opts.rotulo}</AppText>
      {opcoes.map((o, i) => (
        <View key={i} style={styles.linha}>
          {opts.unica && <Marca ligada={o.correta} onPress={() => marcarUnica(i)} rotulo="Resposta correta" />}
          {opts.reordenar && <AppText style={styles.numero}>{i + 1}.</AppText>}
          <View style={{ flex: 1, minWidth: 0 }}>
            <LabeledInput label="" value={o.texto} onChangeText={(t) => setOpcao(i, { texto: t })} maxLength={160} />
          </View>
          {opts.reordenar && (
            <>
              <Mini label="↑" desativado={i === 0} onPress={() => set({ opcoes: moverItem(opcoes, i, -1) })} />
              <Mini label="↓" desativado={i === opcoes.length - 1} onPress={() => set({ opcoes: moverItem(opcoes, i, 1) })} />
            </>
          )}
          <Mini label="✕" perigo desativado={opcoes.length <= 2} onPress={() => set({ opcoes: tirar(opcoes, i) })} />
        </View>
      ))}
      <View style={styles.linhaBotoes}>
        <Mini
          label="+ ADICIONAR"
          desativado={opcoes.length >= opts.max}
          onPress={() => set({ opcoes: [...opcoes, { texto: '', correta: opts.novaCorreta ?? false }] })}
        />
      </View>
    </View>
  );

  const explicacao = (chave: 'explicacao' | 'feedback', rotulo: string) => (
    <LabeledInput
      label={rotulo}
      value={String(extra[chave] ?? '')}
      onChangeText={(t) => setExtra({ [chave]: t })}
      multiline
      style={{ minHeight: 64, textAlignVertical: 'top' }}
    />
  );

  const conteudo = (
    <>
      <LabeledInput
        label={f === 'cartao' ? 'Título do cartão' : 'Enunciado'}
        value={passo.enunciado}
        onChangeText={(t) => set({ enunciado: t })}
        multiline
        style={{ minHeight: 64, textAlignVertical: 'top' }}
      />

      {f === 'cartao' && (
        <LabeledInput label="Texto do cartão" value={String(extra.texto ?? '')} onChangeText={(t) => setExtra({ texto: t })} multiline style={campoMultilinha} />
      )}

      {f === 'completar' && (
        <>
          <View style={styles.linhaBotoes}>
            <Mini
              label="INSERIR {lacuna}"
              onPress={() => !passo.enunciado.includes('{lacuna}') && set({ enunciado: `${passo.enunciado}${passo.enunciado && !passo.enunciado.endsWith(' ') ? ' ' : ''}{lacuna}` })}
            />
          </View>
          <AppText style={styles.suave}>Use {'{lacuna}'} uma vez no lugar da palavra que falta. Ex.: "A base da alimentação são alimentos {'{lacuna}'}."</AppText>
          {campoOpcoes({ rotulo: 'Banco de palavras (marque a correta)', max: LIMITES.opcoesMax, unica: true })}
        </>
      )}

      {f === 'multipla_escolha' && campoOpcoes({ rotulo: 'Alternativas (marque a correta)', max: LIMITES.opcoesMax, unica: true })}

      {f === 'verdadeiro_falso' && (
        <View style={{ gap: 6 }}>
          <AppText style={styles.rotulo}>A afirmação é:</AppText>
          <View style={styles.linhaBotoes}>
            {opcoes.map((o, i) => (
              <Chip key={i} texto={o.texto} ligado={o.correta} onPress={() => marcarUnica(i)} />
            ))}
          </View>
        </View>
      )}

      {f === 'ordene' && campoOpcoes({ rotulo: 'Itens, na ordem correta', max: LIMITES.ordeneMax, novaCorreta: true, reordenar: true })}

      {(f === 'enquete' || f === 'meta') && campoOpcoes({ rotulo: 'Opções (sem certo ou errado)', max: LIMITES.opcoesMax })}

      {(f === 'associe' || f === 'memoria') && (
        <View style={{ gap: 6 }}>
          <AppText style={styles.rotulo}>Pares</AppText>
          {(Array.isArray(extra.pares) ? extra.pares : parVazios(0)).map((par: any, i: number, todos: any[]) => (
            <View key={i} style={styles.linha}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LabeledInput label="" placeholder="Esquerda" value={par.esquerda ?? ''} maxLength={80} onChangeText={(t) => setExtra({ pares: trocar(todos, i, { ...par, esquerda: t }) })} />
              </View>
              <AppText style={styles.numero}>↔</AppText>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LabeledInput label="" placeholder="Direita" value={par.direita ?? ''} maxLength={80} onChangeText={(t) => setExtra({ pares: trocar(todos, i, { ...par, direita: t }) })} />
              </View>
              <Mini label="✕" perigo desativado={todos.length <= 2} onPress={() => setExtra({ pares: tirar(todos, i) })} />
            </View>
          ))}
          <View style={styles.linhaBotoes}>
            <Mini
              label="+ ADICIONAR PAR"
              desativado={(extra.pares ?? []).length >= LIMITES.paresMax}
              onPress={() => setExtra({ pares: [...(extra.pares ?? []), { id: `p${(extra.pares ?? []).length + 1}`, esquerda: '', direita: '' }] })}
            />
          </View>
        </View>
      )}

      {f === 'classifique' && <EditorClassifique passo={passo} set={set} setExtra={setExtra} setOpcao={setOpcao} />}

      {f === 'prato' && <EditorPrato extra={extra} setExtra={setExtra} />}

      {['multipla_escolha', 'verdadeiro_falso', 'completar', 'ordene', 'associe', 'classifique'].includes(f) &&
        explicacao('explicacao', 'Explicação (aparece quando o adolescente erra) — opcional')}
      {['enquete', 'meta', 'memoria', 'prato'].includes(f) && explicacao('feedback', 'Mensagem ao concluir — opcional')}

      {erros.length > 0 && (
        <View style={styles.erros}>
          {erros.map((e, i) => (
            <AppText key={i} style={styles.erroTexto}>• {e}</AppText>
          ))}
        </View>
      )}
    </>
  );

  // embutido: dentro de um BlocoPasso (o bloco já tem cabeçalho colorido e os botões de mover/remover)
  if (embutido) {
    return (
      <View style={{ gap: 12 }}>
        {!!AJUDA[f] && <AppText style={styles.suave}>{AJUDA[f]}</AppText>}
        {conteudo}
      </View>
    );
  }

  return (
    <CartaoSecao
      titulo={`Passo ${indice + 1} · ${ROTULO_FORMATO[f] ?? f}`}
      ajuda={AJUDA[f]}
      direita={
        <View style={styles.linhaBotoes}>
          <Mini label="↑" desativado={indice === 0} onPress={() => onMover(-1)} />
          <Mini label="↓" desativado={indice === total - 1} onPress={() => onMover(1)} />
          <Mini label="REMOVER" perigo onPress={onRemover} />
        </View>
      }
    >
      {conteudo}
    </CartaoSecao>
  );
}

function moverItem<T>(lista: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

// ------------------------------------------------------------------ classifique
function EditorClassifique({
  passo,
  set,
  setExtra,
  setOpcao,
}: {
  passo: PassoEdicao;
  set: (p: Partial<PassoEdicao>) => void;
  setExtra: (p: Record<string, any>) => void;
  setOpcao: (i: number, p: Partial<OpcaoPasso>) => void;
}) {
  const styles = useEstilos(criarEstilos);
  const categorias: string[] = Array.isArray(passo.dadosExtra?.categorias) ? passo.dadosExtra.categorias : [];
  const opcoes = passo.opcoes;

  // renomear uma coluna leva junto os itens que estavam nela
  function renomear(i: number, novo: string) {
    const antigo = categorias[i];
    setExtraEOpcoes(trocar(categorias, i, novo), opcoes.map((o) => (o.categoria && o.categoria === antigo ? { ...o, categoria: novo } : o)));
  }
  function removerColuna(i: number) {
    const antigo = categorias[i];
    setExtraEOpcoes(tirar(categorias, i), opcoes.map((o) => (o.categoria === antigo ? { ...o, categoria: null } : o)));
  }
  function setExtraEOpcoes(cats: string[], ops: OpcaoPasso[]) {
    set({ opcoes: ops, dadosExtra: { ...passo.dadosExtra, categorias: cats } });
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>Colunas</AppText>
        {categorias.map((c, i) => (
          <View key={i} style={styles.linha}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <LabeledInput label="" placeholder={`Coluna ${i + 1}`} value={c} maxLength={40} onChangeText={(t) => renomear(i, t)} />
            </View>
            <Mini label="✕" perigo desativado={categorias.length <= 2} onPress={() => removerColuna(i)} />
          </View>
        ))}
        <View style={styles.linhaBotoes}>
          <Mini label="+ ADICIONAR COLUNA" desativado={categorias.length >= LIMITES.categoriasMax} onPress={() => setExtra({ categorias: [...categorias, ''] })} />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <AppText style={styles.rotulo}>Itens e a coluna certa de cada um</AppText>
        {opcoes.map((o, i) => (
          <View key={i} style={styles.itemClassifique}>
            <View style={styles.linha}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LabeledInput label="" placeholder="Item" value={o.texto} maxLength={80} onChangeText={(t) => setOpcao(i, { texto: t })} />
              </View>
              <Mini label="✕" perigo desativado={opcoes.length <= 2} onPress={() => set({ opcoes: tirar(opcoes, i) })} />
            </View>
            <View style={styles.linhaBotoes}>
              {categorias.filter((c) => c.trim() !== '').map((c) => (
                <Chip key={c} texto={c} ligado={o.categoria === c} onPress={() => setOpcao(i, { categoria: c, correta: true })} />
              ))}
            </View>
          </View>
        ))}
        <View style={styles.linhaBotoes}>
          <Mini label="+ ADICIONAR ITEM" desativado={opcoes.length >= LIMITES.opcoesMax * 2} onPress={() => set({ opcoes: [...opcoes, { texto: '', correta: true, categoria: null }] })} />
        </View>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ prato
function EditorPrato({ extra, setExtra }: { extra: Record<string, any>; setExtra: (p: Record<string, any>) => void }) {
  const styles = useEstilos(criarEstilos);
  const alimentos: any[] = Array.isArray(extra.alimentos) ? extra.alimentos : [];
  const criterios: any[] = Array.isArray(extra.criterios) ? extra.criterios : [];
  const gruposDaBandeja = [...new Set(alimentos.map((a) => String(a?.grupo ?? '').trim()).filter(Boolean))];

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>Bandeja de alimentos</AppText>
        {alimentos.map((a, i) => (
          <View key={i} style={styles.itemClassifique}>
            <View style={styles.linha}>
              <View style={{ width: 64 }}>
                <LabeledInput label="" placeholder="🍚" value={a.emoji ?? ''} maxLength={4} onChangeText={(t) => setExtra({ alimentos: trocar(alimentos, i, { ...a, emoji: t }) })} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <LabeledInput label="" placeholder="Nome" value={a.nome ?? ''} maxLength={40} onChangeText={(t) => setExtra({ alimentos: trocar(alimentos, i, { ...a, nome: t }) })} />
              </View>
              <Mini label="✕" perigo onPress={() => setExtra({ alimentos: tirar(alimentos, i) })} />
            </View>
            <LabeledInput label="" placeholder="Grupo (ex.: cereal, vegetal)" value={a.grupo ?? ''} maxLength={30} autoCapitalize="none" onChangeText={(t) => setExtra({ alimentos: trocar(alimentos, i, { ...a, grupo: t.trim().toLowerCase() }) })} />
            <View style={styles.linhaBotoes}>
              {GRUPOS_SUGERIDOS.map((g) => (
                <Chip key={g} texto={g} ligado={a.grupo === g} onPress={() => setExtra({ alimentos: trocar(alimentos, i, { ...a, grupo: g }) })} />
              ))}
            </View>
          </View>
        ))}
        <View style={styles.linhaBotoes}>
          <Mini label="+ ADICIONAR ALIMENTO" onPress={() => setExtra({ alimentos: [...alimentos, { nome: '', emoji: '', grupo: '' }] })} />
        </View>
      </View>

      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <LabeledInput label={`Lugares no prato (${LIMITES.capacidadeMin} a ${LIMITES.capacidadeMax})`} keyboardType="numeric" maxLength={1} value={String(extra.capacidade ?? '')} onChangeText={(t) => setExtra({ capacidade: t.replace(/\D/g, '') })} />
        </View>
        <View style={{ flex: 1 }}>
          <LabeledInput label="Mínimo de alimentos para concluir" keyboardType="numeric" maxLength={1} value={String(extra.minimoItens ?? '')} onChangeText={(t) => setExtra({ minimoItens: t.replace(/\D/g, '') })} />
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <AppText style={styles.rotulo}>Missão (critérios)</AppText>
        {gruposDaBandeja.length === 0 && <AppText style={styles.suave}>Preencha o grupo dos alimentos para escolher os grupos de cada critério.</AppText>}
        {criterios.map((c, i) => {
          const grupos: string[] = Array.isArray(c.grupos) ? c.grupos : [];
          return (
            <View key={i} style={styles.itemClassifique}>
              <View style={styles.linha}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <LabeledInput label="" placeholder="Ex.: Uma proteína" value={c.texto ?? ''} maxLength={80} onChangeText={(t) => setExtra({ criterios: trocar(criterios, i, { ...c, texto: t }) })} />
                </View>
                <Mini label="✕" perigo onPress={() => setExtra({ criterios: tirar(criterios, i) })} />
              </View>
              <View style={styles.linhaBotoes}>
                {gruposDaBandeja.map((g) => (
                  <Chip key={g} texto={g} ligado={grupos.includes(g)} onPress={() => setExtra({ criterios: trocar(criterios, i, { ...c, grupos: grupos.includes(g) ? grupos.filter((x) => x !== g) : [...grupos, g] }) })} />
                ))}
              </View>
              <View style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <LabeledInput label="Mínimo" keyboardType="numeric" maxLength={1} value={String(c.minimo ?? '')} onChangeText={(t) => setExtra({ criterios: trocar(criterios, i, { ...c, minimo: t.replace(/\D/g, '') }) })} />
                </View>
                <View style={{ flex: 1 }}>
                  <LabeledInput label="Máximo (opcional)" keyboardType="numeric" maxLength={1} value={String(c.maximo ?? '')} onChangeText={(t) => setExtra({ criterios: trocar(criterios, i, { ...c, maximo: t.replace(/\D/g, '') }) })} />
                </View>
              </View>
            </View>
          );
        })}
        <View style={styles.linhaBotoes}>
          <Mini label="+ ADICIONAR CRITÉRIO" onPress={() => setExtra({ criterios: [...criterios, { texto: '', grupos: [], minimo: '1', maximo: '' }] })} />
        </View>
      </View>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  rotulo: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linhaBotoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  numero: { fontFamily: typography.bold, fontSize: 14, color: t.texto, minWidth: 20, textAlign: 'center' },
  mini: {
    minHeight: 44, minWidth: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 2, borderColor: t.cardBorda,
    alignItems: 'center', justifyContent: 'center', backgroundColor: t.card,
  },
  miniPerigo: { borderColor: t.erro },
  miniTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  marca: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: t.cardBorda, alignItems: 'center', justifyContent: 'center', marginTop: -10 },
  marcaOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  marcaCheck: { color: t.botaoTexto, fontFamily: typography.bold, fontSize: 14 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, justifyContent: 'center', backgroundColor: t.card },
  chipOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  itemClassifique: { borderWidth: 1, borderColor: t.linhaSuave, borderRadius: 12, padding: 10, gap: 6 },
  erros: { backgroundColor: t.selos.erro.fundo + '55', borderRadius: 12, padding: 10, gap: 2 },
  erroTexto: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
}) as const;