// src/features/adolescente/components/CarrinhoAlimentosSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, ScrollView, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { ItemCarrinhoAlimento } from '../types/alimentacao';

type Props = {
  visivel: boolean;
  itens: ItemCarrinhoAlimento[];
  onFechar: () => void;
  onIncrementar: (alimentoId: string) => void;
  onDecrementar: (alimentoId: string) => void;
  onRemover: (alimentoId: string) => void;
  onRegistrar: () => void;
  registrando: boolean;
};

export default function CarrinhoAlimentosSheet({
  visivel, itens, onFechar, onIncrementar, onDecrementar, onRemover, onRegistrar, registrando,
}: Props) {
  const [montado, setMontado] = useState(visivel);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(400);

      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(sheetTranslateY, { toValue: 0, friction: 9, tension: 65, useNativeDriver: true }),
      ]).start();
    } else if (montado) {
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: 400, duration: 200, useNativeDriver: true }),
      ]).start(() => setMontado(false));
    }
  }, [visivel]);

  if (!montado) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.puxador} />

          <View style={styles.cabecalho}>
            <View style={styles.badge}>
              <AppText style={styles.badgeTexto}>Lista</AppText>
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
              <View key={item.alimento.id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <AppText style={styles.itemNome}>{item.alimento.nome}</AppText>
                  <AppText style={styles.itemClassificacao}>{item.alimento.classificacao_nova.replace(/_/g, ' ')}</AppText>
                </View>

                <View style={styles.quantidadeControle}>
                  <Pressable onPress={() => onDecrementar(item.alimento.id)} hitSlop={8} style={styles.botaoQtd}>
                    <Ionicons name="remove" size={14} color={colors.primaryDark} />
                  </Pressable>
                  <AppText style={styles.quantidadeTexto}>{item.quantidade}</AppText>
                  <Pressable onPress={() => onIncrementar(item.alimento.id)} hitSlop={8} style={styles.botaoQtd}>
                    <Ionicons name="add" size={14} color={colors.primaryDark} />
                  </Pressable>
                </View>

                <Pressable onPress={() => onRemover(item.alimento.id)} hitSlop={8} style={{ marginLeft: 10 }}>
                  <Ionicons name="close" size={18} color={colors.primaryDark} />
                </Pressable>
              </View>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.botao, itens.length > 0 && !registrando ? styles.botaoAtivo : styles.botaoInativo]}
            onPress={onRegistrar}
            disabled={itens.length === 0 || registrando}
          >
            <AppText style={styles.botaoTexto}>REGISTRAR</AppText>
          </Pressable>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrapper: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { backgroundColor: colors.white ?? '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 16 },
  cabecalho: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  contador: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#8BC34A', alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  hoje: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hojeTexto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  item: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#D9E2E8', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 10,
  },
  itemNome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  itemClassificacao: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 2, textTransform: 'capitalize' },
  quantidadeControle: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F2F5F3', borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4 },
  botaoQtd: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  quantidadeTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, minWidth: 14, textAlign: 'center' },
  botao: { borderRadius: 24, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  botaoAtivo: { backgroundColor: '#8BC34A' },
  botaoInativo: { backgroundColor: '#D9E2E8' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff' },
});