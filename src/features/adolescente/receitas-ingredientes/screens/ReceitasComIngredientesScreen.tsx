// src/features/adolescente/receitas-ingredientes/screens/ReceitasComIngredientesScreen.tsx
// "Receitas com o que tenho" (RF023 a RF029), um canto próprio dentro de Comer:
//  1) o adolescente diz o que tem em casa (busca ou toque nos ingredientes, separados por grupo);
//  2) vê as receitas da que mais combina para a que menos combina, com o que tem e o que falta;
//  3) se não gostar de nenhuma, vê outras receitas mesmo sem combinação.
// Sem ingrediente nenhum, mostra todas as receitas da mais fácil para a mais difícil.
//
// Comunicação: quem chegava não sabia o que fazer. Agora há (a) um indicador de 2 passos no topo,
// (b) o Bróxis explicando o passo 1 e respondendo a cada ingrediente marcado ("já dá pra fazer 2")
// e (c) o botão com o número de receitas que a pessoa vai ver. Textos em utils/guiaReceitas.ts.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { SpeechBubble } from '../../../../shared/ui/SpeechBubble';
import { useReduzirMovimento } from '../../../../shared/hooks/useReduzirMovimento';
import { feedbackSelecao } from '../../../../shared/audio/feedback';
import { falaGuiaReceitas, rotuloBotaoReceitas, type ContagemGuia } from '../utils/guiaReceitas';
import { useReceitasSalvas } from '../hooks/useReceitasSalvas';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import {
  listarIngredientesDisponiveis,
  listarReceitasComIngredientes,
  type ReceitaComIngredientes,
} from '../../alimentacao/services/receitasService';
import { useAlimentacao } from '../../alimentacao/contexts/AlimentacaoContext';
import ReceitaCasaTela from '../components/ReceitaCasaTela';
import { EnviarReceitaSheet } from '../../social/components/EnviarReceitaSheet';
import {
  nomeLegivel,
  outrasReceitas,
  receitasQueCombinam,
  separarPorFalta,
  sugerirIngredientes,
  todasPorDificuldade,
  unirUniversos,
  universoDeIngredientes,
  type IngredienteCasa,
  type ReceitaPontuada,
} from '../utils/combinarReceitas';
import {
  GRUPOS_CASA,
  agruparIngredientes,
  alternarAtalho,
  contarMarcados,
  atalhoNaDespensa,
  type AtalhoIngrediente,
  type GrupoCasa,
} from '../utils/gruposIngredientes';
import { lerDespensa, salvarDespensa } from '../utils/despensa';
import {
  FILTRO_RECEITA_VAZIO,
  OPCOES_TEMPO_MIN,
  filtrarReceitas,
  filtroReceitaAtivo,
  type Dificuldade,
  type FiltroReceita,
} from '../../alimentacao/utils/filtrosAlimento';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'ReceitasIngredientes'>;
type Etapa = 'ingredientes' | 'resultados';
type Modo = 'combinam' | 'outras';
type Pontuada = ReceitaPontuada<ReceitaComIngredientes>;

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };
const DIFICULDADES: Dificuldade[] = ['FACIL', 'MEDIO', 'DIFICIL'];
/** quantos ingredientes de cada grupo aparecem antes do "Ver mais" */
const ATALHOS_VISIVEIS = 7;
const BROXIS = require('../../../../../assets/img/mascot/broxis-apresentando.png');
/** quantas receitas de cada seção aparecem antes do "Ver mais" */
const RECEITAS_VISIVEIS = 3;

