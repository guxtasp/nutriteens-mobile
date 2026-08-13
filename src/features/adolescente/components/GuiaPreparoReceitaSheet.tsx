// src/features/adolescente/components/GuiaPreparoReceitaSheet.tsx
//
// Mesmo padrão visual/animação do GuiaAtividadeSheet e GuiaAguaSheet
// (sheet com auto-avanço + dots), mas os PASSOS vêm do banco
// (receita_passos) em vez de um array fixo no componente — e cada
// passo pode ter uma foto (foto_url) em vez do ícone circular.
//
// Diferença proposital em relação aos outros guias: aqui o
// auto-avanço PARA no último passo em vez de voltar pro passo 1.
// Faz mais sentido pra quem está de mãos na massa cozinhando — ficar
// voltando pro passo 1 sozinho no meio do preparo seria ruim. Se
// preferirem o loop igual aos outros guias, é só trocar o "if" do
// avancarPasso por (atual + 1) % PASSOS.length como nos outros.
import React, { useEffect, useRef, useState } from 'react';
import { View, Modal, Pressable, StyleSheet, Animated, Easing, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { PassoReceita } from '../services/receitasService';

type Props = {
  visivel: boolean;
  tituloReceita: string;
  passos: PassoReceita[];
  onFechar: () => void;
};

const DURACAO_AUTO_AVANCO = 6000;
const LARGURA_TELA = Dimensions.get('window').width;

export default function GuiaPreparoReceitaSheet({ visivel, tituloReceita, passos, onFechar }: Props) {
  const [montado, setMontado] = useState(visivel);
  const [passoAtual, setPassoAtual] = useState(0);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;
  const conteudoTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      setMontado(true);
      setPassoAtual(0);
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

  useEffect(() => {
    if (!visivel || passos.length === 0) return;

    conteudoTranslateX.setValue(LARGURA_TELA * 0.4);
    Animated.timing(conteudoTranslateX, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const ehUltimoPasso = passoAtual === passos.length - 1;
    if (ehUltimoPasso) return; // para no último passo em vez de voltar pro 1

    const timeout = setTimeout(avancarPasso, DURACAO_AUTO_AVANCO);
    return () => clearTimeout(timeout);
  }, [passoAtual, visivel, passos.length]);

  function avancarPasso() {
    setPassoAtual((atual) => Math.min(atual + 1, passos.length - 1));
  }

  function irParaPasso(indice: number) {
    if (indice === passoAtual) return;
    setPassoAtual(indice);
  }

  if (!montado || passos.length === 0) return null;

  const passo = passos[passoAtual];
  const ehUltimoPasso = passoAtual === passos.length - 1;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onFechar}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </Pressable>

      <Animated.View style={[styles.sheetWrapper, { transform: [{ translateY: sheetTranslateY }] }]}>
        <Pressable style={styles.sheet} onPress={ehUltimoPasso ? undefined : avancarPasso}>
          <View style={styles.puxador} />

          <View style={styles.cabecalho}>
            <AppText style={styles.titulo} numberOfLines={1}>{tituloReceita}</AppText>
            <Pressable onPress={onFechar} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.primaryDark} />
            </Pressable>
          </View>

          <AppText style={styles.contador}>
            Passo {passoAtual + 1} de {passos.length}
          </AppText>

          <View style={styles.conteudoJanela}>
            <Animated.View
              style={[styles.conteudo, { transform: [{ translateX: conteudoTranslateX }] }]}
            >
              {passo.foto_url ? (
                <Image source={{ uri: passo.foto_url }} style={styles.foto} resizeMode="cover" />
              ) : (
                <View style={styles.iconeCirculo}>
                  <Ionicons name="restaurant" size={36} color="#fff" />
                </View>
              )}
              <AppText style={styles.passoTitulo}>{passo.titulo}</AppText>
              <AppText style={styles.passoTexto}>{passo.descricao}</AppText>
            </Animated.View>
          </View>

          <View style={styles.dots}>
            {passos.map((_, indice) => (
              <Pressable key={indice} onPress={() => irParaPasso(indice)} hitSlop={8}>
                <View style={[styles.dot, indice === passoAtual && styles.dotAtivo]} />
              </Pressable>
            ))}
          </View>

          {ehUltimoPasso && (
            <Pressable style={styles.botaoConcluir} onPress={onFechar}>
              <AppText style={styles.botaoConcluirTexto}>PRONTO!</AppText>
            </Pressable>
          )}
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
    paddingBottom: 36,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 12,
  },
  titulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, flexShrink: 1 },
  contador: {
    fontFamily: typography.medium,
    fontSize: 12,
    color: '#7A8B94',
    marginBottom: 8,
  },
  conteudoJanela: {
    overflow: 'hidden',
  },
  conteudo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  foto: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#F0F5F1',
  },
  iconeCirculo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#8BC34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  passoTitulo: {
    fontFamily: typography.bold,
    fontSize: 15,
    color: colors.primaryDark,
    marginBottom: 6,
    textAlign: 'center',
  },
  passoTexto: {
    fontFamily: typography.regular,
    fontSize: 13,
    color: '#7A8B94',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#D9E2E8',
  },
  dotAtivo: {
    width: 18,
    backgroundColor: '#8BC34A',
  },
  botaoConcluir: {
    marginTop: 16,
    backgroundColor: colors.primaryDark,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoConcluirTexto: {
    fontFamily: typography.bold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.5,
  },
});