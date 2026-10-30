// src/features/admin/screens/AlimentosListScreen.tsx
// Catálogo de alimentos do painel: busca, filtros e cartões. Mostra de relance se é prato ou
// ingrediente, a classificação NOVA, os grupos, onde aparece no recordatório e se tem receita.
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { CampoBusca, ChipsFiltro, Selo, VazioPainel, type TomSelo } from '../../../shared/painel/components/ControlesLista';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { Alimento, listarAlimentos, precisaRevisaoNutricional } from '../services/alimentosAdminService';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  FILTROS_VAZIOS, ROTULO_GRUPO, ROTULO_NOVA, ROTULO_REFEICAO, contarFiltros, filtrarAlimentos,
  type FiltrosAlimentos,
} from '../utils/filtrosAlimentosAdmin';

const TOM_NOVA: Record<string, TomSelo> = { IN_NATURA: 'ok', INGREDIENTE_CULINARIO: 'info', PROCESSADO: 'aviso', ULTRAPROCESSADO: 'erro' };

const OP_TIPO = [
  { chave: 'TODOS', label: 'Todos' }, { chave: 'INGREDIENTE', label: 'Ingredientes' }, { chave: 'PRATO', label: 'Pratos' },
];
const OP_ORIGEM = [
  { chave: 'TODAS', label: 'Qualquer origem' }, { chave: 'EQUIPE', label: 'Cadastrados pela equipe' },
  { chave: 'ADOLESCENTE', label: 'Criados por adolescentes' }, { chave: 'REVISAR', label: 'Aguardando revisão' },
];
const OP_NOVA = [{ chave: 'TODAS', label: 'Todas' }, ...Object.entries(ROTULO_NOVA).map(([chave, label]) => ({ chave, label }))];
const OP_GRUPO = [{ chave: 'TODOS', label: 'Todos' }, ...Object.entries(ROTULO_GRUPO).map(([chave, label]) => ({ chave, label }))];
const OP_RECORDATORIO = [
  { chave: 'TODOS', label: 'Qualquer' }, { chave: 'SEM', label: 'Fora do recordatório' },
  ...Object.entries(ROTULO_REFEICAO).map(([chave, label]) => ({ chave, label })),
];
const OP_RECEITA = [{ chave: 'TODOS', label: 'Todos' }, { chave: 'COM', label: 'Com receita' }, { chave: 'SEM', label: 'Sem receita' }];

