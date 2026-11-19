// src/features/adolescente/scanner/screens/SolicitacoesScannerScreen.tsx
// Painel (nutricionista e admin): pedidos de cadastro do scanner. Aprovar grava o produto com fonte 'EQUIPE'.
//
// Revisão em etapas (Assistente): identificação → classificação → rótulo → ingredientes e fotos,
// com a prévia do produto no app ao lado. Uma etapa por vez, em vez de todos os campos juntos. Campos e chips são os do painel (seguem o
// tema claro/escuro); antes a tela usava o campo e os botões grandes do app do adolescente.
// Rejeitar pede confirmação, e o resultado aparece numa faixa no topo da lista.
// Regras e textos de classificação vêm de utils/scanner (não mudaram).
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../../shared/painel/PainelLayout';
import { EstadoCarregando, EstadoErro } from '../../../../shared/painel/components/EstadosPainel';
import { CampoBusca, Selo, VazioPainel } from '../../../../shared/painel/components/ControlesLista';
import { AvisoPainel, CampoTexto, OpcoesUnica, RotuloCampo, type TomAviso } from '../../../../shared/painel/components/Formulario';
import { IntroSecao } from '../../../../shared/painel/components/IntroSecao';
import { Assistente } from '../../../../shared/painel/components/Assistente';
import { PreviaApp, corApp } from '../../../../shared/painel/components/PreviaApp';
import { useModoPainel } from '../../../../shared/painel/hooks/useModoPainel';
import { ALVO_TOQUE, fonte } from '../../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../../shared/painel/types';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { typography } from '../../../../shared/theme/typography';
import { colors } from '../../../../shared/theme/colors';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import { CATEGORIAS_TROCA, CategoriaTroca, ROTULO_CATEGORIA } from '../../trocas/utils/trocas';
import { CampoImagem } from '../../../conteudo/components/CampoImagem';
import { enviarFotoProduto } from '../services/fotoProdutoService';
import { listarSolicitacoes, resolverSolicitacao, SolicitacaoScanner } from '../services/solicitacoesService';
import { CamposFicha, avisosDeClassificacao, camposDaFicha, montarDetalhes, nivelNutriente, numeroDigitado, salDoSodioMg, ROTULO_PROCESSAMENTO } from '../utils/scanner';
import type { TemaPainel } from '../../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../../shared/painel/tema/TemaPainelContext';

const NIVEIS = Object.keys(ROTULO_PROCESSAMENTO) as ClassificacaoNova[];
const CAMPOS_NUMERICOS = ['acucar', 'sal', 'sodio', 'gorduraSat', 'fibra', 'proteina'] as const;
type CampoNumerico = (typeof CAMPOS_NUMERICOS)[number];
const ROTULO_FONTE: Record<string, string> = { OPEN_FOOD_FACTS: 'Open Food Facts', USUARIO: 'informado por adolescente', EQUIPE: 'cadastrado pela equipe' };
const SEM = 'SEM';
// selo de atenção na prévia: âmbar suave da marca (o app do adolescente é sempre claro)
const colorsAtencao = colors.warningSoft; // opção "nenhuma" nos chips (OpcoesUnica trabalha com texto)