export default function ReceitasComIngredientesScreen() {
  const navigation = useNavigation<Nav>();
  const { userId } = useAuth();
  const { adicionarAoCarrinho } = useAlimentacao();
  const reduzir = useReduzirMovimento();
  const { salvas, alternar: alternarSalva, ehSalva } = useReceitasSalvas();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [receitas, setReceitas] = useState<ReceitaComIngredientes[]>([]);
  // alimentos simples do catálogo: a lista não depende de haver receita publicada
  const [catalogo, setCatalogo] = useState<IngredienteCasa[]>([]);
  const [despensa, setDespensa] = useState<IngredienteCasa[]>([]);
  const [etapa, setEtapa] = useState<Etapa>('ingredientes');
  const [modo, setModo] = useState<Modo>('combinam');
  const [termo, setTermo] = useState('');
  const [filtro, setFiltro] = useState<FiltroReceita>(FILTRO_RECEITA_VAZIO);
  const [aberta, setAberta] = useState<Pontuada | null>(null);
  const [paraEnviar, setParaEnviar] = useState<{ id: string; titulo: string } | null>(null);
  // etapa 1
  const [vocePodeVerTodos, setVocePodeVerTodos] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState<GrupoCasa | null>('FRUTAS_VERDURAS');
  const [gruposCompletos, setGruposCompletos] = useState<Set<GrupoCasa>>(new Set());
  // etapa 2
  const [secoesCompletas, setSecoesCompletas] = useState<Set<string>>(new Set());

  const carregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [lista, guardada, disponiveis] = await Promise.all([
        listarReceitasComIngredientes(userId),
        lerDespensa(userId),
        listarIngredientesDisponiveis(userId),
      ]);
      setReceitas(lista);
      setCatalogo(disponiveis);
      setDespensa(guardada);
      // quem já informou ingredientes antes vai direto para as receitas (e pode editar quando quiser)
      setEtapa(guardada.length > 0 ? 'resultados' : 'ingredientes');
    } catch (e) {
      console.error('Erro ao carregar receitas:', e);
      setErro('Não deu pra carregar as receitas agora. Confira a internet e tente de novo.');
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const universo = useMemo(() => unirUniversos(universoDeIngredientes(receitas), catalogo), [receitas, catalogo]);
  const sugestoes = useMemo(() => sugerirIngredientes(universo, termo, despensa), [universo, termo, despensa]);
  // TODOS os ingredientes, já separados por grupo (não só uma lista curta de "comuns")
  const porGrupo = useMemo(() => agruparIngredientes(universo), [universo]);

  function mudarDespensa(nova: IngredienteCasa[]) {
    setDespensa(nova);
    setModo('combinam');
    // só id, nome e ids vão para o aparelho; o grupo serve apenas para arrumar a tela
    if (userId) void salvarDespensa(userId, nova.map(({ id, nome, ids }) => (ids ? { id, nome, ids } : { id, nome })));
  }

  function adicionar(ingrediente: IngredienteCasa) {
    mudarDespensa([...despensa, ingrediente]);
    setTermo('');
  }

  function remover(id: string) {
    mudarDespensa(despensa.filter((i) => i.id !== id));
  }

  function limparTudo() {
    Alert.alert('Limpar a lista?', `Vai tirar os ${despensa.length} ingredientes que você marcou.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: () => mudarDespensa([]) },
    ]);
  }

  function alternarGrupoCompleto(grupo: GrupoCasa) {
    setGruposCompletos((atual) => {
      const novo = new Set(atual);
      if (novo.has(grupo)) novo.delete(grupo);
      else novo.add(grupo);
      return novo;
    });
  }

  function alternarSecaoCompleta(chave: string) {
    setSecoesCompletas((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }

  const pontuadas: Pontuada[] = useMemo(() => {
    const base =
      despensa.length === 0
        ? todasPorDificuldade(receitas)
        : modo === 'combinam'
          ? receitasQueCombinam(receitas, despensa)
          : outrasReceitas(receitas, despensa);
    return base.filter((p) => filtrarReceitas([p.receita], filtro).length > 0);
  }, [receitas, despensa, modo, filtro]);

  const filtroAtivo = filtroReceitaAtivo(filtro);

  // retorno ao vivo do passo 1: quantas receitas os ingredientes marcados já destravam
  const contagem: ContagemGuia = useMemo(() => {
    const combinam = despensa.length > 0 ? receitasQueCombinam(receitas, despensa) : [];
    return {
      ingredientes: despensa.length,
      combinam: combinam.length,
      agora: separarPorFalta(combinam).agora.length,
      semReceitas: receitas.length === 0,
    };
  }, [receitas, despensa]);

  // ---------- topo: os 2 passos (tocar volta/avança) ----------
  function renderEtapas() {
    const itens: { chave: Etapa; numero: number; rotulo: string }[] = [
      { chave: 'ingredientes', numero: 1, rotulo: 'O que você tem' },
      { chave: 'resultados', numero: 2, rotulo: 'Escolha a receita' },
    ];
    return (
      <View style={styles.etapas} accessibilityRole="tablist">
        {itens.map((it, i) => {
          const ativa = etapa === it.chave;
          const feita = it.chave === 'ingredientes' && etapa === 'resultados';
          return (
            <React.Fragment key={it.chave}>
              {i > 0 && <View style={[styles.etapaLinha, etapa === 'resultados' && styles.etapaLinhaFeita]} />}
              <Pressable
                style={styles.etapa}
                onPress={() => {
                  if (ativa) return;
                  feedbackSelecao();
                  if (it.chave === 'resultados') setModo('combinam');
                  setEtapa(it.chave);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                accessibilityLabel={`Passo ${it.numero}: ${it.rotulo}`}
              >
                <View style={[styles.etapaNumero, (ativa || feita) && styles.etapaNumeroAtivo]}>
                  {feita ? (
                    <Ionicons name="checkmark" size={14} color={colors.white} />
                  ) : (
                    <AppText style={[styles.etapaNumeroTexto, ativa && styles.etapaNumeroTextoAtivo]}>{it.numero}</AppText>
                  )}
                </View>
                <AppText style={[styles.etapaRotulo, ativa && styles.etapaRotuloAtivo]}>{it.rotulo}</AppText>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  // ---------- etapa 1: o que você tem em casa ----------
  function renderChipDespensa(i: IngredienteCasa) {
    return (
      <MotiView
        key={i.id}
        from={reduzir ? { opacity: 1 } : { opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 220 }}
      >
        <Pressable style={styles.chipDespensa} onPress={() => remover(i.id)} accessibilityLabel={`Remover ${i.nome}`}>
          <AppText style={styles.chipDespensaTexto}>{i.nome}</AppText>
          <Ionicons name="close" size={14} color={colors.primaryDark} />
        </Pressable>
      </MotiView>
    );
  }

  function renderVoceTem() {
    const n = despensa.length;
    return (
      <View style={styles.voceTem}>
        <View style={styles.voceTemTopo}>
          <AppText style={styles.voceTemTitulo}>{n > 0 ? `Na sua cozinha (${n})` : 'Sua cozinha está vazia'}</AppText>
          {n > 0 && (
            <View style={styles.voceTemAcoes}>
              <Pressable
                style={styles.verTodos}
                onPress={() => setVocePodeVerTodos((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: vocePodeVerTodos }}
                hitSlop={8}
              >
                <AppText style={styles.linkVerde}>{vocePodeVerTodos ? 'Recolher' : 'Ver todos'}</AppText>
                <Ionicons name={vocePodeVerTodos ? 'chevron-up' : 'chevron-down'} size={16} color="#2E7D4F" />
              </Pressable>
              <Pressable onPress={limparTudo} accessibilityRole="button" hitSlop={8}>
                <AppText style={styles.linkVerde}>Limpar</AppText>
              </Pressable>
            </View>
          )}
        </View>

        {n === 0 ? (
          <AppText style={styles.voceTemVazio}>O que você marcar aparece aqui. Toque de novo pra tirar.</AppText>
        ) : vocePodeVerTodos ? (
          // aberto: todos os ingredientes quebram de linha, então dá pra ver e tirar qualquer um sem rolar de lado
          <View style={styles.chipsDespensa}>{despensa.map(renderChipDespensa)}</View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.chipsLinha}>
            {despensa.map(renderChipDespensa)}
          </ScrollView>
        )}
      </View>
    );
  }

  function renderChipAtalho(a: AtalhoIngrediente) {
    const marcado = atalhoNaDespensa(a, despensa);
    return (
      <Pressable
        key={a.id}
        style={[styles.chipAtalho, marcado && styles.chipAtalhoMarcado]}
        onPress={() => mudarDespensa(alternarAtalho(a, despensa))}
        accessibilityRole="button"
        accessibilityState={{ selected: marcado }}
        accessibilityLabel={marcado ? `Tirar ${a.nome}` : `Adicionar ${a.nome}`}
      >
        <AppText style={[styles.chipAtalhoTexto, marcado && styles.chipAtalhoTextoMarcado]}>
          {marcado ? '✓ ' : '+ '}
          {a.nome}
        </AppText>
      </Pressable>
    );
  }

  function renderGrupo(chave: GrupoCasa, titulo: string) {
    const atalhos = porGrupo[chave];
    if (atalhos.length === 0) return null;
    const aberto = grupoAberto === chave;
    const completo = gruposCompletos.has(chave);
    const visiveis = completo ? atalhos : atalhos.slice(0, ATALHOS_VISIVEIS);
    const escondidos = atalhos.length - visiveis.length;
    return (
      <View key={chave} style={[styles.grupo, aberto && styles.grupoAberto]}>
        <Pressable
          style={[styles.grupoTopo, aberto && styles.grupoTopoAberto]}
          onPress={() => setGrupoAberto(aberto ? null : chave)}
          accessibilityRole="button"
          accessibilityState={{ expanded: aberto }}
        >
          <AppText style={styles.grupoTitulo}>
            {titulo}
            <AppText style={styles.grupoContagem}>{`  · ${contarMarcados(atalhos, despensa)} de ${atalhos.length}`}</AppText>
          </AppText>
          <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={20} color={colors.primaryDark} />
        </Pressable>
        {aberto && (
          <View style={styles.grupoCorpo}>
            <View style={styles.chipsDespensa}>
              {visiveis.map(renderChipAtalho)}
              {escondidos > 0 && (
                <Pressable onPress={() => alternarGrupoCompleto(chave)} style={styles.verMaisChip} accessibilityRole="button">
                  <AppText style={styles.linkVerde}>Ver mais {escondidos}</AppText>
                </Pressable>
              )}
            </View>
            {completo && atalhos.length > ATALHOS_VISIVEIS && (
              <Pressable onPress={() => alternarGrupoCompleto(chave)} style={styles.verMenos} accessibilityRole="button">
                <AppText style={styles.linkVerde}>Ver menos</AppText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }

  function renderIngredientes() {
    const semReceitas = receitas.length === 0;
    return (
      <View style={styles.corpo}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>
          <View style={styles.guia}>
            <MotiView
              key={`broxis-${contagem.combinam}`}
              from={reduzir || contagem.ingredientes === 0 ? { translateY: 0 } : { translateY: -8 }}
              animate={{ translateY: 0 }}
              transition={{ type: 'spring', damping: 6, stiffness: 180 }}
            >
              <Image source={BROXIS} style={styles.guiaBroxis} resizeMode="contain" accessibilityElementsHidden importantForAccessibility="no" />
            </MotiView>
            <SpeechBubble typewriter={false} tailPosition="left" style={styles.guiaBalao}>
              <AppText style={styles.guiaTexto} accessibilityLiveRegion="polite">
                {falaGuiaReceitas(contagem)}
              </AppText>
            </SpeechBubble>
          </View>

          <View style={styles.buscaCaixa}>
            <Ionicons name="search" size={20} color="#7A8B94" />
            <TextInput
              style={styles.buscaInput}
              placeholder="Procure: ovo, banana, arroz..."
              placeholderTextColor="#7A8B94"
              value={termo}
              onChangeText={setTermo}
              autoCorrect={false}
            />
            {termo.length > 0 && (
              <Pressable onPress={() => setTermo('')} accessibilityLabel="Limpar busca" hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#7A8B94" />
              </Pressable>
            )}
          </View>

          {termo.trim().length > 0 && (
            <View style={styles.sugestoesCaixa}>
              {sugestoes.length === 0 ? (
                <AppText style={styles.vazioTexto}>Não achei "{termo.trim()}". Tenta outro nome ou toca num ingrediente da lista.</AppText>
              ) : (
                sugestoes.map((s) => (
                  <Pressable key={s.id} style={styles.sugestaoItem} onPress={() => adicionar({ id: s.id, nome: s.nome })}>
                    <AppText style={styles.sugestaoTexto}>{s.nome}</AppText>
                    <Ionicons name="add-circle" size={22} color={colors.primary} />
                  </Pressable>
                ))
              )}
            </View>
          )}

          {renderVoceTem()}

          <AppText style={styles.secao}>Ou toque no que tem aí</AppText>
          <View style={{ gap: 12 }}>{GRUPOS_CASA.map((g) => renderGrupo(g.chave, g.titulo))}</View>

          {semReceitas && (
            <AppText style={styles.avisoSemReceitas}>
              Ainda não há receitas liberadas para você. Você já pode montar sua lista; as receitas aparecem aqui assim que forem publicadas.
            </AppText>
          )}
        </ScrollView>

        <AppButton
          label={rotuloBotaoReceitas(contagem)}
          textColor={colors.primaryDark}
          style={styles.botaoPrimario}
          disabled={despensa.length === 0}
          onPress={() => {
            setModo('combinam');
            setEtapa('resultados');
          }}
        />
        {despensa.length === 0 && (
          <Pressable
            style={styles.pular}
            onPress={() => {
              setModo('combinam');
              setEtapa('resultados');
            }}
            accessibilityRole="button"
          >
            <AppText style={styles.link}>Prefiro ver todas as receitas</AppText>
          </Pressable>
        )}
      </View>
    );
  }

  // ---------- etapa 2: receitas ----------
  function textoStatus(p: Pontuada): string {
    const total = p.receita.ingredientes.length;
    if (total === 0) return '';
    if (despensa.length === 0) return `${total} ${total === 1 ? 'ingrediente' : 'ingredientes'}`;
    if (p.faltam.length === 0) return total === 1 ? 'Você tem o ingrediente' : `Você tem os ${total} ingredientes`;
    if (p.tenho.length === 0) return `Você ainda não tem nenhum dos ${total} ingredientes`;
    if (p.faltam.length <= 2) return `Tem ${p.tenho.length} de ${total} · falta ${p.faltam.map((i) => nomeLegivel(i.nome)).join(', ')}`;
    return `Você tem ${p.tenho.length} de ${total} ingredientes`;
  }

  function renderCartao(p: Pontuada) {
    const r = p.receita;
    const total = r.ingredientes.length;
    const completa = total > 0 && p.faltam.length === 0;
    const mostraBarra = despensa.length > 0 && total > 0;
    return (
      <Pressable style={({ pressed }) => [styles.cartao, pressed && styles.cartaoPressionado]} onPress={() => setAberta(p)} accessibilityRole="button" accessibilityLabel={`${r.titulo}. ${textoStatus(p)}`}>
        {r.foto_url ? (
          <Image source={{ uri: r.foto_url }} style={styles.cartaoFoto} resizeMode="cover" />
        ) : (
          <View style={[styles.cartaoFoto, styles.cartaoFotoVazia]}>
            <Ionicons name="restaurant-outline" size={24} color="#9DBB86" />
          </View>
        )}
        <View style={styles.cartaoCorpo}>
          <View style={styles.cartaoTituloLinha}>
            <AppText style={[styles.cartaoTitulo, styles.flex]} numberOfLines={2}>{r.titulo}</AppText>
            {ehSalva(r.id) && <Ionicons name="bookmark" size={16} color={colors.destaqueTexto} accessibilityLabel="Salva" />}
          </View>
          <AppText style={styles.cartaoMeta}>
            {r.tempo_preparo_min ? `${r.tempo_preparo_min} min • ` : ''}
            {ROTULO_DIFICULDADE[r.dificuldade] ?? ''}
          </AppText>
          {mostraBarra && (
            <View style={styles.barraFundo}>
              <View style={[styles.barraPreenchida, { width: `${Math.round((p.tenho.length / total) * 100)}%` }]} />
            </View>
          )}
          {!!textoStatus(p) && (
            <AppText style={[styles.cartaoStatus, completa && styles.cartaoStatusOk]} numberOfLines={2}>{textoStatus(p)}</AppText>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    );
  }

  /** Uma seção de receitas: título, contagem e as primeiras; o resto abre em "Ver mais". */
  function renderSecao(chave: string, titulo: string, lista: Pontuada[]) {
    if (lista.length === 0) return null;
    const completa = secoesCompletas.has(chave);
    const visiveis = completa ? lista : lista.slice(0, RECEITAS_VISIVEIS);
    const escondidas = lista.length - visiveis.length;
    return (
      <View key={chave} style={styles.secaoReceitas}>
        <View style={styles.secaoReceitasTopo}>
          <AppText style={styles.secaoReceitasTitulo}>{titulo}</AppText>
          <AppText style={styles.secaoReceitasContagem}>{lista.length} {lista.length === 1 ? 'receita' : 'receitas'}</AppText>
        </View>
        <View style={{ gap: 12 }}>
          {visiveis.map((p, i) => (
            <MotiView
              key={p.receita.id}
              from={reduzir ? { opacity: 1 } : { opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 280, delay: Math.min(i, 5) * 60 }}
            >
              {renderCartao(p)}
            </MotiView>
          ))}
        </View>
        {(escondidas > 0 || (completa && lista.length > RECEITAS_VISIVEIS)) && (
          <Pressable style={styles.verMaisLinha} onPress={() => alternarSecaoCompleta(chave)} accessibilityRole="button">
            <AppText style={styles.linkVerde}>{completa ? 'Ver menos' : `Ver mais ${escondidas}`}</AppText>
          </Pressable>
        )}
      </View>
    );
  }

  function renderListaReceitas() {
    if (pontuadas.length === 0) {
      return (
        <View style={styles.vazioBloco}>
          <AppText style={styles.vazioTexto}>
            {filtroAtivo
              ? 'Nenhuma receita com esses filtros. Tira um filtro pra ver mais.'
              : modo === 'outras'
                ? 'Por enquanto são todas as receitas que temos. Que tal adicionar mais ingredientes?'
                : receitas.length === 0
                  ? 'Ainda não há receitas liberadas para você. Volte em breve!'
                  : 'Ainda não temos receita com esses ingredientes.'}
          </AppText>
          {!filtroAtivo && modo === 'combinam' && despensa.length > 0 && (
            <Pressable onPress={() => setModo('outras')}>
              <AppText style={styles.link}>Ver outras receitas</AppText>
            </Pressable>
          )}
          {filtroAtivo && (
            <Pressable onPress={() => setFiltro(FILTRO_RECEITA_VAZIO)}>
              <AppText style={styles.link}>Limpar filtros</AppText>
            </Pressable>
          )}
        </View>
      );
    }

    if (despensa.length > 0 && modo === 'combinam') {
      const s = separarPorFalta(pontuadas);
      return (
        <>
          {renderSecao('agora', 'Dá para fazer agora', s.agora)}
          {renderSecao('pouquinho', 'Falta pouquinho', s.pouquinho)}
          {renderSecao('emParte', 'Combinam em parte', s.emParte)}
        </>
      );
    }
    return renderSecao('todas', despensa.length === 0 ? 'Todas as receitas' : 'Outras receitas', pontuadas);
  }

  function renderChipFiltro(rotulo: string, ativo: boolean, aoTocar: () => void) {
    return (
      <Pressable
        key={rotulo}
        onPress={aoTocar}
        accessibilityRole="button"
        accessibilityState={{ selected: ativo }}
        style={[styles.chipFiltro, ativo && styles.chipFiltroAtivo]}
      >
        <AppText style={[styles.chipFiltroTexto, ativo && styles.chipFiltroTextoAtivo]}>{rotulo}</AppText>
      </Pressable>
    );
  }

  function renderResultados() {
    const nomes = despensa.map((i) => nomeLegivel(i.nome)).join(', ');
    return (
      <View style={styles.corpo}>
        <View style={styles.resumoLinha}>
          <AppText style={styles.resumoTexto} numberOfLines={1}>
            {despensa.length > 0
              ? `${despensa.length} ${despensa.length === 1 ? 'ingrediente' : 'ingredientes'}: ${nomes}`
              : 'Você não informou ingredientes'}
          </AppText>
          <Pressable onPress={() => setEtapa('ingredientes')} style={styles.botaoEditar} accessibilityRole="button">
            <AppText style={styles.botaoEditarTexto}>{despensa.length > 0 ? 'Editar' : 'Adicionar'}</AppText>
          </Pressable>
        </View>

        <View style={styles.filtrosFaixa}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtrosLinha} keyboardShouldPersistTaps="handled">
            {renderChipFiltro('Todas', !filtroAtivo, () => setFiltro(FILTRO_RECEITA_VAZIO))}
            {DIFICULDADES.map((d) =>
              renderChipFiltro(ROTULO_DIFICULDADE[d], filtro.dificuldade === d, () =>
                setFiltro((f) => ({ ...f, dificuldade: f.dificuldade === d ? null : d }))
              )
            )}
            {OPCOES_TEMPO_MIN.map((m) =>
              renderChipFiltro(`Até ${m} min`, filtro.tempoMaxMin === m, () =>
                setFiltro((f) => ({ ...f, tempoMaxMin: f.tempoMaxMin === m ? null : m }))
              )
            )}
          </ScrollView>
        </View>

        {modo === 'outras' && (
          <View style={styles.avisoOutras}>
            <AppText style={styles.avisoOutrasTexto}>
              Estas receitas pedem outros ingredientes — mostrei o que falta em cada uma.
            </AppText>
            <Pressable onPress={() => setModo('combinam')}>
              <AppText style={styles.link}>Voltar às sugestões</AppText>
            </Pressable>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
          {pontuadas.length > 0 && (
            <View style={styles.dicaResultados}>
              <Ionicons name="hand-left-outline" size={16} color={colors.destaqueTexto} />
              <AppText style={styles.dicaResultadosTexto}>Toque numa receita pra ver o que precisa e o passo a passo.</AppText>
            </View>
          )}
          {renderListaReceitas()}
          {modo === 'combinam' && despensa.length > 0 && pontuadas.length > 0 && (
            <Pressable style={styles.botaoSecundario} onPress={() => setModo('outras')}>
              <AppText style={styles.botaoSecundarioTexto}>Não gostei de nenhuma</AppText>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  // "Adicionar ao registro": leva o prato para o carrinho e deixa a pessoa escolher a refeição
  function adicionarAoRegistro(r: ReceitaComIngredientes) {
    adicionarAoCarrinho(r.alimento_resultante);
    setAberta(null);
    // um Modal ainda fechando atrapalha a navegação no iOS: espera ele sair
    setTimeout(() => navigation.navigate('TipoRefeicao'), 450);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader
        titulo="Receitas com o que tenho"
        subtitulo="Cozinhe com o que já tem em casa"
        onVoltar={() => navigation.goBack()}
        direita={
          <Pressable
            onPress={() => navigation.navigate('ReceitasSalvas')}
            style={styles.atalhoSalvas}
            accessibilityRole="button"
            accessibilityLabel={`Receitas salvas, ${salvas.length}`}
          >
            <Ionicons name={salvas.length > 0 ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.primaryDark} />
            {salvas.length > 0 && (
              <View style={styles.atalhoSalvasBolinha}>
                <AppText style={styles.atalhoSalvasNumero}>{salvas.length > 9 ? '9+' : salvas.length}</AppText>
              </View>
            )}
          </Pressable>
        }
      />

      {carregando ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : erro ? (
        <View style={styles.vazioBloco}>
          <AppText style={styles.vazioTexto}>{erro}</AppText>
          <Pressable onPress={() => void carregar()}>
            <AppText style={styles.link}>Tentar de novo</AppText>
          </Pressable>
        </View>
      ) : (
        <>
          {renderEtapas()}
          {etapa === 'ingredientes' ? renderIngredientes() : renderResultados()}
        </>
      )}

      <ReceitaCasaTela
        item={aberta}
        temDespensa={despensa.length > 0}
        onFechar={() => setAberta(null)}
        onAdicionarAoRegistro={adicionarAoRegistro}
        salva={!!aberta && ehSalva(aberta.receita.id)}
        onAlternarSalva={(r) => alternarSalva(r.id)}
        onEnviarParaAmigo={(r) => {
          // dois Modals ao mesmo tempo falham no iOS: fecha um e abre o outro depois
          setAberta(null);
          setTimeout(() => setParaEnviar({ id: r.id, titulo: r.titulo }), 450);
        }}
      />
      <EnviarReceitaSheet receita={paraEnviar} onFechar={() => setParaEnviar(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: colors.white },
  corpo: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },

  etapas: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 4, paddingBottom: 4 },
  etapa: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  etapaNumero: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.bordaSuave, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  etapaNumeroAtivo: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  etapaNumeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.textoSuave },
  etapaNumeroTextoAtivo: { color: colors.white },
  etapaRotulo: { fontFamily: typography.semiBold, fontSize: 13, color: colors.textoSuave },
  etapaRotuloAtivo: { fontFamily: typography.bold, color: colors.primaryDark },
  etapaLinha: { flex: 1, height: 2, borderRadius: 1, backgroundColor: colors.bordaSuave, marginHorizontal: 10 },
  etapaLinhaFeita: { backgroundColor: colors.primaryDark },

  guia: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  guiaBroxis: { width: 64, height: 76 },
  guiaBalao: { flex: 1 },
  guiaTexto: { fontFamily: typography.semiBold, fontSize: 14, lineHeight: 20, color: colors.primaryDark },
  pular: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dicaResultados: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.superficieSuave, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  dicaResultadosTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12.5, lineHeight: 17, color: colors.textoCorrido },
  flex: { flex: 1 },
  cartaoTituloLinha: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  atalhoSalvas: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  atalhoSalvasBolinha: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoSalvasNumero: { fontFamily: typography.bold, fontSize: 10, color: colors.primaryDark },
  cartaoPressionado: { backgroundColor: colors.superficieSuave, transform: [{ scale: 0.98 }] },

  buscaCaixa: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 28, paddingHorizontal: 18, paddingVertical: 12 },
  buscaInput: { flex: 1, fontFamily: typography.regular, fontSize: 15, color: colors.primaryDark, padding: 0 },
  sugestoesCaixa: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 16, marginTop: 8, paddingHorizontal: 16 },
  sugestaoItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  sugestaoTexto: { fontFamily: typography.medium, fontSize: 14, color: colors.primaryDark },

  voceTem: { backgroundColor: '#EAF6DA', borderRadius: 20, padding: 14, marginTop: 16 },
  voceTemTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  voceTemTitulo: { flexShrink: 1, fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  voceTemAcoes: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  verTodos: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  voceTemVazio: { fontFamily: typography.regular, fontSize: 13, color: '#5B6B75' },
  linkVerde: { fontFamily: typography.bold, fontSize: 13, color: '#2E7D4F' },
  chipsLinha: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chipsDespensa: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipDespensa: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.white, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 12 },
  chipDespensaTexto: { fontFamily: typography.medium, fontSize: 13, color: colors.primaryDark },

  secao: { fontFamily: typography.bold, fontSize: 12, color: '#7A8B94', textTransform: 'uppercase', marginTop: 24, marginBottom: 10 },
  grupo: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 20, overflow: 'hidden', backgroundColor: colors.white },
  grupoAberto: { borderColor: '#D9E2E8' },
  grupoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  grupoTopoAberto: { backgroundColor: '#F6F9F6' },
  grupoTitulo: { flex: 1, fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  grupoContagem: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },
  grupoCorpo: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  chipAtalho: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 22, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.white },
  chipAtalhoMarcado: { backgroundColor: '#EAF6DA' },
  chipAtalhoTexto: { fontFamily: typography.medium, fontSize: 14, color: colors.primaryDark },
  chipAtalhoTextoMarcado: { fontFamily: typography.bold },
  verMaisChip: { justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  verMenos: { alignSelf: 'flex-start', paddingTop: 12, paddingHorizontal: 2 },
  avisoSemReceitas: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 20, textAlign: 'center' },

  botaoPrimario: { marginTop: 12 },
  botaoSecundario: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  botaoSecundarioTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },

  resumoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAF6DA', borderRadius: 20, paddingVertical: 8, paddingLeft: 16, paddingRight: 8 },
  resumoTexto: { flex: 1, fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  botaoEditar: { backgroundColor: colors.white, borderRadius: 18, paddingVertical: 9, paddingHorizontal: 16 },
  botaoEditarTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },

  filtrosFaixa: { flexGrow: 0, flexShrink: 0, marginTop: 12 },
  filtrosLinha: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chipFiltro: { borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: colors.white },
  chipFiltroAtivo: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipFiltroTexto: { fontFamily: typography.medium, fontSize: 14, color: '#5B6B75' },
  chipFiltroTextoAtivo: { fontFamily: typography.bold, color: '#fff' },

  avisoOutras: { backgroundColor: '#EAF2FD', borderRadius: 12, padding: 12, marginTop: 12, gap: 4 },
  avisoOutrasTexto: { fontFamily: typography.regular, fontSize: 12, color: '#2E6DA4' },

  secaoReceitas: { marginBottom: 20 },
  secaoReceitasTopo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  secaoReceitasTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  secaoReceitasContagem: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94' },
  verMaisLinha: { alignItems: 'center', paddingTop: 14, paddingBottom: 2 },

  cartao: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#D9E2E8', borderRadius: 20, padding: 12 },
  cartaoFoto: { width: 72, height: 72, borderRadius: 14, backgroundColor: '#EAF6DA' },
  cartaoFotoVazia: { alignItems: 'center', justifyContent: 'center' },
  cartaoCorpo: { flex: 1, gap: 3 },
  cartaoTitulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  cartaoMeta: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94' },
  barraFundo: { height: 6, borderRadius: 3, backgroundColor: '#E6EDF1', overflow: 'hidden', marginTop: 4 },
  barraPreenchida: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  cartaoStatus: { fontFamily: typography.regular, fontSize: 12, color: '#5B6B75', marginTop: 2 },
  cartaoStatusOk: { fontFamily: typography.bold, color: '#2E7D4F' },

  vazioBloco: { alignItems: 'center', gap: 10, paddingHorizontal: 32, marginTop: 40 },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, color: '#7A8B94', textAlign: 'center' },
  link: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, textDecorationLine: 'underline' },
});
