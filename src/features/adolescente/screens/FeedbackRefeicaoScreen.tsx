// src/features/adolescente/screens/FeedbackRefeicaoScreen.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList, 'FeedbackRefeicao'>;
type RouteProps = RouteProp<AdolescenteStackParamList, 'FeedbackRefeicao'>;

export default function FeedbackRefeicaoScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { params } = useRoute<RouteProps>();

  function continuar() {
    // limpa toda a pilha do fluxo de alimentação e volta pra Home
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] })
    );
  }

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.conteudo}>
        <Ionicons name="chatbox-ellipses" size={48} color="#8BC34A" style={{ marginBottom: 8 }} />
        <AppText style={styles.titulo}>{params.nomeRefeicao}</AppText>

        <AppText style={styles.pergunta}>Olha, aqui está o seu resumo</AppText>

        <View style={styles.caixa}>
          <AppText style={styles.mensagem}>{params.mensagemEducativa}</AppText>
        </View>
      </View>

      <Pressable style={styles.botaoContinuar} onPress={continuar}>
        <AppText style={styles.botaoTexto}>CONTINUAR</AppText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#1F5138', paddingHorizontal: 24, paddingVertical: 40, justifyContent: 'space-between' },
  conteudo: { alignItems: 'center', marginTop: 60 },
  titulo: { fontFamily: typography.bold, fontSize: 24, color: '#8BC34A', marginBottom: 32 },
  pergunta: { fontFamily: typography.bold, fontSize: 18, color: '#8BC34A', marginBottom: 20, textAlign: 'center' },
  caixa: { borderWidth: 1.5, borderColor: '#8BC34A', borderRadius: 16, padding: 20, width: '100%' },
  mensagem: { fontFamily: typography.medium, fontSize: 14, color: '#8BC34A', textAlign: 'center', lineHeight: 20 },
  botaoContinuar: { backgroundColor: '#fff', borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#1F5138', letterSpacing: 0.5 },
});