// src/features/adolescente/components/TrilhaPath.tsx
import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';

export type StatusLicao = 'concluida' | 'atual' | 'bloqueada';

export interface NoTrilha {
  id: string;
  status: StatusLicao;
}

interface TrilhaPathProps {
  nos: NoTrilha[];
  onPressNo?: (no: NoTrilha, index: number) => void;
}

const FAIXAS = [0.24, 0.5, 0.76];
const ALTURA_LINHA = 118;
const TOPO = 40;
const NODE_SIZE = 64;
const NODE_SIZE_ATUAL = 76;
const CAIXA_NO = NODE_SIZE_ATUAL + 12;

const COR_TRILHA_BLOQUEADA = '#DCEAC9'; // verde bem clarinho, em vez do cinza neutro de antes

// ícones decorativos espalhados atrás do traçado — temática nutrição/hidratação,
// bem sutis (opacidade baixa) pra dar cor de fundo sem competir com o conteúdo
const ICONES_DECORATIVOS: (keyof typeof Ionicons.glyphMap)[] = [
  'leaf-outline',
  'water-outline',
  'nutrition-outline',
  'sparkles-outline',
];

// gerador determinístico simples (sem Math.random) — mesmo layout toda hora que renderiza,
// só muda se a lista de nós mudar de tamanho
function pseudoAleatorio(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export function TrilhaPath({ nos, onPressNo }: TrilhaPathProps) {
  const { width } = useWindowDimensions();

  const pontos = useMemo(
    () =>
      nos.map((no, i) => ({
        no,
        x: width * FAIXAS[i % FAIXAS.length],
        y: TOPO + i * ALTURA_LINHA,
      })),
    [nos, width]
  );

  const alturaTotal = TOPO * 2 + Math.max(nos.length - 1, 0) * ALTURA_LINHA + NODE_SIZE_ATUAL;

  const indiceAtual = useMemo(() => {
    const idx = nos.findIndex((n) => n.status === 'atual');
    if (idx !== -1) return idx;
    for (let i = nos.length - 1; i >= 0; i--) {
      if (nos[i].status === 'concluida') return i;
    }
    return -1;
  }, [nos]);

  function caminhoSvg(pts: typeof pontos) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const meioY = (p0.y + p1.y) / 2;
      d += ` C ${p0.x} ${meioY}, ${p1.x} ${meioY}, ${p1.x} ${p1.y}`;
    }
    return d;
  }

  // desloca o traço verticalmente — usado pra criar o "degrau" de relevo (mesmo
  // princípio do borderBottomWidth/shadowColor do AppButton, só que em curva)
  function caminhoDeslocado(pts: typeof pontos, deslocY: number) {
    return caminhoSvg(pts.map((p) => ({ ...p, y: p.y + deslocY })));
  }

  const caminhoFundo = caminhoSvg(pontos);
  const pontosProgresso = indiceAtual > 0 ? pontos.slice(0, indiceAtual + 1) : [];

  // ícones decorativos: um a cada ~2 nós, alternando lado oposto à faixa do nó
  // (assim não fica em cima do círculo) e com rotação/tamanho variados
  const decoracoes = useMemo(() => {
    const itens: { x: number; y: number; icone: (typeof ICONES_DECORATIVOS)[number]; tamanho: number; rotacao: number }[] = [];
    for (let i = 0; i < pontos.length - 1; i += 2) {
      const p = pontos[i];
      const r1 = pseudoAleatorio(i + 1);
      const r2 = pseudoAleatorio(i + 7);
      const r3 = pseudoAleatorio(i + 13);
      const faixaOposta = FAIXAS[(i + 2) % FAIXAS.length];
      itens.push({
        x: width * faixaOposta + (r1 - 0.5) * 40,
        y: p.y + ALTURA_LINHA / 2 + (r2 - 0.5) * 40,
        icone: ICONES_DECORATIVOS[i % ICONES_DECORATIVOS.length],
        tamanho: 28 + r3 * 20,
        rotacao: r1 * 60 - 30,
      });
    }
    return itens;
  }, [pontos, width]);

  return (
    <View style={{ width, height: alturaTotal }}>
      {/* fundo: gradiente + traço cinza/verde-claro por trás de tudo */}
      {!!caminhoFundo && (
        <Svg width={width} height={alturaTotal} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="fundoTrilha" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F1F8E9" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={alturaTotal} fill="url(#fundoTrilha)" />

          {/* trilho bloqueado — relevo sutil igual o resto do traço */}
          <Path d={caminhoDeslocado(pontos, 4)} stroke="#C7DCAE" strokeWidth={14} strokeLinecap="round" fill="none" />
          <Path d={caminhoFundo} stroke={COR_TRILHA_BLOQUEADA} strokeWidth={14} strokeLinecap="round" fill="none" />

          {/* trilho já percorrido — mesmo efeito de relevo do AppButton (sombra embaixo + cor em cima) */}
          {pontosProgresso.length > 1 && (
            <>
              <Path d={caminhoDeslocado(pontosProgresso, 4)} stroke={colors.primaryShadow} strokeWidth={14} strokeLinecap="round" fill="none" />
              <Path d={caminhoSvg(pontosProgresso)} stroke={colors.primary} strokeWidth={14} strokeLinecap="round" fill="none" />
            </>
          )}
        </Svg>
      )}

      {/* ícones decorativos por cima do gradiente, atrás dos nós */}
      {decoracoes.map((d, i) => (
        <Ionicons
          key={i}
          name={d.icone}
          size={d.tamanho}
          color={colors.primary}
          style={{
            position: 'absolute',
            left: d.x - d.tamanho / 2,
            top: d.y - d.tamanho / 2,
            opacity: 0.12,
            transform: [{ rotate: `${d.rotacao}deg` }],
          }}
        />
      ))}

      {pontos.map(({ no, x, y }, index) => (
        <NoDoCaminho key={no.id} no={no} x={x} y={y} onPress={() => onPressNo?.(no, index)} />
      ))}
    </View>
  );
}

