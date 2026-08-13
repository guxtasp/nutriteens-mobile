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
import IngredientesPratoSection from '../components/IngredientesPratoSection';

const CLASSIFICACOES: ClassificacaoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];
const GRUPOS: GrupoAlimentar[] = [
  'CEREAIS_E_TUBERCULOS', 'LEGUMES_E_VERDURAS', 'FRUTAS', 'LEITE_E_DERIVADOS',
  'CARNES_E_OVOS', 'LEGUMINOSAS', 'OLEAGINOSAS_E_SEMENTES', 'OLEOS_E_GORDURAS',
  'ACUCARES_E_DOCES', 'BEBIDAS',
];

type ClassificacaoEbia = 'SEGURANCA_ALIMENTAR' | 'INSEGURANCA_LEVE' | 'INSEGURANCA_MODERADA' | 'INSEGURANCA_GRAVE';

// ordem = severidade crescente, igual ao enum do banco — usado só aqui pro rótulo
const NIVEIS_EBIA: { valor: ClassificacaoEbia; rotulo: string }[] = [
  { valor: 'SEGURANCA_ALIMENTAR', rotulo: 'Só quando não há insegurança alimentar' },
  { valor: 'INSEGURANCA_LEVE', rotulo: 'Até insegurança leve' },
  { valor: 'INSEGURANCA_MODERADA', rotulo: 'Até insegurança moderada' },
  { valor: 'INSEGURANCA_GRAVE', rotulo: 'Acessível em qualquer situação (padrão)' },
];

export default function AlimentoFormScreen({ navigation, route }: any) {
  const existente: (Alimento & { nivel_maximo_ebia?: ClassificacaoEbia }) | undefined = route.params?.alimento;
  const [idSalvo, setIdSalvo] = useState<string | null>(existente?.id ?? null);

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [ehPratoComposto, setEhPratoComposto] = useState(existente?.eh_prato_composto ?? false);
  const [classificacao, setClassificacao] = useState<ClassificacaoNova | null>(
    existente?.classificacao_nova ?? null
  );
  const [acessivelEbia, setAcessivelEbia] = useState(existente?.acessivel_ebia ?? true);
  const [nivelMaximoEbia, setNivelMaximoEbia] = useState<ClassificacaoEbia>(
    existente?.nivel_maximo_ebia ?? 'INSEGURANCA_GRAVE'
  );
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
        nivel_maximo_ebia: nivelMaximoEbia,
        grupos_alimentares: Array.from(grupos),
      };
      if (existente) {
        await atualizarAlimento(existente.id, payload as any);
        setIdSalvo(existente.id);
      } else {
        const novo = await criarAlimento(payload as any); // ver nota abaixo sobre o retorno
        setIdSalvo(novo?.id ?? null);
      }
      if (!ehPratoComposto) {
        navigation.goBack();
      }
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

      {/* Escala EBIA: uso interno só pra filtrar o que aparece na busca do
          adolescente conforme a classificação dele. Nunca é mostrada pra ele. */}
      <AppText style={styles.label}>Escala EBIA (uso interno — não aparece pro adolescente)</AppText>
      <AppText style={styles.ajuda}>
        Define até qual nível de insegurança alimentar esse alimento continua aparecendo pra ele na busca.
      </AppText>
      <View style={styles.grid}>
        {NIVEIS_EBIA.map((n) => (
          <OptionButton
            key={n.valor}
            label={n.rotulo}
            ativo={nivelMaximoEbia === n.valor}
            onPress={() => setNivelMaximoEbia(n.valor)}
            style={styles.chipLargo}
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

      {ehPratoComposto && <IngredientesPratoSection pratoId={idSalvo} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  content: { padding: 24, paddingBottom: 60 },
  label: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginTop: 16, marginBottom: 8 },
  ajuda: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginBottom: 8, marginTop: -4 },
  input: {
    borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: typography.regular, fontSize: 14, color: colors.primaryDark,
  },
  linhaSwitch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 10, minWidth: 0 },
  chipLargo: { paddingHorizontal: 12, paddingVertical: 10, minWidth: '100%' },
  botaoSalvar: { marginTop: 32 },
  botaoExcluir: { marginTop: 12, borderWidth: 1, borderColor: '#D64545' },
});