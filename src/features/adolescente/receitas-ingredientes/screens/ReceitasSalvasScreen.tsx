// src/features/adolescente/receitas-ingredientes/screens/ReceitasSalvasScreen.tsx
//
// "Receitas salvas": as que a pessoa marcou pra fazer depois, da mais recente para a mais antiga.
// Abre pelo Comer (linha logo abaixo de Receitas) e pelo marcador no cabeçalho de "Receitas com o
// que tenho". Tocar abre a mesma tela da receita, já dizendo o que tem e o que falta em casa.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { AppButton } from '../../../../shared/ui/AppButton';
import { ScreenHeader } from '../../../../shared/ui/ScreenHeader';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useAuth } from '../../../../shared/contexts/AuthContext';
import { listarReceitasComIngredientes, type ReceitaComIngredientes } from '../../alimentacao/services/receitasService';
import { useAlimentacao } from '../../alimentacao/contexts/AlimentacaoContext';
import { EnviarReceitaSheet } from '../../social/components/EnviarReceitaSheet';
import ReceitaCasaTela from '../components/ReceitaCasaTela';
import { useReceitasSalvas } from '../hooks/useReceitasSalvas';
import { lerDespensa } from '../utils/despensa';
import { idsDaDespensa, nomeLegivel, pontuar, type IngredienteCasa, type ReceitaPontuada } from '../utils/combinarReceitas';
import { receitasNaOrdemSalva, textoQuantidadeSalvas } from '../utils/receitasSalvas';

type Nav = NativeStackNavigationProp<AdolescenteStackParamList, 'ReceitasSalvas'>;
type Pontuada = ReceitaPontuada<ReceitaComIngredientes>;

const ROTULO_DIFICULDADE: Record<string, string> = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

export default function ReceitasSalvasScreen() {
  const navigation = useNavigation<Nav>();
  const { userId } = useAuth();
  const { adicionarAoCarrinho } = useAlimentacao();
  const { salvas, alternar, ehSalva } = useReceitasSalvas();
  const [receitas, setReceitas] = useState<ReceitaComIngredientes[] | null>(null);
  const [despensa, setDespensa] = useState<IngredienteCasa[]>([]);
  const [erro, setErro] = useState(false);
  const [aberta, setAberta] = useState<Pontuada | null>(null);
  const [paraEnviar, setParaEnviar] = useState<{ id: string; titulo: string } | null>(null);

  const carregar = useCallback(async () => {
    if (!userId) return;
    setErro(false);
    try {
      const [lista, casa] = await Promise.all([listarReceitasComIngredientes(userId), lerDespensa(userId)]);
      setReceitas(lista);
      setDespensa(casa);
    } catch (e) {
      console.error('Erro ao carregar receitas salvas:', e);
      setErro(true);
    }
  }, [userId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const ids = useMemo(() => idsDaDespensa(despensa), [despensa]);
  const lista: Pontuada[] = useMemo(
    () => (receitas ? receitasNaOrdemSalva(salvas, receitas).map((r) => pontuar(r, ids)) : []),
    [receitas, salvas, ids],
  );

  function status(p: Pontuada): string {
    const total = p.receita.ingredientes.length;
    if (despensa.length === 0 || total === 0) return `${total} ${total === 1 ? 'ingrediente' : 'ingredientes'}`;
    if (p.faltam.length === 0) return 'Você tem tudo pra fazer agora';
    return `Falta: ${p.faltam.map((i) => nomeLegivel(i.nome)).join(', ')}`;
  }

  function adicionarAoRegistro(r: ReceitaComIngredientes) {
    adicionarAoCarrinho(r.alimento_resultante);
    setAberta(null);
    // um Modal ainda fechando atrapalha a navegação no iOS: espera ele sair
    setTimeout(() => navigation.navigate('TipoRefeicao'), 450);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScreenHeader titulo="Receitas salvas" subtitulo={textoQuantidadeSalvas(lista.length)} onVoltar={() => navigation.goBack()} />

      {receitas === null && !erro ? (
        <ActivityIndicator color={colors.primary} style={styles.carregando} />
      ) : erro ? (
        <View style={styles.vazio}>
          <AppText style={styles.vazioTexto}>Não deu pra carregar as receitas agora. Confira a internet e tente de novo.</AppText>
          <AppButton label="TENTAR DE NOVO" onPress={() => void carregar()} />
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.vazio}>
          <View style={styles.vazioIcone}>
            <Ionicons name="bookmark-outline" size={32} color={colors.destaqueTexto} />
          </View>
          <AppText style={styles.vazioTitulo}>Nenhuma receita salva ainda</AppText>
          <AppText style={styles.vazioTexto}>
            Abra uma receita e toque em "Salvar pra fazer depois". Ela aparece aqui pra você achar rapidinho.
          </AppText>
          <AppButton
            label="VER RECEITAS"
            textColor={colors.primaryDark}
            onPress={() => navigation.navigate('ReceitasIngredientes')}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          {lista.map((p) => {
            const r = p.receita;
            const tudo = despensa.length > 0 && r.ingredientes.length > 0 && p.faltam.length === 0;
            return (
              <View key={r.id} style={styles.cartao}>
                <Pressable
                  style={({ pressed }) => [styles.cartaoCorpo, pressed && styles.pressionado]}
                  onPress={() => setAberta(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${r.titulo}. ${status(p)}`}
                >
                  {r.foto_url ? (
                    <Image source={{ uri: r.foto_url }} style={styles.foto} resizeMode="cover" />
                  ) : (
                    <View style={[styles.foto, styles.fotoVazia]}>
                      <Ionicons name="restaurant-outline" size={24} color={colors.destaqueTexto} />
                    </View>
                  )}
                  <View style={styles.textos}>
                    <AppText style={styles.titulo} numberOfLines={2}>{r.titulo}</AppText>
                    <AppText style={styles.meta}>
                      {r.tempo_preparo_min ? `${r.tempo_preparo_min} min • ` : ''}
                      {ROTULO_DIFICULDADE[r.dificuldade] ?? ''}
                    </AppText>
                    <AppText style={[styles.status, tudo && styles.statusOk]} numberOfLines={2}>{status(p)}</AppText>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => alternar(r.id)}
                  style={styles.tirar}
                  accessibilityRole="button"
                  accessibilityLabel={`Tirar ${r.titulo} das salvas`}
                >
                  <Ionicons name="bookmark" size={22} color={colors.destaqueTexto} />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}

      <ReceitaCasaTela
        item={aberta}
        temDespensa={despensa.length > 0}
        onFechar={() => setAberta(null)}
        onAdicionarAoRegistro={adicionarAoRegistro}
        salva={!!aberta && ehSalva(aberta.receita.id)}
        onAlternarSalva={(r) => alternar(r.id)}
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
  carregando: { marginTop: 40 },
  conteudo: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32, gap: 12 },
  cartao: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.bordaSuave, borderRadius: 20, overflow: 'hidden' },
  cartaoCorpo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  pressionado: { backgroundColor: colors.superficieSuave },
  foto: { width: 72, height: 72, borderRadius: 14, backgroundColor: colors.exercicioAcertoFundo },
  fotoVazia: { alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 3 },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  meta: { fontFamily: typography.regular, fontSize: 12, color: colors.textoSuave },
  status: { fontFamily: typography.regular, fontSize: 12, color: colors.textoCorrido },
  statusOk: { fontFamily: typography.bold, color: colors.destaqueTexto },
  tirar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  vazioIcone: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.exercicioAcertoFundo, alignItems: 'center', justifyContent: 'center' },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark, textAlign: 'center' },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.textoSuave, textAlign: 'center' },
});
