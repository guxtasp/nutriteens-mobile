// src/features/adolescente/social/components/SeletorTurma.tsx
//
// Seletor Novidades / Minha turma com indicador que desliza de um lado ao outro (mesma linguagem da barra de
// baixo do app). Badge laranja para pedidos de amizade esperando.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { turma } from '../theme/turma';
import { useTourAlvo } from '../../tour/TourContext';

export type AbaTurma = 'feed' | 'amigos';

type Props = {
  ativa: AbaTurma;
  onChange: (aba: AbaTurma) => void;
  pedidos: number;
};

const ABAS: { chave: AbaTurma; rotulo: string; icone: keyof typeof Ionicons.glyphMap; iconeAtivo: keyof typeof Ionicons.glyphMap }[] = [
  { chave: 'feed', rotulo: 'Novidades', icone: 'sparkles-outline', iconeAtivo: 'sparkles' },
  { chave: 'amigos', rotulo: 'Minha turma', icone: 'people-outline', iconeAtivo: 'people' },
];

const PADDING = 5;

export default function SeletorTurma({ ativa, onChange, pedidos }: Props) {
  const [largura, setLargura] = useState(0);
  const refTour = useTourAlvo('turma-abas');
  const pos = useRef(new Animated.Value(ativa === 'feed' ? 0 : 1)).current;

  useEffect(() => {
    const a = Animated.spring(pos, { toValue: ativa === 'feed' ? 0 : 1, friction: 9, tension: 120, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [ativa, pos]);

  const larguraPilula = largura > 0 ? (largura - PADDING * 2) / ABAS.length : 0;

  return (
    <View ref={refTour} collapsable={false} style={estilos.caixa} accessibilityRole="tablist" onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {larguraPilula > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[estilos.pilula, { width: larguraPilula, transform: [{ translateX: pos.interpolate({ inputRange: [0, 1], outputRange: [0, larguraPilula] }) }] }]}
        />
      )}
      {ABAS.map((a) => {
        const ligada = ativa === a.chave;
        const badge = a.chave === 'amigos' ? pedidos : 0;
        return (
          <Pressable
            key={a.chave}
            onPress={() => onChange(a.chave)}
            accessibilityRole="tab"
            accessibilityState={{ selected: ligada }}
            accessibilityLabel={badge > 0 ? `${a.rotulo}, ${badge} ${badge === 1 ? 'pedido esperando' : 'pedidos esperando'}` : a.rotulo}
            style={estilos.item}
          >
            <Ionicons name={ligada ? a.iconeAtivo : a.icone} size={18} color={ligada ? colors.primaryDark : '#6B7A74'} />
            <AppText style={[estilos.texto, ligada && { color: colors.primaryDark }]}>{a.rotulo}</AppText>
            {badge > 0 && (
              <View style={estilos.badge}><AppText style={estilos.badgeTexto}>{badge}</AppText></View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { flexDirection: 'row', padding: PADDING, marginBottom: 18, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  pilula: { position: 'absolute', top: PADDING, bottom: PADDING, left: PADDING, borderRadius: 17, backgroundColor: colors.primary, borderBottomWidth: 3, borderBottomColor: colors.primaryShadow },
  item: { flex: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  texto: { fontFamily: typography.bold, fontSize: 15, color: '#6B7A74' },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF8A1F' },
  badgeTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
});
