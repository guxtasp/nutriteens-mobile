// src/features/admin/components/IngredientesPratoSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import {
  buscarAlimentosParaSelecao,
  buscarIngredientesDoPrato,
  salvarIngredientesDoPrato,
  IngredientePrato,
  Alimento,
} from '../services/alimentosAdminService';

type Props = { pratoId: string | null }; // null = alimento ainda não foi salvo

export default function IngredientesPratoSection({ pratoId }: Props) {
  const [ingredientes, setIngredientes] = useState<IngredientePrato[]>([]);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [carregado, setCarregado] = useState(false);

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
        return;
      }
      buscarAlimentosParaSelecao(busca).then(setResultados).catch(() => setResultados([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [busca]);

  function adicionarIngrediente(alimento: Alimento) {
    if (ingredientes.some((i) => i.ingrediente_id === alimento.id)) return;
    setIngredientes((atual) => [...atual, { ingrediente_id: alimento.id, proporcao: 1, nome: alimento.nome }]);
    setBusca('');
    setResultados([]);
  }

  function removerIngrediente(id: string) {
    setIngredientes((atual) => atual.filter((i) => i.ingrediente_id !== id));
  }

  function alterarProporcao(id: string, texto: string) {
    const valor = parseFloat(texto.replace(',', '.')) || 0;
    setIngredientes((atual) =>
      atual.map((i) => (i.ingrediente_id === id ? { ...i, proporcao: valor } : i))
    );
  }

  const salvarAgora = useCallback(async () => {
    if (!pratoId) return;
    setSalvando(true);
    try {
      await salvarIngredientesDoPrato(
        pratoId,
        ingredientes.map((i) => ({ ingrediente_id: i.ingrediente_id, proporcao: i.proporcao }))
      );
    } catch (e) {
      console.error('Erro ao salvar ingredientes do prato:', e);
    } finally {
      setSalvando(false);
    }
  }, [pratoId, ingredientes]);

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
      <AppText style={styles.label}>Ingredientes do prato</AppText>

      <TextInput
        style={styles.input}
        placeholder="Buscar alimento pra adicionar..."
        value={busca}
        onChangeText={setBusca}
      />

      {resultados.length > 0 && (
        <View style={styles.resultadosBox}>
          {resultados.map((item) => (
            <Pressable key={item.id} style={styles.resultadoItem} onPress={() => adicionarIngrediente(item)}>
              <AppText style={styles.resultadoTexto}>{item.nome}</AppText>
              <Ionicons name="add-circle" size={18} color={colors.primaryDark} />
            </Pressable>
          ))}
        </View>
      )}

      {carregado && ingredientes.length === 0 && (
        <AppText style={styles.vazio}>Nenhum ingrediente adicionado ainda.</AppText>
      )}

      {ingredientes.map((item) => (
        <View key={item.ingrediente_id} style={styles.linhaIngrediente}>
          <AppText style={styles.nomeIngrediente}>{item.nome ?? item.ingrediente_id}</AppText>
          <TextInput
            style={styles.inputProporcao}
            keyboardType="decimal-pad"
            value={String(item.proporcao)}
            onChangeText={(texto) => alterarProporcao(item.ingrediente_id, texto)}
          />
          <Pressable onPress={() => removerIngrediente(item.ingrediente_id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={18} color="#D64545" />
          </Pressable>
        </View>
      ))}

      <Pressable style={styles.botaoSalvar} onPress={salvarAgora} disabled={salvando}>
        <AppText style={styles.botaoSalvarTexto}>
          {salvando ? 'SALVANDO...' : 'SALVAR INGREDIENTES'}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  label: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark, marginBottom: 8,
  },
  resultadosBox: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 8, marginBottom: 12, overflow: 'hidden' },
  resultadoItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  resultadoTexto: { fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark },
  vazio: { fontFamily: typography.regular, fontSize: 12, color: '#9AA5A0', marginBottom: 8 },
  linhaIngrediente: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  nomeIngrediente: { flex: 1, fontFamily: typography.regular, fontSize: 13, color: colors.primaryDark },
  inputProporcao: {
    width: 56, borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 6,
    paddingVertical: 4, paddingHorizontal: 8, textAlign: 'center', fontSize: 13,
  },
  botaoSalvar: { marginTop: 12, backgroundColor: colors.primaryDark, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  botaoSalvarTexto: { fontFamily: typography.bold, fontSize: 12, color: '#fff' },
  avisoBox: { marginTop: 16, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12 },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: '#8A6D00' },
});