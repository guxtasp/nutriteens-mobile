// src/features/adolescente/components/HomeBottomBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AdolescenteStackParamList } from '../../../../navigation/AdolescenteNavigator';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../../../shared/theme/typography';

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

const RAIO_BARRA = 26;
const RAIO_INDICADOR = 10;


function raioIndicador(index: number) {
  if (index === 0) {
    return {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopRightRadius: RAIO_INDICADOR,
      borderBottomRightRadius: RAIO_INDICADOR,
    };
  }
  if (index === TAB_ITEMS.length - 1) {
    return {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
      borderTopLeftRadius: RAIO_INDICADOR,
      borderBottomLeftRadius: RAIO_INDICADOR,
    };
  }
  return { borderRadius: RAIO_INDICADOR };
}

export default function HomeBottomBar({ activeTab, onAbrirMenu, menuAberto }: Props) {
  const navigation = useNavigation<NavigationProp>();
  const rotacao = useRef(new Animated.Value(0)).current;
   const insets = useSafeAreaInsets(); 


  // O indicador (pill suave) desliza entre as posições das abas dentro da
  // própria barra — nunca é uma animação de troca de tela.
  const layoutsRef = useRef<Partial<Record<HomeTabKey, SlotLayout>>>({});
  const larguraBarraRef = useRef(0);
  const [indicadorPronto, setIndicadorPronto] = useState(false);
  const [raioAtivo, setRaioAtivo] = useState(raioIndicador(0));
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

  // calcula os bounds reais do indicador: itens do meio ficam exatamente no
  // tamanho do próprio item; o primeiro estica até x=0 (borda esquerda da
  // barra) e o último estica até a largura total da barra (borda direita) —
  // o overflow:hidden + borderRadius da barra cuidam de arredondar esse
  // trecho esticado seguindo a curva real da borda, sem precisar calcular
  // o raio na mão.
  function boundsIndicador(key: HomeTabKey) {
    const layout = layoutsRef.current[key];
    if (!layout) return null;

    const index = TAB_ITEMS.findIndex((item) => item.key === key);
    if (index === 0) {
      return { x: 0, width: layout.x + layout.width };
    }
    if (index === TAB_ITEMS.length - 1) {
      const larguraBarra = larguraBarraRef.current;
      return { x: layout.x, width: Math.max(larguraBarra - layout.x, layout.width) };
    }
    return { x: layout.x, width: layout.width };
  }

  function moverIndicadorPara(key: HomeTabKey, animado: boolean) {
    const bounds = boundsIndicador(key);
    if (!bounds) return;

    const index = TAB_ITEMS.findIndex((item) => item.key === key);
    setRaioAtivo(raioIndicador(index));

    if (!animado) {
      indicadorX.setValue(bounds.x);
      indicadorWidth.setValue(bounds.width);
      setIndicadorPronto(true);
      return;
    }

    Animated.parallel([
      Animated.spring(indicadorX, { toValue: bounds.x, useNativeDriver: false, friction: 9, tension: 80 }),
      Animated.spring(indicadorWidth, { toValue: bounds.width, useNativeDriver: false, friction: 9, tension: 80 }),
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

  const handleBarraLayout = (event: LayoutChangeEvent) => {
    larguraBarraRef.current = event.nativeEvent.layout.width;
    // se o último item já tinha sido medido antes da barra (raro, mas
    // possível dependendo da ordem de layout), reposiciona com a largura certa
    if (activeTab === TAB_ITEMS[TAB_ITEMS.length - 1].key && indicadorPronto) {
      moverIndicadorPara(activeTab, false);
    }
  };

  // troca de aba: desliza o indicador até a nova posição
  useEffect(() => {
    if (indicadorPronto) moverIndicadorPara(activeTab, true);
  }, [activeTab]);

  const handlePress = (item: (typeof TAB_ITEMS)[number]) => {
    if (item.key === activeTab) return;
    if (item.routeName === 'Home') {
      // Home é sempre a raiz da stack nesse fluxo (as 5 abas são telas
      // irmãs simuladas dentro de um único Stack.Navigator, não um Tab
      // Navigator de verdade). navigate('Home') deveria voltar pra
      // instância já existente, mas na prática empurrava uma Home NOVA em
      // cima da pilha toda vez — cada troca de aba criava outra instância,
      // e a Home reiniciava com estado zerado (some, sequência, missão)
      // antes de recarregar do zero. popToTop() volta pra instância
      // original garantidamente, sem recriar nada.
      navigation.popToTop();
    } else {
      navigation.navigate(item.routeName as never);
    }
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
        { paddingBottom: 24 + insets.bottom } 
      ]}
    >      
      <Pressable style={styles.fab} onPress={onAbrirMenu} accessibilityLabel="Novo registro">
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="add" size={24} color={colors.white} />
        </Animated.View>
      </Pressable>

      <View style={styles.barra} onLayout={handleBarraLayout}>
        {indicadorPronto && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicador,
              raioAtivo,
              { left: indicadorX, width: indicadorWidth },
            ]}
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
    top: -10 -FAB_SIZE / 2,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
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
    borderRadius: RAIO_BARRA,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 6,
    width: '95%',
    // deixa o indicador esticar até a borda real nos itens extremos sem
    // "vazar" quadrado pra fora — ele é cortado seguindo a curva da barra
    overflow: 'hidden',
  },
  indicador: {
    position: 'absolute',
    // cobre a altura completa da barra (incluindo a área de padding), não
    // só o miolo do item — por isso não tem mais inset de top/bottom
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.12)',
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