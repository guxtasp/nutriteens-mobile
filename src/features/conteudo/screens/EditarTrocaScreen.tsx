// src/features/conteudo/screens/EditarTrocaScreen.tsx
// Criar (sem trocaId) ou editar uma alternativa (troca).
// Editar: só a justificativa (o que o adolescente ganha), a dica prática e "rápido de levar".
// A categoria, o alimento de destino e o texto "o que muda" são definidos ao criar.
// Criar: categoria, alimento da alternativa, origem (opcional), refeições (opcional) e o texto.
// A nova alternativa nasce em rascunho e segue para a aprovação da nutricionista.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { LabeledInput } from '../../../shared/ui/LabeledInput';
import { typography } from '../../../shared/theme/typography';
import type { ConfigPainel } from '../../../shared/painel/types';
import { buscarTrocaEditavel, criarTroca, salvarTroca, type TrocaEditavel } from '../services/edicaoService';
import { SeletorAlimento } from '../components/SeletorAlimento';
import { MAX_DICA, MAX_FRASE, mensagemErroTroca, validarNovaTroca, validarTroca } from '../utils/trocaEdicao';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao, BarraSalvar, campoMultilinha } from '../components/CamposEdicao';
import { CATEGORIAS_TROCA, CONTEXTO_CATEGORIA, ROTULO_CATEGORIA, type CategoriaTroca } from '../../adolescente/trocas/utils/trocas';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = { config: ConfigPainel; route: { params?: { trocaId?: string; origem?: string } } };
const REFEICOES: { chave: string; rotulo: string }[] = [
  { chave: 'CAFE_DA_MANHA', rotulo: 'Café da manhã' },
  { chave: 'LANCHE_MANHA', rotulo: 'Lanche da manhã' },
  { chave: 'ALMOCO', rotulo: 'Almoço' },
  { chave: 'LANCHE_TARDE', rotulo: 'Lanche da tarde' },
  { chave: 'JANTAR', rotulo: 'Jantar' },
  { chave: 'CEIA', rotulo: 'Ceia' },
];
type AlimentoSel = { id: string; nome: string };

