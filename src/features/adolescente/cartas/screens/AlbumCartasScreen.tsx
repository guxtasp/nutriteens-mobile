// src/features/adolescente/cartas/screens/AlbumCartasScreen.tsx
//
// Álbum das 10 cartas dos passos do Guia Alimentar. As cartas são concedidas pelo
// banco (por hábito/lição) e são privadas: nenhum amigo vê o álbum.
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../../shared/ui/AppText';
import { BackButton } from '../../../../shared/ui/BackButton';
import { ProgressBar } from '../../../../shared/ui/ProgressBar';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { useCartas } from '../hooks/useCartas';
import { textoCartasNovas, type CartaGuia } from '../utils/cartas';
import { CartaTile } from '../components/CartaTile';
import { CartaDetalheModal } from '../components/CartaDetalheModal';

const FUNDO = '#F3F8EE';
const MARGEM = 20;
const ESPACO = 14;

export default function AlbumCartasScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { cartas, progresso, novas, carregando, erro, recarregar, marcarVista } = useCartas();
  const [selecionada, setSelecionada] = useState<CartaGuia | null>(null);

  const larguraCarta = (width - MARGEM * 2 - ESPACO) / 2;
  const aviso = textoCartasNovas(novas);

  function abrir(carta: CartaGuia) {
    setSelecionada(carta);
    if (carta.nova) marcarVista(carta.id);
  }

  return (
    <SafeAreaView style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <AppText style={styles.titulo}>Álbum do Guia</AppText>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.resumo}>
          <View style={styles.resumoLinha}>
            <AppText style={styles.resumoTitulo}>
              {progresso.completo ? 'Álbum completo! 🎉' : 'Colecione os 10 passos'}
            </AppText>
            <AppText style={styles.resumoContagem}>
              {progresso.obtidas} de {progresso.total || 10}
            </AppText>
          </View>
          <ProgressBar progress={progresso.fracao} />
          <AppText style={styles.resumoTexto}>
            Cada carta é um passo do Guia Alimentar para a População Brasileira. Conforme você aprende e cuida da sua
            alimentação, elas são desbloqueadas.
          </AppText>
        </View>

        {aviso && (
          <View style={styles.aviso} accessibilityLiveRegion="polite">
            <AppText style={styles.avisoTexto}>🎉 {aviso}</AppText>
          </View>
        )}

        {carregando ? (
          <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
        ) : erro ? (
          <View style={styles.vazio}>
            <AppText style={styles.vazioTexto}>Não deu para carregar as cartas agora.</AppText>
            <Pressable style={styles.botao} onPress={() => void recarregar()} accessibilityRole="button">
              <AppText style={styles.botaoTexto}>Tentar de novo</AppText>
            </Pressable>
          </View>
        ) : cartas.length === 0 ? (
          <View style={styles.vazio}>
            <AppText style={styles.vazioTexto}>As cartas ainda não estão disponíveis.</AppText>
          </View>
        ) : (
          <View style={styles.grade}>
            {cartas.map((carta) => (
              <CartaTile key={carta.id} carta={carta} largura={larguraCarta} onPress={abrir} />
            ))}
          </View>
        )}
      </ScrollView>

      <CartaDetalheModal carta={selecionada} onFechar={() => setSelecionada(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: FUNDO },
  conteudo: { paddingHorizontal: MARGEM, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 30, marginBottom: 16 },
  titulo: { flex: 1, textAlign: 'center', fontSize: 18, fontFamily: typography.bold, color: colors.primaryDark },
  resumo: { backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 10 },
  resumoLinha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumoTitulo: { fontSize: 15, fontFamily: typography.bold, color: colors.primaryDark },
  resumoContagem: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark },
  resumoTexto: { fontSize: 12, lineHeight: 18, color: colors.trilhaChipTexto },
  aviso: { marginTop: 14, backgroundColor: colors.exercicioAcertoFundo, borderRadius: 14, padding: 12, alignItems: 'center' },
  avisoTexto: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: ESPACO, marginTop: 18 },
  vazio: { alignItems: 'center', gap: 14, marginTop: 40 },
  vazioTexto: { fontSize: 14, color: colors.primaryDark, textAlign: 'center' },
  botao: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
});