function CartaoAlimento({ item, onPress }: { item: Alimento; onPress: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const prato = item.eh_prato_composto;
  const revisar = precisaRevisaoNutricional(item);
  const refeicoes = item.tipos_refeicao_recordatorio ?? [];
  const grupos = item.grupos_alimentares ?? [];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${item.nome}`} style={({ pressed }) => [styles.card, revisar && styles.cardRevisar, pressed && { opacity: 0.85 }]}>
      <View style={styles.topo}>
        <View style={[styles.icone, prato && styles.iconePrato]}>
          <Ionicons name={prato ? 'restaurant' : 'nutrition'} size={18} color={prato ? tema.selos.aviso.texto : tema.texto} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText numberOfLines={2} style={styles.nome}>{item.nome}</AppText>
          <AppText style={styles.tipo}>{prato ? 'Prato composto' : 'Ingrediente / alimento'}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={tema.textoSuave} />
      </View>

      <View style={styles.selos}>
        <Selo texto={ROTULO_NOVA[item.classificacao_nova] ?? item.classificacao_nova} tom={TOM_NOVA[item.classificacao_nova] ?? 'neutro'} />
        {item.tem_receita && <Selo texto="Tem receita" tom="info" />}
        {revisar && <Selo texto="Revisar nutrientes" tom="aviso" />}
        {item.criado_por !== null && !revisar && <Selo texto="Criado por adolescente" tom="neutro" />}
      </View>

      <AppText numberOfLines={2} style={styles.grupos}>
        {grupos.length ? grupos.map((g) => ROTULO_GRUPO[g] ?? g).join(' · ') : 'Sem grupo alimentar'}
      </AppText>

      <View style={styles.rodape}>
        <Ionicons name={refeicoes.length ? 'checkmark-circle' : 'remove-circle-outline'} size={14} color={refeicoes.length ? tema.texto : tema.textoSuave} />
        <AppText style={styles.rodapeTexto} numberOfLines={1}>
          {refeicoes.length ? `Recordatório: ${refeicoes.map((r) => ROTULO_REFEICAO[r] ?? r).join(', ')}` : 'Fora do recordatório'}
        </AppText>
        {!!item.vezes_usado && <AppText style={styles.usos}>{item.vezes_usado}x</AppText>}
      </View>
    </Pressable>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={{ gap: 6 }}>
      <AppText style={styles.rotuloFiltro}>{rotulo}</AppText>
      {children}
    </View>
  );
}

export default function AlimentosListScreen({ navigation }: any) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const { width } = useWindowDimensions();
  const colunas = width >= 1180 ? 3 : width >= 760 ? 2 : 1;
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosAlimentos>(FILTROS_VAZIOS);
  const [painelAberto, setPainelAberto] = useState(false);

  const carregar = useCallback(() => {
    setCarregando(true);
    listarAlimentos()
      .then((l) => { setAlimentos(l); setErro(null); })
      .catch((e) => setErro(e?.message ?? 'Não foi possível carregar os alimentos.'))
      .finally(() => setCarregando(false));
  }, []);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const set = <K extends keyof FiltrosAlimentos>(k: K, v: FiltrosAlimentos[K]) => setFiltros((f) => ({ ...f, [k]: v }));
  const visiveis = useMemo(() => filtrarAlimentos(alimentos, filtros), [alimentos, filtros]);
  // completa a última linha com espaços vazios, para o último cartão não esticar sozinho
  const dados = useMemo<(Alimento | null)[]>(() => {
    const falta = (colunas - (visiveis.length % colunas)) % colunas;
    return visiveis.length === 0 ? [] : [...visiveis, ...Array(falta).fill(null)];
  }, [visiveis, colunas]);
  const ativos = contarFiltros(filtros);
  const pendentes = useMemo(() => alimentos.filter(precisaRevisaoNutricional).length, [alimentos]);
  const pratos = useMemo(() => alimentos.filter((a) => a.eh_prato_composto).length, [alimentos]);

  const cabecalho = (
    <View style={styles.cabecalho}>
      <View style={styles.titulos}>
        <View style={{ flex: 1, minWidth: 180 }}>
          <AppText style={styles.titulo}>Catálogo de alimentos</AppText>
          <AppText style={styles.subtitulo}>
            {alimentos.length} no total · {pratos} pratos · {alimentos.length - pratos} ingredientes
          </AppText>
        </View>
        <AppButton label="+ NOVO ALIMENTO" fullWidth={false} size="compact" backgroundColor={tema.botaoFundo} textColor={tema.botaoTexto} shadowColor={tema.botaoSombra} style={styles.botaoNovo} onPress={() => navigation.navigate('AlimentoForm', {})} />
      </View>

      {pendentes > 0 && (
        <Pressable onPress={() => set('origem', filtros.origem === 'REVISAR' ? 'TODAS' : 'REVISAR')} style={styles.aviso} accessibilityRole="button">
          <Ionicons name="alert-circle" size={18} color="#8A5A00" />
          <AppText style={styles.avisoTexto}>
            {pendentes} alimento(s) criados por adolescentes aguardam revisão nutricional. {filtros.origem === 'REVISAR' ? 'Toque para ver todos.' : 'Toque para ver só eles.'}
          </AppText>
        </Pressable>
      )}

      <CampoBusca valor={filtros.busca} onChange={(t) => set('busca', t)} placeholder="Buscar alimento pelo nome" />
      <ChipsFiltro opcoes={OP_TIPO} valor={filtros.tipo} onChange={(c) => set('tipo', c as FiltrosAlimentos['tipo'])} />

      <View style={styles.linhaFiltros}>
        <Pressable onPress={() => setPainelAberto((a) => !a)} accessibilityRole="button" accessibilityState={{ expanded: painelAberto }} style={[styles.botaoFiltros, ativos > 0 && styles.botaoFiltrosOn]}>
          <Ionicons name="options-outline" size={16} color={ativos > 0 ? tema.botaoTexto : tema.texto} />
          <AppText style={[styles.botaoFiltrosTexto, ativos > 0 && { color: tema.botaoTexto }]}>
            Mais filtros{ativos > 0 ? ` (${ativos})` : ''}
          </AppText>
          <Ionicons name={painelAberto ? 'chevron-up' : 'chevron-down'} size={14} color={ativos > 0 ? tema.botaoTexto : tema.texto} />
        </Pressable>
        {(ativos > 0 || filtros.busca !== '') && (
          <Pressable onPress={() => setFiltros(FILTROS_VAZIOS)} accessibilityRole="button" hitSlop={8}>
            <AppText style={styles.limpar}>Limpar tudo</AppText>
          </Pressable>
        )}
        <AppText style={styles.contagem}>
          {visiveis.length === alimentos.length ? `${alimentos.length} alimentos` : `${visiveis.length} de ${alimentos.length}`}
        </AppText>
      </View>

      {painelAberto && (
        <View style={styles.painelFiltros}>
          <Linha rotulo="Origem"><ChipsFiltro opcoes={OP_ORIGEM} valor={filtros.origem} onChange={(c) => set('origem', c as FiltrosAlimentos['origem'])} /></Linha>
          <Linha rotulo="Classificação NOVA"><ChipsFiltro opcoes={OP_NOVA} valor={filtros.nova ?? 'TODAS'} onChange={(c) => set('nova', c === 'TODAS' ? null : (c as any))} /></Linha>
          <Linha rotulo="Grupo alimentar"><ChipsFiltro opcoes={OP_GRUPO} valor={filtros.grupo ?? 'TODOS'} onChange={(c) => set('grupo', c === 'TODOS' ? null : (c as any))} /></Linha>
          <Linha rotulo="Aparece no recordatório em"><ChipsFiltro opcoes={OP_RECORDATORIO} valor={filtros.recordatorio} onChange={(c) => set('recordatorio', c as any)} /></Linha>
          <Linha rotulo="Receita"><ChipsFiltro opcoes={OP_RECEITA} valor={filtros.receita} onChange={(c) => set('receita', c as any)} /></Linha>
        </View>
      )}
    </View>
  );

  if (carregando && alimentos.length === 0) return <View style={styles.root}><EstadoCarregando /></View>;
  if (erro && alimentos.length === 0) return <View style={styles.root}><EstadoErro mensagem={erro} onTentar={carregar} /></View>;

  return (
    <View style={styles.root}>
      <FlatList
        key={`col-${colunas}`}
        data={dados}
        numColumns={colunas}
        keyExtractor={(i, k) => i?.id ?? `vazio-${k}`}
        columnWrapperStyle={colunas > 1 ? { gap: 12 } : undefined}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={cabecalho}
        ListEmptyComponent={
          <VazioPainel
            titulo={alimentos.length === 0 ? 'Nenhum alimento cadastrado' : 'Nenhum alimento com esses filtros'}
            texto={alimentos.length === 0 ? 'Toque em "Novo alimento" para começar.' : 'Tente tirar algum filtro ou buscar por outro nome.'}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, minWidth: 0 }}>
            {item && <CartaoAlimento item={item} onPress={() => navigation.navigate('AlimentoForm', { alimento: item })} />}
          </View>
        )}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={18}
        windowSize={7}
      />
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  root: { flex: 1, backgroundColor: t.card },
  lista: { padding: 20, paddingBottom: 48, gap: 12 },
  cabecalho: { gap: 12, marginBottom: 4 },
  titulos: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: t.texto },
  subtitulo: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, marginTop: 2 },
  botaoNovo: { paddingHorizontal: 18, minHeight: 46 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.alertaSuave, borderRadius: 12, padding: 12 },
  avisoTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 12, color: t.selos.aviso.texto, lineHeight: 17 },
  linhaFiltros: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  botaoFiltros: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: t.cardBorda, backgroundColor: t.card },
  botaoFiltrosOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  botaoFiltrosTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  limpar: { fontFamily: typography.bold, fontSize: 12, color: t.erro },
  contagem: { marginLeft: 'auto', fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  painelFiltros: { gap: 14, backgroundColor: painel.fundo, borderRadius: 14, padding: 14 },
  rotuloFiltro: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  card: { backgroundColor: t.card, borderRadius: 16, borderWidth: 2, borderColor: t.cardBorda, padding: 14, gap: 10 },
  cardRevisar: { borderColor: t.alerta, backgroundColor: t.alertaSuave },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: t.destaqueSuave },
  iconePrato: { backgroundColor: t.alertaSuave },
  nome: { fontFamily: typography.bold, fontSize: 15, color: t.texto },
  tipo: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, marginTop: 1 },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grupos: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: t.linhaSuave, paddingTop: 8 },
  rodapeTexto: { flex: 1, fontFamily: typography.regular, fontSize: 11, color: t.textoSuave },
  usos: { fontFamily: typography.bold, fontSize: 11, color: t.textoSuave },
}) as const;