function NoDoCaminho({ no, x, y, onPress }: { no: NoTrilha; x: number; y: number; onPress: () => void }) {
  const ehAtual = no.status === 'atual';
  const bloqueada = no.status === 'bloqueada';
  const tamanho = ehAtual ? NODE_SIZE_ATUAL : NODE_SIZE;

  return (
    <View
      style={{
        position: 'absolute',
        left: x - CAIXA_NO / 2,
        top: y - CAIXA_NO / 2,
        width: CAIXA_NO,
        height: CAIXA_NO,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ehAtual && (
        <>
          <View style={[styles.anelAtualExterno, { width: CAIXA_NO, height: CAIXA_NO, borderRadius: CAIXA_NO / 2 }]} />
          <View style={[styles.anelAtualInterno, { width: CAIXA_NO - 10, height: CAIXA_NO - 10, borderRadius: (CAIXA_NO - 10) / 2 }]} />
        </>
      )}
      <Pressable
        disabled={bloqueada}
        onPress={onPress}
        hitSlop={8}
        style={[
          styles.circulo,
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            backgroundColor: bloqueada ? '#EAF1E0' : colors.primary,
          },
          !bloqueada && styles.sombraNo,
        ]}
      >
        {no.status === 'concluida' && <Ionicons name="checkmark" size={28} color={colors.white} />}
        {ehAtual && <Ionicons name="play" size={26} color={colors.white} />}
        {bloqueada && <Ionicons name="lock-closed" size={22} color="#9CB98A" />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sombraNo: {
    borderBottomWidth: 4,
    borderBottomColor: colors.primaryShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  anelAtualExterno: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 207, 74, 0.18)',
  },
  anelAtualInterno: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 207, 74, 0.30)',
  },
});