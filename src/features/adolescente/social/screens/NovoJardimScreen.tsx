// src/features/adolescente/social/screens/NovoJardimScreen.tsx
//
// Escolher a planta do novo jardim. Tocar numa planta já planta e abre o jardim novo (para convidar os amigos).
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';
import CabecalhoTela from '../components/CabecalhoTela';
import { CEU, mensagemErroJardim } from '../components/JardimPecas';
import JardimBotao from '../components/JardimBotao';
import PlantaJardim from '../components/PlantaJardim';
import { criarJardim } from '../services/jardimService';
import { TEMAS_JARDIM, type TemaJardim } from '../utils/jardim';

export default function NovoJardimScreen() {
  const navigation = useNavigation<any>();
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  function voltar() {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Jardim');
  }

  async function plantar(tema: TemaJardim) {
    feedbackToque();
    setAviso(null);
    setOcupado(true);
    try {
      const id = await criarJardim(tema);
      navigation.replace('JardimDetalhe', { id });
    } catch (e) {
      setAviso(mensagemErroJardim(e));
      setOcupado(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela} edges={['top']}>
      <CabecalhoTela titulo="Novo jardim" aoVoltar={voltar} />
      <ScrollView contentContainerStyle={estilos.conteudo} showsVerticalScrollIndicator={false}>
        <AppText style={estilos.titulo}>Qual planta vocês vão cuidar?</AppText>
        <AppText style={estilos.sub}>Toque numa planta para plantar. Depois é só chamar os amigos.</AppText>

        {!!aviso && (
          <View style={estilos.msgCaixa} accessibilityRole="alert">
            <Ionicons name="information-circle" size={18} color={colors.primaryDark} />
            <AppText style={estilos.msgTexto}>{aviso}</AppText>
          </View>
        )}

        <View style={estilos.temas}>
          {TEMAS_JARDIM.map((t) => (
            <Pressable
              key={t.tema}
              onPress={ocupado ? undefined : () => void plantar(t.tema)}
              accessibilityRole="button"
              accessibilityLabel={`Plantar ${t.nome}. ${t.descricao}`}
              style={({ pressed }) => [estilos.tema, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }, ocupado && { opacity: 0.5 }]}
            >
              <LinearGradient colors={CEU[t.tema]} style={estilos.temaCeu}>
                <PlantaJardim tema={t.tema} estagio={6} tamanho={96} animar={false} />
              </LinearGradient>
              <AppText style={estilos.temaNome}>{t.nome}</AppText>
              <AppText style={estilos.temaDescricao}>{t.descricao}</AppText>
            </Pressable>
          ))}
        </View>

        <JardimBotao variante="contorno" label="CANCELAR" desabilitado={ocupado} onPress={voltar} />
      </ScrollView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#F8FAF8' },
  conteudo: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 48, gap: 12 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#5A6B64' },
  msgCaixa: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EAF5DD', borderRadius: 14, padding: 12 },
  msgTexto: { flex: 1, fontFamily: typography.semiBold, fontSize: 13, lineHeight: 18, color: colors.primaryDark },
  temas: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tema: { width: '47.5%', borderRadius: 18, borderWidth: 2, borderBottomWidth: 4, borderColor: '#E4E9E6', overflow: 'hidden', paddingBottom: 10, alignItems: 'center', gap: 2, backgroundColor: colors.white },
  temaCeu: { width: '100%', alignItems: 'center', paddingTop: 8 },
  temaNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginTop: 6 },
  temaDescricao: { fontFamily: typography.regular, fontSize: 11, lineHeight: 15, color: '#5A6B64', textAlign: 'center', paddingHorizontal: 8 },
});