function Cartao({ s, onResolvida }: { s: SolicitacaoScanner; onResolvida: (tom: TomAviso, texto: string) => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { largura } = useModoPainel();
  const colunas = largura >= 1100 ? 3 : largura >= 560 ? 2 : 1;
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(s.nomeInformado ?? s.produtoAtualNome ?? '');
  const [marca, setMarca] = useState(s.marcaInformada ?? s.produtoAtualMarca ?? '');
  const [nova, setNova] = useState<ClassificacaoNova | null>(s.produtoAtualNova);
  const [categoria, setCategoria] = useState<CategoriaTroca | null>(s.produtoAtualCategoria);
  const [ficha, setFicha] = useState<CamposFicha>(() => camposDaFicha(s.produtoAtualDetalhes));
  const [tentou, setTentou] = useState(false);
  const [confirmaRejeitar, setConfirmaRejeitar] = useState(false);
  const campo = (k: keyof CamposFicha) => (v: string) => setFicha((f) => ({ ...f, [k]: v }));
  const detalhes = montarDetalhes(ficha);
  // valor digitado que não vale (não bloqueia rejeitar; bloqueia cadastrar)
  const invalido = (k: CampoNumerico) => ficha[k].trim() !== '' && (k === 'sodio' ? salDoSodioMg(ficha[k]) : numeroDigitado(ficha[k])) === null;
  const invalidos = CAMPOS_NUMERICOS.filter(invalido);
  const avisosNova = avisosDeClassificacao(nova, detalhes);
  const salDoSodio = ficha.sal.trim() === '' ? salDoSodioMg(ficha.sodio) : null;
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<{ tom: TomAviso; texto: string } | null>(null);

  const destaques = detalhes
    ? [
        nivelNutriente('ACUCAR', detalhes.acucarG) === 'BASTANTE' && 'bastante açúcar',
        nivelNutriente('SAL', detalhes.salG) === 'BASTANTE' && 'bastante sal',
        nivelNutriente('GORDURA_SAT', detalhes.gorduraSatG) === 'BASTANTE' && 'bastante gordura saturada',
        (detalhes.fibraG ?? 0) >= 3 && 'fonte de fibras',
        (detalhes.proteinaG ?? 0) >= 7.5 && 'fonte de proteína',
      ].filter(Boolean) as string[]
    : [];

  async function decidir(acao: 'APROVAR' | 'REJEITAR') {
    if (ocupado) return;
    if (acao === 'APROVAR') {
      setTentou(true);
      if (nome.trim().length < 2) { setErro({ tom: 'aviso', texto: 'Informe o nome do produto.' }); return; }
      if (invalidos.length > 0) { setErro({ tom: 'aviso', texto: 'Confira os valores marcados em vermelho: use números de 0 a 100 (ex.: 12,5).' }); return; }
    }
    setOcupado(true);
    setErro(null);
    try {
      await resolverSolicitacao(s.id, acao === 'APROVAR' ? { acao, nome, marca, nova, categoria, detalhes } : { acao });
      onResolvida('ok', acao === 'APROVAR' ? `"${nome.trim()}" foi cadastrado e já aparece no scanner.` : `O pedido do código ${s.codigoBarras} foi rejeitado.`);
    } catch (e: any) {
      setErro({ tom: 'erro', texto: e?.message ?? '' });
      setOcupado(false);
    }
  }

  const larguraCampo = { width: `${100 / colunas - (colunas > 1 ? 2 : 0)}%` as `${number}%`, minWidth: 140, flexGrow: 1 };
  const numerico = (k: CampoNumerico, rotulo: string, ajuda?: string) => (
    <View style={larguraCampo}>
      <CampoTexto
        rotulo={rotulo}
        value={ficha[k]}
        onChangeText={campo(k)}
        keyboardType="decimal-pad"
        maxLength={6}
        placeholder="—"
        erro={invalido(k) ? 'Use um número de 0 a 100.' : null}
        ajuda={ajuda}
      />
    </View>
  );

  return (
    <View style={[styles.card, aberto && styles.cardAberto]}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
        accessibilityLabel={`${s.nomeInformado ?? 'Produto sem nome'}, código ${s.codigoBarras}. ${aberto ? 'Recolher' : 'Revisar'}`}
        style={styles.topo}
      >
        <View style={styles.iconeProduto}>
          <Ionicons name="barcode-outline" size={22} color={tema.destaqueTexto} />
        </View>
        <View style={{ flex: 1, minWidth: 160, gap: 4 }}>
          <AppText style={styles.nome} numberOfLines={2}>
            {s.nomeInformado ?? 'Produto sem nome informado'}
            {s.marcaInformada ? <AppText style={styles.marca}> · {s.marcaInformada}</AppText> : null}
          </AppText>
          <AppText style={styles.codigo}>{s.codigoBarras}</AppText>
          <View style={styles.selos}>
            <Selo texto={s.motivo === 'FICHA_INCOMPLETA' ? 'Ficha incompleta' : 'Não encontrado'} tom="aviso" />
            <Selo texto={s.pedidos === 1 ? '1 pedido' : `${s.pedidos} pedidos`} tom={s.pedidos > 1 ? 'info' : 'neutro'} />
          </View>
        </View>
        <View style={styles.revisar}>
          <AppText style={styles.revisarTexto}>{aberto ? 'Recolher' : 'Revisar'}</AppText>
          <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={18} color={tema.destaqueTexto} />
        </View>
      </Pressable>

      {(!!s.candidatoNome || !!s.produtoAtualNome) && (
        <View style={styles.contexto}>
          {!!s.candidatoNome && (
            <View style={styles.contextoLinha}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={tema.textoSuave} />
              <AppText style={styles.suave}>
                Sugestão de quem pediu (não confirmada): {s.candidatoNome}{s.candidatoCodigo ? ` · código ${s.candidatoCodigo}` : ''}
              </AppText>
            </View>
          )}
          {!!s.produtoAtualNome && (
            <View style={styles.contextoLinha}>
              <Ionicons name="server-outline" size={14} color={tema.textoSuave} />
              <AppText style={styles.suave}>
                Hoje na base: {s.produtoAtualNome} ({ROTULO_FONTE[s.produtoAtualFonte ?? ''] ?? s.produtoAtualFonte ?? 'origem desconhecida'})
              </AppText>
            </View>
          )}
        </View>
      )}

      {aberto && (
        <View style={styles.corpo}>
          <Assistente
            embutido
            rotuloConcluir="CADASTRAR PRODUTO"
            onConcluir={() => decidir('APROVAR')}
            ocupado={ocupado}
            aviso={erro}
            previa={
              <PreviaApp nota="Prévia ilustrativa do resultado do scanner (Raio-X) no app. Sem calorias.">
                <View style={styles.pCard}>
                  <View style={styles.pFoto}>
                    {ficha.imagemUrl ? (
                      <Image source={{ uri: ficha.imagemUrl }} style={styles.pImagem} resizeMode="cover" accessibilityLabel="Foto da embalagem" />
                    ) : (
                      <Ionicons name="image-outline" size={24} color={corApp.apoio} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText style={[styles.pNome, !nome.trim() && styles.pVazio]} numberOfLines={2}>{nome.trim() || 'Nome do produto'}</AppText>
                    {!!marca.trim() && <AppText style={styles.pMarca}>{marca.trim()}</AppText>}
                  </View>
                </View>
                <View style={styles.pSelos}>
                  <View style={styles.pSelo}><AppText style={styles.pSeloTexto}>{nova ? ROTULO_PROCESSAMENTO[nova] : 'Sem classificação'}</AppText></View>
                  {destaques.map((d) => (
                    <View key={d} style={[styles.pSelo, d.startsWith('fonte') ? styles.pSeloBom : styles.pSeloAtencao]}>
                      <AppText style={styles.pSeloTexto}>{d}</AppText>
                    </View>
                  ))}
                </View>
                {!detalhes && <AppText style={[styles.pMarca, styles.pVazio]}>Os destaques do rótulo aparecem aqui.</AppText>}
              </PreviaApp>
            }
            etapas={[
              {
                chave: 'identificacao',
                titulo: 'Identificação',
                descricao: 'Confira o nome e a marca informados por quem escaneou.',
                validar: () => (nome.trim().length < 2 ? 'Informe o nome do produto (pelo menos 2 letras).' : null),
                conteudo: (
                  <View style={styles.grade}>
                    <View style={larguraCampo}>
                      <CampoTexto rotulo="Nome" obrigatorio value={nome} onChangeText={setNome} maxLength={200} placeholder="Ex.: Biscoito de polvilho" />
                    </View>
                    <View style={larguraCampo}>
                      <CampoTexto rotulo="Marca" value={marca} onChangeText={setMarca} maxLength={120} placeholder="Opcional" />
                    </View>
                  </View>
                ),
              },
              {
                chave: 'classificacao',
                titulo: 'Classificação',
                descricao: 'Nível de processamento segundo o Guia Alimentar e a categoria usada para sugerir trocas.',
                conteudo: (
                  <>
                    <View style={{ gap: 8 }}>
                      <RotuloCampo texto="Nível de processamento" />
                      <OpcoesUnica
                        rotulo="Nível de processamento"
                        opcoes={[{ valor: SEM, rotulo: 'Sem classificação' }, ...NIVEIS.map((n) => ({ valor: n, rotulo: ROTULO_PROCESSAMENTO[n] }))]}
                        valor={nova ?? SEM}
                        onChange={(v) => setNova(!v || v === SEM ? null : (v as ClassificacaoNova))}
                      />
                    </View>
                    {avisosNova.map((a) => <AvisoPainel key={a} tom="aviso" texto={a} />)}
                    <View style={{ gap: 8 }}>
                      <RotuloCampo texto="Categoria de troca" />
                      <OpcoesUnica
                        rotulo="Categoria de troca"
                        opcoes={[{ valor: SEM, rotulo: 'Nenhuma' }, ...CATEGORIAS_TROCA.map((c) => ({ valor: c, rotulo: ROTULO_CATEGORIA[c] }))]}
                        valor={categoria ?? SEM}
                        onChange={(v) => setCategoria(!v || v === SEM ? null : (v as CategoriaTroca))}
                      />
                    </View>
                  </>
                ),
              },
              {
                chave: 'rotulo',
                titulo: 'Rótulo nutricional',
                descricao: 'Por 100 g ou 100 ml, como na embalagem. O que ficar em branco não aparece. Sem calorias.',
                validar: () => (invalidos.length > 0 ? 'Confira os valores marcados em vermelho: use números de 0 a 100 (ex.: 12,5).' : null),
                conteudo: (
                  <View style={styles.grade}>
                    {numerico('acucar', 'Açúcar (g)')}
                    {numerico('sal', 'Sal (g)')}
                    {numerico(
                      'sodio',
                      'Sódio (mg), como no rótulo',
                      salDoSodio !== null
                        ? `= ${String(salDoSodio).replace('.', ',')} g de sal (sódio × 2,5). Será usado, pois Sal está vazio.`
                        : 'Basta o sódio: o app converte para sal. Se preencher os dois, vale o Sal.'
                    )}
                    {numerico('gorduraSat', 'Gordura saturada (g)')}
                    {numerico('fibra', 'Fibra (g)')}
                    {numerico('proteina', 'Proteína (g)')}
                    <View style={larguraCampo}>
                      <CampoTexto rotulo="Nº de aditivos" value={ficha.aditivos} onChangeText={campo('aditivos')} keyboardType="number-pad" maxLength={2} placeholder="—" />
                    </View>
                  </View>
                ),
              },
              {
                chave: 'fotos',
                titulo: 'Ingredientes e fotos',
                descricao: 'Confira a prévia e cadastre.',
                conteudo: (
                  <>
                    <CampoTexto rotulo="Ingredientes" ajuda="Na ordem do rótulo, separados por vírgula (até 8)." value={ficha.ingredientes} onChangeText={campo('ingredientes')} multilinha maxLength={400} />
                    <View style={styles.grade}>
                      <View style={[larguraCampo, { minWidth: 200 }]}>
                        <CampoImagem rotulo="Foto da embalagem (aparece para o adolescente)" valor={ficha.imagemUrl} onChange={campo('imagemUrl')} proporcao={[1, 1]} enviar={enviarFotoProduto} />
                      </View>
                      <View style={[larguraCampo, { minWidth: 200 }]}>
                        <CampoImagem rotulo="Foto do rótulo (só a equipe vê)" valor={ficha.rotuloUrl} onChange={campo('rotuloUrl')} proporcao={[3, 4]} enviar={enviarFotoProduto} />
                      </View>
                    </View>
                  </>
                ),
              },
            ]}
          />

          {confirmaRejeitar ? (
            <AvisoPainel
              tom="aviso"
              titulo="Rejeitar este pedido?"
              texto="O produto não será cadastrado e o pedido sai da fila. Se alguém escanear de novo, um novo pedido aparece."
              acao={{ rotulo: ocupado ? 'Rejeitando…' : 'Sim, rejeitar pedido', onPress: () => decidir('REJEITAR') }}
              onFechar={() => setConfirmaRejeitar(false)}
            />
          ) : (
            <Pressable onPress={() => setConfirmaRejeitar(true)} disabled={ocupado} accessibilityRole="button" style={styles.rejeitar}>
              <Ionicons name="close-circle-outline" size={18} color={tema.erro} />
              <AppText style={styles.rejeitarTexto}>Não cadastrar: rejeitar este pedido</AppText>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function SolicitacoesScannerScreen({ config }: { config: ConfigPainel }) {
  const styles = useEstilos(criarEstilos);
  const [lista, setLista] = useState<SolicitacaoScanner[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState<{ tom: TomAviso; texto: string } | null>(null);

  const carregar = useCallback(() => {
    setErro(null);
    listarSolicitacoes()
      .then(setLista)
      .catch((e) => setErro(e?.message ?? 'Não deu para carregar os pedidos.'));
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const visiveis = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!lista || !q) return lista ?? [];
    return lista.filter((s) => [s.nomeInformado, s.marcaInformada, s.codigoBarras, s.candidatoNome].some((v) => (v ?? '').toLowerCase().includes(q)));
  }, [lista, busca]);
  const totalPedidos = (lista ?? []).reduce((n, s) => n + s.pedidos, 0);

  function aoResolver(tom: TomAviso, texto: string) {
    setResultado({ tom, texto });
    carregar();
  }

  return (
    <PainelLayout config={config} titulo="Produtos do scanner" subtitulo="Pedidos de produtos que o scanner não encontrou na base">
      <IntroSecao
        chave="scanner_pedidos"
        titulo="Como revisar os pedidos"
        linhas={[
          'Quando um adolescente escaneia um produto que não está na base (ou está com a ficha incompleta), um pedido aparece aqui. Pedidos repetidos do mesmo código se somam.',
          'Toque em "Revisar", confira nome e marca, classifique o nível de processamento e copie os valores do rótulo. O que ficar em branco não aparece para o adolescente.',
          '"Cadastrar produto" grava na base com origem "equipe" e o produto passa a aparecer no scanner. "Rejeitar" tira o pedido da fila sem cadastrar.',
        ]}
      />
      {!!resultado && <AvisoPainel tom={resultado.tom} texto={resultado.texto} onFechar={() => setResultado(null)} />}
      {erro ? (
        <EstadoErro mensagem={erro} onTentar={carregar} />
      ) : lista === null ? (
        <EstadoCarregando texto="Carregando os pedidos…" />
      ) : lista.length === 0 ? (
        <VazioPainel titulo="Nenhum pedido pendente" texto="Quando alguém escanear um produto que não está na base, o pedido aparece aqui." />
      ) : (
        <View style={{ gap: 12 }}>
          <View style={styles.resumo}>
            <AppText style={styles.resumoTexto}>
              {lista.length} produto{lista.length === 1 ? '' : 's'} na fila · {totalPedidos} pedido{totalPedidos === 1 ? '' : 's'} no total
            </AppText>
          </View>
          {lista.length > 3 && <CampoBusca valor={busca} onChange={setBusca} placeholder="Buscar por nome, marca ou código" />}
          {visiveis.length === 0 ? (
            <VazioPainel titulo="Nada com essa busca" texto="Tente outro nome ou parte do código de barras." acao={{ label: 'LIMPAR BUSCA', onPress: () => setBusca('') }} />
          ) : (
            visiveis.map((s) => <Cartao key={s.id} s={s} onResolvida={aoResolver} />)
          )}
        </View>
      )}
    </PainelLayout>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 14, gap: 10 },
  cardAberto: { borderColor: t.destaqueTexto },
  topo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', minHeight: ALVO_TOQUE },
  iconeProduto: { width: 44, height: 44, borderRadius: 12, backgroundColor: t.destaqueSuave, alignItems: 'center', justifyContent: 'center' },
  nome: { fontFamily: typography.bold, fontSize: fonte.corpo + 1, color: t.texto },
  marca: { fontFamily: typography.regular, fontSize: fonte.corpo, color: t.textoSuave },
  codigo: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave, letterSpacing: 1 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  revisar: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: ALVO_TOQUE, paddingHorizontal: 12, borderRadius: 22, backgroundColor: t.destaqueSuave },
  revisarTexto: { fontFamily: typography.bold, fontSize: fonte.apoio, color: t.destaqueTexto },
  contexto: { gap: 4, paddingLeft: 56 },
  contextoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  suave: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, lineHeight: 17, flexShrink: 1 },
  corpo: { gap: 14, borderTopWidth: 1, borderTopColor: t.linhaSuave, paddingTop: 14 },
  bloco: { gap: 10 },
  blocoTopo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  blocoNumero: { width: 26, height: 26, borderRadius: 13, backgroundColor: t.chipAtivoFundo, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  blocoNumeroTexto: { fontFamily: typography.bold, fontSize: fonte.legenda, color: t.chipAtivoTexto },
  blocoTitulo: { fontFamily: typography.bold, fontSize: fonte.corpo, color: t.texto },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rejeitar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: ALVO_TOQUE },
  rejeitarTexto: { fontFamily: typography.semiBold, fontSize: fonte.apoio, color: t.erro },
  // prévia (cores do app do adolescente)
  pCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: corApp.cartao, borderRadius: 16, borderWidth: 2, borderColor: corApp.borda, padding: 10 },
  pFoto: { width: 64, height: 64, borderRadius: 12, backgroundColor: corApp.destaqueSuave, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pImagem: { width: 64, height: 64 },
  pNome: { fontFamily: typography.bold, fontSize: 15, color: corApp.texto },
  pMarca: { fontFamily: typography.regular, fontSize: 12, color: corApp.apoio },
  pVazio: { fontStyle: 'italic', color: corApp.apoio },
  pSelos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pSelo: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: corApp.destaqueSuave },
  pSeloBom: { backgroundColor: corApp.destaque },
  pSeloAtencao: { backgroundColor: colorsAtencao },
  pSeloTexto: { fontFamily: typography.semiBold, fontSize: 11, color: corApp.texto },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  botao: { paddingHorizontal: 18, minHeight: ALVO_TOQUE },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resumoTexto: { fontFamily: typography.medium, fontSize: fonte.apoio, color: t.textoSuave },
}) as const;
