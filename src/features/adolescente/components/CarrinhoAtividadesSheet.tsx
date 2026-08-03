// src/features/adolescente/components/CarrinhoAtividadesSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { ItemCarrinho } from '../types/atividadeFisica';

type Props = {
  visivel: boolean;
  itens: ItemCarrinho[];
  onFechar: () => void;
  onRemover: (idLocal: string) => void;
  onRegistrar: () => void;
};

export default function CarrinhoAtividadesSheet({ visivel, itens, onFechar, onRemover, onRegistrar }: Props) {
  const [montado, setMontado] = useState(visivel);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(400);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          friction: 9,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (montado) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 400,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMontado(false));
    }
  }, [visivel]);

  if (!montado) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View
        style={[
          styles.sheetWrapper,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.puxador} />

          <View style={styles.cabecalho}>
            <View style={styles.badge}>
              <AppText style={styles.badgeTexto}>Atividade</AppText>
              <View style={styles.contador}>
                <AppText style={styles.contadorTexto}>{itens.length}</AppText>
              </View>
            </View>
            <View style={styles.hoje}>
              <AppText style={styles.hojeTexto}>Hoje</AppText>
              <Ionicons name="calendar-outline" size={18} color={colors.primaryDark} />
            </View>
          </View>

          <ScrollView style={{ maxHeight: 280 }}>
            {itens.map((item) => (
              <View key={item.idLocal} style={styles.item}>
                <View>
                  <AppText style={styles.itemNome}>{item.nomeAtividade}</AppText>
                  <AppText style={styles.itemDuracao}>{item.duracaoMinutos} min</AppText>
                </View>
                <Pressable onPress={() => onRemover(item.idLocal)} hitSlop={8}>
                  <Ionicons name="close" size={18} color={colors.primaryDark} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.botao, itens.length > 0 ? styles.botaoAtivo : styles.botaoInativo]}
            onPress={onRegistrar}
            disabled={itens.length === 0}
          >
            <AppText style={styles.botaoTexto}>REGISTRAR ATIVIDADE</AppText>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    backgroundColor: colors.white ?? '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9E2E8',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  contador: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  hoje: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hojeTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  itemNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  itemDuracao: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 2 },
  botao: { borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  botaoAtivo: { backgroundColor: '#8BC34A' },
  botaoInativo: { backgroundColor: '#D9E2E8' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff' },
});