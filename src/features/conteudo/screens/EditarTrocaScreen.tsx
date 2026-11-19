// src/features/conteudo/screens/EditarTrocaScreen.tsx
// Criar (sem trocaId) ou editar uma alternativa (troca).
// Editar: só a justificativa (o que o adolescente ganha), a dica prática e "rápido de levar".
// A categoria, o alimento de destino e o texto "o que muda" são definidos ao criar.
// Criar: categoria, alimento da alternativa, origem (opcional), refeições (opcional) e o texto.
// A nova alternativa nasce em rascunho e segue para a aprovação da nutricionista.
//
// UX: criar é um assistente em 3 etapas (Categoria → Alimentos → Texto) com a prévia do cartão
// que o adolescente lê, atualizada a cada letra. Editar mostra o texto ao lado da prévia.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { Assistente } from '../../../shared/painel/components/Assistente';
import { PreviaApp, corApp } from '../../../shared/painel/components/PreviaApp';
import { AvisoPainel, CampoTexto, OpcoesMultipla, OpcoesUnica, RotuloCampo, type TomAviso } from '../../../shared/painel/components/Formulario';
import { useModoPainel } from '../../../shared/painel/hooks/useModoPainel';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { ALVO_TOQUE } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import { buscarTrocaEditavel, criarTroca, salvarTroca, type TrocaEditavel } from '../services/edicaoService';
import { SeletorAlimento } from '../components/SeletorAlimento';
import { MAX_DICA, MAX_FRASE, mensagemErroTroca, validarNovaTroca, validarTroca } from '../utils/trocaEdicao';
import { obterPapelAtual } from '../services/conteudoService';
import type { Papel } from '../utils/regrasAprovacao';
import { AvisoEdicao } from '../components/CamposEdicao';
import { CATEGORIAS_TROCA, CONTEXTO_CATEGORIA, ROTULO_CATEGORIA, type CategoriaTroca } from '../../adolescente/trocas/utils/trocas';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

type Props = { config: ConfigPainel; route: { params?: { trocaId?: string; origem?: string } } };
const REFEICOES: { valor: string; rotulo: string }[] = [
  { valor: 'CAFE_DA_MANHA', rotulo: 'Café da manhã' },
  { valor: 'LANCHE_MANHA', rotulo: 'Lanche da manhã' },
  { valor: 'ALMOCO', rotulo: 'Almoço' },
  { valor: 'LANCHE_TARDE', rotulo: 'Lanche da tarde' },
  { valor: 'JANTAR', rotulo: 'Jantar' },
  { valor: 'CEIA', rotulo: 'Ceia' },
];
type AlimentoSel = { id: string; nome: string };

/** Aproximação do cartão de alternativa do app (módulo Comer). */
function PreviaTroca(p: { categoria: CategoriaTroca | null | undefined; origem: string | null; destino: string | null; frase: string; dica: string; rapida: boolean }) {
  const styles = useEstilos(criarEstilos);
  return (
    <PreviaApp nota="Prévia ilustrativa do cartão que o adolescente abre no módulo Comer. Só aparece no app depois de publicada.">
      <View style={styles.pTopo}>
        <View style={styles.pChip}><AppText style={styles.pChipTexto}>{p.origem ?? (p.categoria ? ROTULO_CATEGORIA[p.categoria] : 'Categoria')}</AppText></View>
        <Ionicons name="arrow-forward" size={16} color={corApp.apoio} />
        <View style={[styles.pChip, styles.pChipDestino]}><AppText style={[styles.pChipTexto, { color: corApp.texto }]}>{p.destino ?? 'Alternativa'}</AppText></View>
      </View>
      {p.rapida && (
        <View style={styles.pSelo}>
          <Ionicons name="flash" size={12} color={corApp.texto} />
          <AppText style={styles.pSeloTexto}>Rápido de levar</AppText>
        </View>
      )}
      <View style={styles.pBloco}>
        <AppText style={styles.pBlocoTitulo}>O que muda</AppText>
        <AppText style={styles.pTexto}>{p.categoria ? CONTEXTO_CATEGORIA[p.categoria] : 'Aparece quando a categoria for escolhida.'}</AppText>
      </View>
      <View style={styles.pBloco}>
        <AppText style={styles.pBlocoTitulo}>O que você ganha</AppText>
        <AppText style={[styles.pTexto, !p.frase.trim() && styles.pVazio]}>{p.frase.trim() || 'A justificativa aparece aqui.'}</AppText>
      </View>
      {!!p.dica.trim() && (
        <View style={styles.pBloco}>
          <AppText style={styles.pBlocoTitulo}>Dica pra fazer</AppText>
          <AppText style={styles.pTexto}>{p.dica.trim()}</AppText>
        </View>
      )}
    </PreviaApp>
  );
}

