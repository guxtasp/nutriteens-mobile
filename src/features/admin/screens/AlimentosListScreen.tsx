import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { Alimento, listarAlimentos } from '../services/alimentosAdminService';

export default function AlimentosListScreen({ navigation }: any) {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      setCarregando(true);
      listarAlimentos().then((lista) => {
        if (ativo) {
          setAlimentos(lista);
          setCarregando(false);
        }
      });
      return () => {
        ativo = false;
      };
    }, [])
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <AppText style={styles.titulo}>Catálogo de alimentos ({alimentos.length})</AppText>
        <AppButton
          label="+ NOVO"
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          onPress={() => navigation.navigate('AlimentoForm', {})}
        />
      </View>

      {carregando ? (
        <ActivityIndicator color={colors.primaryDark} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={alimentos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <Pressable
              style={styles.item}
              onPress={() => navigation.navigate('AlimentoForm', { alimento: item })}
            >
              <AppText style={styles.itemNome}>{item.nome}</AppText>
              <AppText style={styles.itemMeta}>
                {item.classificacao_nova} · {item.grupos_alimentares.join(', ')}
              </AppText>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24, paddingTop: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  lista: { paddingBottom: 40 },
  item: { borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 12, padding: 14, marginBottom: 10 },
  itemNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  itemMeta: { fontFamily: typography.regular, fontSize: 12, color: '#8A8A8A', marginTop: 4 },
});