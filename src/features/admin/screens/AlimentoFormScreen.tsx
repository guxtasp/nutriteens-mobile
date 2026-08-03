import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { OptionButton } from '../../../shared/ui/OptionButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import {
  Alimento,
  ClassificacaoNova,
  GrupoAlimentar,
  criarAlimento,
  atualizarAlimento,
  excluirAlimento,
} from '../services/alimentosAdminService';

const CLASSIFICACOES: ClassificacaoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];
const GRUPOS: GrupoAlimentar[] = [
  'CEREAIS_E_TUBERCULOS', 'LEGUMES_E_VERDURAS', 'FRUTAS', 'LEITE_E_DERIVADOS',
  'CARNES_E_OVOS', 'LEGUMINOSAS', 'OLEAGINOSAS_E_SEMENTES', 'OLEOS_E_GORDURAS',
  'ACUCARES_E_DOCES', 'BEBIDAS',
];

export default function AlimentoFormScreen({ navigation, route }: any) {
  const existente: Alimento | undefined = route.params?.alimento;

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [ehPratoComposto, setEhPratoComposto] = useState(existente?.eh_prato_composto ?? false);
  const [classificacao, setClassificacao] = useState<ClassificacaoNova | null>(
    existente?.classificacao_nova ?? null
  );
  const [acessivelEbia, setAcessivelEbia] = useState(existente?.acessivel_ebia ?? true);
  const [grupos, setGrupos] = useState<Set<GrupoAlimentar>>(new Set(existente?.grupos_alimentares ?? []));
  const [salvando, setSalvando] = useState(false);

  function alternarGrupo(grupo: GrupoAlimentar) {
    setGrupos((atual) => {
      const novo = new Set(atual);
      novo.has(grupo) ? novo.delete(grupo) : novo.add(grupo);
      return novo;
    });
  }

  const podeSalvar = nome.trim().length > 0 && classificacao !== null && grupos.size > 0;

  async function salvar() {
    if (!podeSalvar || !classificacao) return;
    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        eh_prato_composto: ehPratoComposto,
        classificacao_nova: classificacao,
        acessivel_ebia: acessivelEbia,
        grupos_alimentares: Array.from(grupos),
      };
      if (existente) {
        await atualizarAlimento(existente.id, payload);
      } else {
        await criarAlimento(payload);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erro ao salvar', e.message ?? 'Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    if (!existente) return;
    Alert.alert('Excluir alimento?', `Isso remove "${existente.nome}" do catálogo.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await excluirAlimento(existente.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <AppText style={styles.label}>Nome</AppText>
      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Ex: Pizza"
        style={styles.input}
      />

      <View style={styles.linhaSwitch}>
        <AppText style={styles.label}>É prato composto?</AppText>
        <Switch value={ehPratoComposto} onValueChange={setEhPratoComposto} />
      </View>

      <View style={styles.linhaSwitch}>
        <AppText style={styles.label}>Acessível no EBIA?</AppText>
        <Switch value={acessivelEbia} onValueChange={setAcessivelEbia} />
      </View>

      <AppText style={styles.label}>Classificação NOVA</AppText>
      <View style={styles.grid}>
        {CLASSIFICACOES.map((c) => (
          <OptionButton
            key={c}
            label={c.replace(/_/g, ' ')}
            ativo={classificacao === c}
            onPress={() => setClassificacao(c)}
            style={styles.chip}
          />
        ))}
      </View>

      <AppText style={styles.label}>Grupos alimentares</AppText>
      <View style={styles.grid}>
        {GRUPOS.map((g) => (
          <OptionButton
            key={g}
            label={g.replace(/_/g, ' ')}
            ativo={grupos.has(g)}
            onPress={() => alternarGrupo(g)}
            style={styles.chip}
          />
        ))}
      </View>

      <AppButton
        label={salvando ? 'SALVANDO...' : 'SALVAR'}
        backgroundColor={podeSalvar ? colors.primaryDark : '#B8B8B8'}
        textColor={colors.white}
        shadowColor="#123024"
        fullWidth
        disabled={!podeSalvar || salvando}
        onPress={salvar}
        style={styles.botaoSalvar}
      />

      {existente && (
        <AppButton
          label="EXCLUIR"
          backgroundColor={colors.white}
          textColor="#D64545"
          shadowColor="transparent"
          fullWidth
          onPress={confirmarExclusao}
          style={styles.botaoExcluir}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingBottom: 60 },
  label: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark,
  },
  linhaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, minWidth: 0 },
  botaoSalvar: { marginTop: 32 },
  botaoExcluir: { marginTop: 12, borderWidth: 1, borderColor: '#D64545' },
});