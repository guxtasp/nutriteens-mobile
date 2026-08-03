// src/features/admin/screens/AdminHomeScreen.tsx
import React from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { supabase } from '../../../lib/supabase'; // ajuste pro caminho real do client de vocês

const ITENS = [
  { rota: 'AlimentosList', label: 'Catálogo de alimentos' },
  { rota: 'Usuarios', label: 'Usuários e instituições' },
  { rota: 'Metricas', label: 'Métricas do app' },
];

export default function AdminHomeScreen({ navigation }: any) {
  async function handleSair() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro ao sair', error.message);
    }
    // não precisa navegar manualmente: o listener de auth no RootNavigator
    // deve trocar pra tela de login sozinho quando a sessão cair
  }

  return (
    <View style={styles.root}>
      <AppText style={styles.titulo}>Administração</AppText>
      {ITENS.map((item) => (
        <Pressable key={item.rota} style={styles.item} onPress={() => navigation.navigate(item.rota)}>
          <AppText style={styles.itemTexto}>{item.label}</AppText>
        </Pressable>
      ))}

      <Pressable style={styles.sairBotao} onPress={handleSair}>
        <AppText style={styles.sairTexto}>Sair</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, padding: 24, paddingTop: 60 },
  titulo: { fontFamily: typography.bold, fontSize: 22, color: colors.primaryDark, marginBottom: 24 },
  item: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 16, marginBottom: 12 },
  itemTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  sairBotao: {
    marginTop: 'auto',
    borderWidth: 1,
    borderColor: '#E04B4B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  sairTexto: { fontFamily: typography.bold, fontSize: 15, color: '#E04B4B' },
});