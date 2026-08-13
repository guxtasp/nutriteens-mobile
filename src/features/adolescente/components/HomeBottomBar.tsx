// src/features/adolescente/components/HomeBottomBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../shared/theme/typography';

export type HomeTabKey = 'inicio' | 'trilha' | 'social' | 'alimentacao' | 'mais';

type NavigationProp = NativeStackNavigationProp<AdolescenteStackParamList>;

type Props = {
  activeTab: HomeTabKey;
  onAbrirMenu: () => void;
  menuAberto: boolean;
};

// As 5 abas ficam simétricas na barra (ícone + texto sempre visíveis); o
// destaque da ativa é só um fundo suave atrás, sem esconder/mostrar texto.
// O botão de novo registro (FAB) saiu de dentro da barra — agora é um botão
// flutuante por cima, centralizado.
const TAB_ITEMS: {
  key: HomeTabKey;
  routeName: keyof AdolescenteStackParamList;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconAtivo: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'inicio', routeName: 'Home', label: 'Início', icon: 'home-outline', iconAtivo: 'home' },
  { key: 'trilha', routeName: 'Trilha', label: 'Trilha', icon: 'book-outline', iconAtivo: 'book' },
  { key: 'social', routeName: 'Social', label: 'Social', icon: 'people-outline', iconAtivo: 'people' },
  { key: 'alimentacao', routeName: 'Alimentacao', label: 'Comer', icon: 'restaurant-outline', iconAtivo: 'restaurant' },
  { key: 'mais', routeName: 'Mais', label: 'Mais', icon: 'menu-outline', iconAtivo: 'menu' },
];

type SlotLayout = { x: number; width: number };


export default function HomeBottomBar({ activeTab, onAbrirMenu, menuAberto }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const rotacao = useRef(new Animated.Value(0)).current;
   const insets = useSafeAreaInsets(); 


  // O indicador (pill suave) desliza entre as posições das abas dentro da
  // própria barra — nunca é uma animação de troca de tela.
  const layoutsRef = useRef<Partial<Record<HomeTabKey, SlotLayout>>>({});
  const [indicadorPronto, setIndicadorPronto] = useState(false);
  const indicadorX = useRef(new Animated.Value(0)).current;
  const indicadorWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotacao, {
      toValue: menuAberto ? 1 : 0,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [menuAberto]);

  const rotate = rotacao.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  function moverIndicadorPara(key: HomeTabKey, animado: boolean) {
    const layout = layoutsRef.current[key];
    if (!layout) return;

    if (!animado) {
      indicadorX.setValue(layout.x);
      indicadorWidth.setValue(layout.width);
      setIndicadorPronto(true);
      return;
    }

    Animated.parallel([
      Animated.spring(indicadorX, { toValue: layout.x, useNativeDriver: false, friction: 9, tension: 80 }),
      Animated.spring(indicadorWidth, { toValue: layout.width, useNativeDriver: false, friction: 9, tension: 80 }),
    ]).start();
  }

  // primeira medição de cada slot: posiciona o indicador sem animação assim
  // que a aba ativa tiver layout conhecido
  const handleSlotLayout = (key: HomeTabKey) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    layoutsRef.current[key] = { x, width };
    if (key === activeTab && !indicadorPronto) {
      moverIndicadorPara(key, false);
    }
  };

  // troca de aba: desliza o indicador até a nova posição
  useEffect(() => {
    if (indicadorPronto) moverIndicadorPara(activeTab, true);
  }, [activeTab]);

  const handlePress = (item: (typeof TAB_ITEMS)[number]) => {
    if (item.key === activeTab) return;
    navigation.navigate(item.routeName as never);
  };

  const renderItem = (item: (typeof TAB_ITEMS)[number]) => {
    const ativo = item.key === activeTab;

    return (
      <View key={item.key} style={styles.slot} onLayout={handleSlotLayout(item.key)}>
        <Pressable
          onPress={() => handlePress(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: ativo }}
          accessibilityLabel={item.label}
          hitSlop={6}
          style={styles.item}
        >
          <Ionicons
            name={ativo ? item.iconAtivo : item.icon}
            size={18}
            color={ativo ? colors.primary : colors.textOnDarkMuted}
          />
          <AppText
            style={[styles.texto, ativo && styles.textoAtivo]}
            numberOfLines={1}
          >
            {item.label}
          </AppText>
        </Pressable>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: 24 + insets.bottom } // 🔥 aqui resolve de verdade
      ]}
    >      
      <Pressable style={styles.fab} onPress={onAbrirMenu} accessibilityLabel="Novo registro">
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={24} color={colors.primaryDark} />
        </Animated.View>
      </Pressable>

      <View style={styles.barra}>
        {indicadorPronto && (
          <Animated.View
            pointerEvents="none"
            style={[styles.indicador, { left: indicadorX, width: indicadorWidth }]}
          />
        )}
        {TAB_ITEMS.map(renderItem)}
      </View>
    </View>
  );
}

const FAB_SIZE = 52;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    top: -FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  barra: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 26,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 6,
    width: '95%',
  },
  indicador: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    width: '100%',
  },
  texto: { fontFamily: typography.medium, fontSize: 11, color: colors.textOnDarkMuted },
  textoAtivo: { fontFamily: typography.bold, color: colors.primary },
});