export default function EditarTrocaScreen({ config, route }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { largura } = useModoPainel();
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
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tom: TomAviso; texto: string } | null>(null);

  useEffect(() => { obterPapelAtual().then(setPapel); }, []);

  const carregar = useCallback(async () => {
    if (!trocaId) return;
    try {
      const t = await buscarTrocaEditavel(trocaId);
      setOriginal(t);
      setFrase(t.frase);
      setDica(t.dica);
      setRapida(t.rapida);
      setErroCarga(null);
    } catch (e: any) {
      setErroCarga(e?.message ?? 'Não foi possível abrir a alternativa.');
    } finally {
      setCarregando(false);
    }
  }, [trocaId]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function criar() {
    setAviso(null);
    const problema = validarNovaTroca({ categoria: categoriaNova, destinoId: destinoAlimento?.id ?? null, origemId: origemAlimento?.id ?? null, frase, dica });
    if (problema) return setAviso({ tom: 'aviso', texto: problema });
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
      setAviso({ tom: 'erro', texto: mensagemErroTroca(e) });
    } finally {
      setOcupado(false);
    }
  }

  async function salvarEdicao() {
    setAviso(null);
    const problema = validarTroca({ frase, dica });
    if (problema) return setAviso({ tom: 'aviso', texto: problema });
    setOcupado(true);
    try {
      await salvarTroca(trocaId!, { frase, dica, rapida });
      await carregar();
      setAviso({ tom: 'ok', texto: 'Alternativa salva.' });
    } catch (e: any) {
      setAviso({ tom: 'erro', texto: mensagemErroTroca(e) });
    } finally {
      setOcupado(false);
    }
  }

  const categoria = (novo ? categoriaNova : original?.categoria) as CategoriaTroca | null | undefined;
  const rotulo = categoria ? ROTULO_CATEGORIA[categoria] ?? categoria : '';
  const destinoNome = novo ? destinoAlimento?.nome ?? null : original?.destinoNome ?? null;

  const camposTexto = (
    <>
      <CampoTexto
        rotulo={`O que você ganha com ${destinoNome ?? 'a alternativa'}`}
        obrigatorio
        ajuda={`${frase.trim().length}/${MAX_FRASE} · linguagem simples, sem julgar e sem falar de calorias.`}
        value={frase}
        onChangeText={setFrase}
        multilinha
        maxLength={MAX_FRASE}
        placeholder="Ex.: Mais fibras e a mesma crocância, para dar energia até a próxima refeição."
      />
      <CampoTexto
        rotulo="Dica pra fazer"
        ajuda={`Opcional · ${dica.trim().length}/${MAX_DICA}`}
        value={dica}
        onChangeText={setDica}
        multilinha
        maxLength={MAX_DICA}
        placeholder="Ex.: Leve na mochila num potinho fechado."
      />
      <View style={{ gap: 8 }}>
        <RotuloCampo texto="Rápido de levar?" ajuda="Destaca a alternativa para quem come fora de casa." />
        <OpcoesUnica
          rotulo="Rápido de levar"
          opcoes={[{ valor: 'SIM', rotulo: 'Sim', icone: 'flash-outline' }, { valor: 'NAO', rotulo: 'Não' }]}
          valor={rapida ? 'SIM' : 'NAO'}
          onChange={(v) => setRapida(v === 'SIM')}
        />
      </View>
    </>
  );

  const previa = (
    <PreviaTroca
      categoria={categoria}
      origem={novo ? origemAlimento?.nome ?? null : null}
      destino={destinoNome}
      frase={frase}
      dica={dica}
      rapida={rapida}
    />
  );

  return (
    <PainelLayout
      config={config}
      titulo={novo ? 'Nova alternativa' : 'Editar alternativa'}
      subtitulo={novo ? 'Uma troca saudável para o módulo Comer · nasce como rascunho' : original ? `${rotulo} → ${original.destinoNome}` : undefined}
      voltar
    >
      {!novo && carregando ? (
        <EstadoCarregando texto="Abrindo a alternativa…" />
      ) : !novo && !original ? (
        <EstadoErro mensagem={erroCarga ?? 'Alternativa não encontrada.'} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : novo ? (
        <Assistente
          onCancelar={() => navigation.goBack()}
          rotuloConcluir="CRIAR ALTERNATIVA"
          onConcluir={criar}
          ocupado={ocupado}
          aviso={aviso}
          previa={previa}
          etapas={[
            {
              chave: 'categoria',
              titulo: 'Categoria',
              descricao: 'Que tipo de item de pacote esta troca substitui? Isso define o texto fixo "O que muda".',
              validar: () => (categoriaNova ? null : 'Escolha a categoria.'),
              conteudo: (
                <>
                  <OpcoesUnica
                    rotulo="Categoria"
                    opcoes={CATEGORIAS_TROCA.map((c) => ({ valor: c, rotulo: ROTULO_CATEGORIA[c] }))}
                    valor={categoriaNova}
                    onChange={(v) => setCategoriaNova(v as CategoriaTroca | null)}
                  />
                  {!!categoriaNova && (
                    <View style={styles.contexto}>
                      <AppText style={styles.contextoTitulo}>O que muda (texto fixo de {ROTULO_CATEGORIA[categoriaNova]})</AppText>
                      <AppText style={styles.contextoTexto}>{CONTEXTO_CATEGORIA[categoriaNova]}</AppText>
                    </View>
                  )}
                </>
              ),
            },
            {
              chave: 'alimentos',
              titulo: 'Alimentos',
              descricao: 'O alimento do catálogo que será sugerido e, se quiser, o item específico que ele substitui.',
              validar: () => (destinoAlimento ? null : 'Escolha a alternativa (o alimento que entra no lugar).'),
              conteudo: (
                <>
                  <SeletorAlimento rotulo="Alternativa (o que entra no lugar)" escolhido={destinoAlimento} onEscolher={setDestinoAlimento} />
                  <SeletorAlimento rotulo="Em vez de (opcional)" dica="Deixe em branco para a troca valer para qualquer item da categoria." escolhido={origemAlimento} onEscolher={setOrigemAlimento} opcional />
                  <View style={{ gap: 8 }}>
                    <RotuloCampo texto="Em quais refeições?" ajuda="Opcional. Sem nenhuma marcada, vale para qualquer refeição." />
                    <OpcoesMultipla
                      rotulo="Refeições"
                      opcoes={REFEICOES}
                      valores={new Set(refeicoes)}
                      onAlternar={(v) => setRefeicoes((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v]))}
                    />
                  </View>
                </>
              ),
            },
            {
              chave: 'texto',
              titulo: 'Texto para o adolescente',
              descricao: 'É o que ele lê ao tocar na alternativa. Confira na prévia.',
              validar: () => validarNovaTroca({ categoria: categoriaNova, destinoId: destinoAlimento?.id ?? null, origemId: origemAlimento?.id ?? null, frase, dica }),
              conteudo: (
                <>
                  {camposTexto}
                  <AvisoPainel tom="info" texto="Ao criar, a alternativa fica em rascunho. Na página seguinte você a envia para a aprovação da nutricionista." />
                </>
              ),
            },
          ]}
        />
      ) : (
        <View style={largura >= 1100 ? styles.duas : styles.uma}>
          <View style={[styles.uma, largura >= 1100 && { flex: 1, minWidth: 0 }]}>
            <AvisoEdicao papel={papel} />
            <CartaoSecao titulo="Texto para o adolescente" subtitulo="Categoria e alimentos são definidos na criação">
              {camposTexto}
              {!!aviso && <AvisoPainel tom={aviso.tom} texto={aviso.texto} onFechar={() => setAviso(null)} />}
              <View style={styles.rodape}>
                <AppButton label="VOLTAR" fullWidth={false} size="compact" outlineColor={tema.texto} textColor={tema.texto} disabled={ocupado} style={styles.botao} onPress={() => navigation.goBack()} />
                <AppButton label={ocupado ? 'SALVANDO…' : 'SALVAR ALTERNATIVA'} fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} disabled={ocupado} style={styles.botao} onPress={salvarEdicao} />
              </View>
            </CartaoSecao>
          </View>
          <View style={largura >= 1100 ? { width: 360 } : undefined}>{previa}</View>
        </View>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  uma: { gap: 16 },
  duas: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
  contexto: { backgroundColor: t.superficieSuave, borderRadius: 12, padding: 12, gap: 4 },
  contextoTitulo: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  contextoTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: t.textoCorpo },
  rodape: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  // prévia (cores do app do adolescente)
  pTopo: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  pChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: corApp.cartao, borderWidth: 1, borderColor: corApp.borda },
  pChipDestino: { backgroundColor: corApp.destaqueSuave, borderColor: corApp.destaque },
  pChipTexto: { fontFamily: typography.bold, fontSize: 12, color: corApp.apoio },
  pSelo: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: corApp.destaque },
  pSeloTexto: { fontFamily: typography.bold, fontSize: 11, color: corApp.texto },
  pBloco: { backgroundColor: corApp.cartao, borderRadius: 14, borderWidth: 2, borderColor: corApp.borda, padding: 12, gap: 4 },
  pBlocoTitulo: { fontFamily: typography.bold, fontSize: 13, color: corApp.texto },
  pTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: corApp.texto },
  pVazio: { color: corApp.apoio, fontStyle: 'italic' },
}) as const;
