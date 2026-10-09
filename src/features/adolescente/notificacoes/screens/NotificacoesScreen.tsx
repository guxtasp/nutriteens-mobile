// src/features/adolescente/notificacoes/screens/NotificacoesScreen.tsx
//
// Central de Notificações do app: pedidos de amizade, convites e avisos da Chama
// em Dupla, lembrete de fim de dia e missões ainda não cumpridas. Não lidas ficam
// no topo, destacadas e com bolinha; tocar abre a tela que resolve e marca como lida.
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useNotificacoesApp } from '../hooks/useNotificacoesApp';
import type { NotificacaoComLeitura, TipoNotificacaoApp } from '../utils/notificacoesApp';

type Navegacao = NativeStackNavigationProp<AdolescenteStackParamList>;

const COR_CHAMA = '#F0883E';
const COR: Record<TipoNotificacaoApp, string> = {
  pedido_amizade: colors.primaryDark,
  convite_chama: COR_CHAMA,
  receita_amigo: colors.primaryDark,
  aviso_chama: COR_CHAMA,
  lembrete_chama: COR_CHAMA,
  missao_diaria: colors.primaryDark,
  missao_semanal: colors.primaryDark,
  missao_mensal: colors.primaryDark,
};

export default function NotificacoesScreen() {
  const navigation = useNavigation<Navegacao>();
  const { notificacoes, naoLidas, carregando, marcarLida, marcarTodasLidas } = useNotificacoesApp();

  function abrir(n: NotificacaoComLeitura) {
    marcarLida(n.id);
    if (n.destino === 'Receita' && n.params) {
      navigation.navigate('ReceitaCompartilhada', { receitaId: n.params.receitaId });
      return;
    }
    navigation.navigate(n.destino);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <AppText style={styles.titulo}>Notificações</AppText>
        <View style={styles.direita}>
          {naoLidas > 0 && (
            <TouchableOpacity onPress={marcarTodasLidas} accessibilityRole="button" hitSlop={8}>
              <AppText style={styles.marcarTodas}>Marcar todas como lidas</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {carregando && notificacoes.length === 0 ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
          </View>
        ) : notificacoes.length === 0 ? (
          <View style={styles.vazio}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.primary} />
            <AppText style={styles.vazioTitulo}>Tudo em dia!</AppText>
            <AppText style={styles.vazioTexto}>Você não tem nada pendente por aqui.</AppText>
          </View>
        ) : (
          notificacoes.map((n) => (
            <Pressable
              key={n.id}
              style={({ pressed }) => [styles.card, n.lida ? styles.cardLida : styles.cardNova, pressed && styles.cardPressionado]}
              onPress={() => abrir(n)}
              accessibilityRole="button"
              accessibilityLabel={`${n.lida ? 'Lida' : 'Nova'}. ${n.titulo}. ${n.texto}`}
            >
              <View style={[styles.iconeCirculo, { backgroundColor: n.lida ? '#C9D1CB' : COR[n.tipo] }]}>
                <Ionicons name={n.icone as React.ComponentProps<typeof Ionicons>['name']} size={20} color="#fff" />
              </View>
              <View style={styles.corpo}>
                <AppText style={[styles.cardTitulo, n.lida && styles.textoLido]}>{n.titulo}</AppText>
                <AppText style={[styles.cardTexto, n.lida && styles.textoLido]}>{n.texto}</AppText>
              </View>
              {n.lida ? (
                <Ionicons name="chevron-forward" size={20} color={colors.placeholder} />
              ) : (
                <View style={styles.bolinha} />
              )}
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F3F8EE' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 30, marginBottom: 8 },
  titulo: { fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark, marginLeft: 8 },
  direita: { flex: 1, alignItems: 'flex-end' },
  marcarTodas: { fontSize: 12, fontFamily: typography.semiBold, color: colors.primaryDark, textAlign: 'right' },
  conteudo: { paddingHorizontal: 20, paddingBottom: 60, gap: 10 },
  centro: { paddingVertical: 60, alignItems: 'center' },
  vazio: { backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', gap: 6, marginTop: 8 },
  vazioTitulo: { fontSize: 16, fontFamily: typography.bold, color: colors.primaryDark },
  vazioTexto: { fontSize: 13, color: colors.trilhaChipTexto, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, borderWidth: 1 },
  cardNova: { backgroundColor: '#fff', borderColor: colors.primary },
  cardLida: { backgroundColor: '#F8FAF8', borderColor: '#E5E7EB' },
  cardPressionado: { opacity: 0.7 },
  iconeCirculo: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  corpo: { flex: 1 },
  cardTitulo: { fontSize: 14, fontFamily: typography.bold, color: colors.primaryDark },
  cardTexto: { fontSize: 13, lineHeight: 19, color: colors.trilhaChipTexto, marginTop: 2 },
  textoLido: { fontFamily: typography.regular, color: '#8A948D' },
  bolinha: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error },
});
