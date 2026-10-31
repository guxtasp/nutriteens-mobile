// src/features/admin/components/IngredientesPratoSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';
import {
  buscarAlimentosParaSelecao,
  buscarIngredientesDoPrato,
  salvarIngredientesDoPrato,
  IngredientePrato,
  Alimento,
} from '../services/alimentosAdminService';

type Props = { pratoId: string | null }; // null = alimento ainda não foi salvo

export default function IngredientesPratoSection({ pratoId }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [ingredientes, setIngredientes] = useState<IngredientePrato[]>([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [buscou, setBuscou] = useState(false);
  const [textos, setTextos] = useState<Record<string, string>>({}); // o que a pessoa está digitando (permite "0,5")
  const [sujo, setSujo] = useState(false); // há mudança ainda não salva
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  useEffect(() => {
    if (!pratoId) return;
    buscarIngredientesDoPrato(pratoId)
      .then(setIngredientes)
      .catch(console.error)
      .finally(() => setCarregado(true));
  }, [pratoId]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!busca.trim()) {
        setResultados([]);
        setBuscou(false);
        return;
      }
      buscarAlimentosParaSelecao(busca)
        .then((r) => { setResultados(r); setBuscou(true); })
        .catch(() => { setResultados([]); setBuscou(true); });
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  function adicionarIngrediente(alimento: Alimento) {
    if (ingredientes.some((i) => i.ingrediente_id === alimento.id)) return;
    setSujo(true);
    setMsg(null);
    setIngredientes((atual) => [...atual, { ingrediente_id: alimento.id, proporcao: 1, nome: alimento.nome }]);
    setBusca('');
    setResultados([]);
  }

  function removerIngrediente(id: string) {
    setSujo(true);
    setMsg(null);
    setIngredientes((atual) => atual.filter((i) => i.ingrediente_id !== id));
  }

  function alterarProporcao(id: string, texto: string) {
    const valor = parseFloat(texto.replace(',', '.')) || 0;
    setSujo(true);
    setMsg(null);
    setTextos((t) => ({ ...t, [id]: texto }));
    setIngredientes((atual) =>
      atual.map((i) => (i.ingrediente_id === id ? { ...i, proporcao: valor } : i))
    );
  }

  const salvarAgora = useCallback(async () => {
    if (!pratoId) return;
    if (ingredientes.some((i) => !(i.proporcao > 0))) {
      setMsg({ ok: false, texto: 'Informe uma proporção maior que zero em todos os ingredientes.' });
      return;
    }
    setSalvando(true);
    setMsg(null);
    try {
      await salvarIngredientesDoPrato(
        pratoId,
        ingredientes.map((i) => ({ ingrediente_id: i.ingrediente_id, proporcao: i.proporcao }))
      );
      setSujo(false);
      setMsg({ ok: true, texto: 'Ingredientes salvos.' });
    } catch (e: any) {
      console.error('Erro ao salvar ingredientes do prato:', e);
      setMsg({ ok: false, texto: e?.message ?? 'Não foi possível salvar os ingredientes. Tente de novo.' });
    } finally {
      setSalvando(false);
    }
  }, [pratoId, ingredientes]);

  const disponiveis = resultados.filter((r) => r.id !== pratoId && !ingredientes.some((i) => i.ingrediente_id === r.id));

  if (!pratoId) {
    return (
      <View style={styles.avisoBox}>
        <AppText style={styles.avisoTexto}>
          Salve o alimento primeiro pra poder adicionar os ingredientes do prato.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.passos}>
        <AppText style={styles.passo}>1. Busque um alimento pelo nome e toque nele para incluir no prato.</AppText>
        <AppText style={styles.passo}>2. Ajuste a proporção de cada um (quanto entra em relação aos outros; 1 = uma parte).</AppText>
        <AppText style={styles.passo}>3. Toque em "Salvar ingredientes". Só depois disso o prato fica com a lista.</AppText>
      </View>

      <AppText style={styles.label}>Adicionar ingrediente</AppText>
      <TextInput
        style={styles.input}
        placeholder="Digite o nome do alimento (ex.: arroz)"
        placeholderTextColor={tema.placeholder}
        value={busca}
        onChangeText={setBusca}
        accessibilityLabel="Buscar alimento para adicionar ao prato"
      />

      {disponiveis.length > 0 && (
        <View style={styles.resultadosBox}>
          {disponiveis.map((item) => (
            <Pressable key={item.id} style={styles.resultadoItem} onPress={() => adicionarIngrediente(item)} accessibilityRole="button" accessibilityLabel={`Adicionar ${item.nome}`}>
              <AppText style={styles.resultadoTexto}>{item.nome}</AppText>
              <View style={styles.addBox}>
                <Ionicons name="add-circle" size={18} color={tema.texto} />
                <AppText style={styles.addTexto}>Adicionar</AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}
      {buscou && busca.trim() !== '' && disponiveis.length === 0 && (
        <AppText style={styles.vazio}>
          {resultados.length > 0 ? 'Todos os alimentos encontrados já estão no prato.' : 'Nenhum alimento encontrado. Cadastre o ingrediente no catálogo (aba Alimentos) e volte aqui.'}
        </AppText>
      )}

      <AppText style={[styles.label, { marginTop: 8 }]}>No prato ({ingredientes.length})</AppText>
      {carregado && ingredientes.length === 0 && (
        <AppText style={styles.vazio}>Nenhum ingrediente adicionado ainda.</AppText>
      )}

      {ingredientes.length > 0 && (
        <View style={styles.cabecalhoLista}>
          <AppText style={[styles.cabecalhoTexto, { flex: 1 }]}>Ingrediente</AppText>
          <AppText style={[styles.cabecalhoTexto, { width: 56, textAlign: 'center' }]}>Proporção</AppText>
          <View style={{ width: 18 }} />
        </View>
      )}
      {ingredientes.map((item) => (
        <View key={item.ingrediente_id} style={styles.linhaIngrediente}>
          <AppText style={styles.nomeIngrediente}>{item.nome ?? item.ingrediente_id}</AppText>
          <TextInput
            style={styles.inputProporcao}
            keyboardType="decimal-pad"
            value={textos[item.ingrediente_id] ?? String(item.proporcao).replace('.', ',')}
            onChangeText={(texto) => alterarProporcao(item.ingrediente_id, texto)}
            accessibilityLabel={`Proporção de ${item.nome ?? 'ingrediente'}`}
          />
          <Pressable onPress={() => removerIngrediente(item.ingrediente_id)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remover ${item.nome ?? 'ingrediente'}`}>
            <Ionicons name="trash-outline" size={18} color="#D64545" />
          </Pressable>
        </View>
      ))}

      {sujo && <AppText style={styles.pendente}>Há mudanças que ainda não foram salvas.</AppText>}
      {!!msg && <AppText style={[styles.msg, { color: msg.ok ? tema.texto : tema.erro }]}>{msg.texto}</AppText>}

      <Pressable style={[styles.botaoSalvar, !sujo && { opacity: 0.6 }]} onPress={salvarAgora} disabled={salvando} accessibilityRole="button">
        <AppText style={styles.botaoSalvarTexto}>
          {salvando ? 'SALVANDO...' : 'SALVAR INGREDIENTES'}
        </AppText>
      </Pressable>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  container: { marginTop: 16 },
  passos: { backgroundColor: t.superficieSuave, borderRadius: 10, padding: 12, gap: 4, marginBottom: 12 },
  passo: { fontFamily: typography.regular, fontSize: 12, color: t.textoCorpo, lineHeight: 17 },
  addBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addTexto: { fontFamily: typography.bold, fontSize: 12, color: t.texto },
  cabecalhoLista: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  cabecalhoTexto: { fontFamily: typography.bold, fontSize: 11, color: t.textoSuave },
  pendente: { marginTop: 8, fontFamily: typography.semiBold, fontSize: 12, color: t.selos.aviso.texto },
  msg: { marginTop: 8, fontFamily: typography.semiBold, fontSize: 12 },
  label: { fontFamily: typography.bold, fontSize: 13, color: t.texto, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: t.chipBorda, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: typography.regular, fontSize: 14, color: t.texto, marginBottom: 8,
  },
  resultadosBox: { borderWidth: 1, borderColor: t.chipBorda, borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  resultadoItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: t.linhaSuave,
  },
  resultadoTexto: { fontFamily: typography.regular, fontSize: 13, color: t.texto },
  vazio: { fontFamily: typography.regular, fontSize: 12, color: t.placeholder, marginBottom: 8 },
  linhaIngrediente: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.linhaSuave,
  },
  nomeIngrediente: { flex: 1, fontFamily: typography.regular, fontSize: 13, color: t.texto },
  inputProporcao: {
    width: 56, borderWidth: 1, borderColor: t.chipBorda, borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8, textAlign: 'center', fontSize: 13,
  },
  botaoSalvar: { marginTop: 12, backgroundColor: t.botaoFundo, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  botaoSalvarTexto: { fontFamily: typography.bold, fontSize: 12, color: t.botaoTexto },
  avisoBox: { marginTop: 16, backgroundColor: t.alertaSuave, borderRadius: 10, padding: 12 },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: t.selos.aviso.texto },
}) as const;