export default function EditarTrocaScreen({ config, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const trocaId = route.params?.trocaId;
  const origemTela = route.params?.origem;
  const novo = !trocaId;
  const navigation = useNavigation<any>();
  const [papel, setPapel] = useState<Papel | null>(null);
  const [original, setOriginal] = useState<TrocaEditavel | null>(null);
  const [frase, setFrase] = useState('');
  const [dica, setDica] = useState('');
  const [rapida, setRapida] = useState(false);
  const [categoriaNova, setCategoriaNova] = useState<CategoriaTroca | null>(null);
  const [origemAlimento, setOrigemAlimento] = useState<AlimentoSel | null>(null);
  const [destinoAlimento, setDestinoAlimento] = useState<AlimentoSel | null>(null);
  const [refeicoes, setRefeicoes] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(!novo);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const carregar = useCallback(async () => {
    if (!trocaId) return;
    try {
      const t = await buscarTrocaEditavel(trocaId);
      setOriginal(t);
      setFrase(t.frase);
      setDica(t.dica);
      setRapida(t.rapida);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível abrir a alternativa.');
    } finally {
      setCarregando(false);
    }
  }, [trocaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function salvar() {
    setErro(null);
    setMsg(null);
    if (novo) {
      const problema = validarNovaTroca({ categoria: categoriaNova, destinoId: destinoAlimento?.id ?? null, origemId: origemAlimento?.id ?? null, frase, dica });
      if (problema) return setErro(problema);
      setOcupado(true);
      try {
        const id = await criarTroca({
          categoria: categoriaNova as string,
          origemId: origemAlimento?.id ?? null,
          destinoId: destinoAlimento!.id,
          tiposRefeicao: refeicoes,
          frase,
          dica,
          rapida,
        });
        navigation.replace('ConteudoDetalhe', { tipo: 'TROCA', conteudoId: id, origem: origemTela });
      } catch (e: any) {
        setErro(mensagemErroTroca(e));
      } finally {
        setOcupado(false);
      }
      return;
    }
    const problema = validarTroca({ frase, dica });
    if (problema) return setErro(problema);
    setOcupado(true);
    try {
      await salvarTroca(trocaId!, { frase, dica, rapida });
      await carregar();
      setMsg('Alternativa salva.');
    } catch (e: any) {
      setErro(mensagemErroTroca(e));
    } finally {
      setOcupado(false);
    }
  }

  function alternarRefeicao(chave: string) {
    setRefeicoes((r) => (r.includes(chave) ? r.filter((x) => x !== chave) : [...r, chave]));
  }

  const categoria = (novo ? categoriaNova : original?.categoria) as CategoriaTroca | null | undefined;
  const rotulo = categoria ? ROTULO_CATEGORIA[categoria] ?? categoria : '';

  return (
    <PainelLayout config={config} titulo={novo ? 'Nova alternativa' : 'Editar alternativa'} subtitulo={novo ? 'Uma troca saudável para o módulo Comer' : original ? `${rotulo} → ${original.destinoNome}` : undefined} voltar>
      {!novo && carregando ? (
        <EstadoCarregando />
      ) : !novo && !original ? (
        <EstadoErro mensagem={erro ?? 'Alternativa não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          {novo ? (
            <View style={styles.contexto}>
              <AppText style={styles.contextoTexto}>A alternativa nasce como rascunho. Depois de salvar, envie para a aprovação da nutricionista: só alternativas publicadas aparecem para o adolescente.</AppText>
            </View>
          ) : (
            <AvisoEdicao papel={papel} />
          )}

          {novo && (
            <CartaoSecao titulo="Qual troca?" subtitulo="Categoria do que o adolescente quer comer e o alimento que entra no lugar" ajuda="Categoria = o tipo de item de pacote que a troca substitui (ex.: Bebidas). A alternativa é o alimento do catálogo que será sugerido. A origem é opcional: deixe em branco para valer para toda a categoria.">
              <View style={{ gap: 6 }}>
                <AppText style={styles.rotulo}>Categoria</AppText>
                <View style={styles.linha}>
                  {CATEGORIAS_TROCA.map((c) => (
                    <Pressable key={c} onPress={() => setCategoriaNova(c)} accessibilityRole="button" style={[styles.chip, categoriaNova === c && styles.chipOn]}>
                      <AppText style={[styles.chipTexto, categoriaNova === c && { color: tema.botaoTexto }]}>{ROTULO_CATEGORIA[c]}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
              <SeletorAlimento rotulo="Alternativa (o que entra no lugar)" escolhido={destinoAlimento} onEscolher={setDestinoAlimento} />
              <SeletorAlimento rotulo="Em vez de (opcional)" dica="Deixe em branco para a troca valer para qualquer item da categoria." escolhido={origemAlimento} onEscolher={setOrigemAlimento} opcional />
              <View style={{ gap: 6 }}>
                <AppText style={styles.rotulo}>Em quais refeições? (opcional)</AppText>
                <AppText style={styles.contador}>Sem nenhuma marcada, vale para qualquer refeição.</AppText>
                <View style={styles.linha}>
                  {REFEICOES.map((r) => (
                    <Pressable key={r.chave} onPress={() => alternarRefeicao(r.chave)} accessibilityRole="button" style={[styles.chip, refeicoes.includes(r.chave) && styles.chipOn]}>
                      <AppText style={[styles.chipTexto, refeicoes.includes(r.chave) && { color: tema.botaoTexto }]}>{r.rotulo}</AppText>
                    </Pressable>
                  ))}
                </View>
              </View>
            </CartaoSecao>
          )}

          <CartaoSecao titulo="Justificativa" subtitulo="É o que o adolescente lê ao tocar na alternativa" ajuda="O adolescente vê três blocos: 'O que muda' (texto fixo da categoria, abaixo), 'O que você ganha' (a justificativa) e 'Dica pra fazer'. Escreva em linguagem simples, sem julgar e sem falar de calorias.">
            <View style={styles.contexto}>
              <AppText style={styles.contextoTitulo}>O que muda (fixo da categoria{rotulo ? ` ${rotulo}` : ''})</AppText>
              <AppText style={styles.contextoTexto}>{categoria ? CONTEXTO_CATEGORIA[categoria] : 'Escolha a categoria acima para ver o texto fixo.'}</AppText>
            </View>

            <LabeledInput label={`O que você ganha com ${novo ? destinoAlimento?.nome ?? 'a alternativa' : original?.destinoNome}`} value={frase} onChangeText={setFrase} multiline maxLength={MAX_FRASE} style={campoMultilinha} />
            <AppText style={styles.contador}>{frase.trim().length}/{MAX_FRASE}</AppText>

            <LabeledInput label="Dica pra fazer (opcional)" value={dica} onChangeText={setDica} multiline maxLength={MAX_DICA} style={{ minHeight: 72, textAlignVertical: 'top' }} />
            <AppText style={styles.contador}>{dica.trim().length}/{MAX_DICA}</AppText>

            <View style={{ gap: 6 }}>
              <AppText style={styles.rotulo}>Rápido de levar?</AppText>
              <View style={styles.linha}>
                {[{ v: true, l: 'Sim' }, { v: false, l: 'Não' }].map((o) => (
                  <Pressable key={o.l} onPress={() => setRapida(o.v)} accessibilityRole="button" style={[styles.chip, rapida === o.v && styles.chipOn]}>
                    <AppText style={[styles.chipTexto, rapida === o.v && { color: tema.botaoTexto }]}>{o.l}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          </CartaoSecao>

          <BarraSalvar rotulo={novo ? 'CRIAR ALTERNATIVA' : 'SALVAR ALTERNATIVA'} ocupado={ocupado} onSalvar={salvar} onCancelar={() => navigation.goBack()} erro={erro} mensagem={msg} />
        </>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  rotulo: { fontFamily: typography.regular, fontSize: 14, color: t.texto },
  contador: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, textAlign: 'right', marginTop: -2 },
  contexto: { backgroundColor: t.superficieSuave, borderRadius: 12, padding: 12, gap: 2 },
  contextoTitulo: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  contextoTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: t.textoCorpo },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, justifyContent: 'center', backgroundColor: t.card },
  chipOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
}) as const;
