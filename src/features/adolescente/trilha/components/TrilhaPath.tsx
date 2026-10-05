// src/features/adolescente/trilha/components/TrilhaPath.tsx
//
// Caminho contínuo de lições (estilo Duolingo) sobre fundo branco: nós em
// forma de botão 3D que seguem uma onda suave, balão de ação ("COMEÇAR")
// pulsando em cima do nó atual e o mascote ao lado dele. As etiquetas
// "Módulo N" aparecem como divisórias no meio do próprio caminho.
//
// Lógica de cor (confirmada com o usuário):
//   verde escuro (primaryDark) = concluída
//   verde claro   (primary)     = atual (em andamento)
//   cinza claro                 = ainda não iniciada / bloqueada
// O desbloqueio progressivo em si (quem é "atual" vs "bloqueada") já vem
// pronto do backend em trilhaService.ts — este componente só desenha o que
// recebe.
import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AppText } from '../../../../shared/ui/AppText';
import type { TipoLicao } from '../services/trilhaService';

export type StatusLicao = 'concluida' | 'atual' | 'bloqueada';

export interface NoTrilha {
  id: string;
  moduloId: string;
  status: StatusLicao;
  icone?: string | null;
  // Tipo da lição por trás do nó. Viaja aqui (e não só na lista `licoes`
  // separada) pra esse componente resolver sozinho o estado visual de
  // "prática real pendente" (ver seção 5 do modelo-pedagogico-trilha.md):
  // é sempre a combinação status === 'atual' + tipo === 'atividade_rastreavel'
  // — não existe um 4º valor de `status` só pra isso, porque o pendente
  // ainda É o nó atual do caminho, só muda o ícone/cor.
  tipo: TipoLicao;
}

// Um "grupo" = os nós de um módulo, já com o rótulo pronto pra divisória
// (mesmo texto que ia no card do acordeão antigo — ver trilhaService.ts).
export interface GrupoModuloTrilha {
  moduloId: string;
  titulo: string;
  nos: NoTrilha[];
}

interface TrilhaCaminhoProps {
  grupos: GrupoModuloTrilha[];
  onPressNo?: (no: NoTrilha, index: number) => void;
  // devolve, por módulo, o Y onde ele começa no caminho — usado pela tela
  // pra trocar a faixa fixa do topo conforme o módulo que está na vista
  onMedirGrupos?: (offsets: Record<string, number>) => void;
  // Y do nó atual — usado pela tela pra abrir já rolada até ele
  onMedirNoAtual?: (y: number) => void;
}

const MASCOTE = require('../../../../../assets/img/mascot/broxis-aceno.png');
const MASCOTE_LARGURA = 64;
const MASCOTE_ALTURA = Math.round((MASCOTE_LARGURA * 463) / 292);

const ALTURA_LINHA = 96;
const TOPO = 104; // folga pro balão "COMEÇAR" caber acima do primeiro nó
const NODE_SIZE = 68;
const NODE_SIZE_ATUAL = 72;
const PROFUNDIDADE = 8; // espessura do "botão" 3D (borda de baixo)
const CAIXA_LARGURA = 128;
const ALTURA_DIVISORIA = 96; // etiqueta "Módulo N" + folga pro balão do primeiro nó do módulo
const PERIODO_ONDA = 8; // nós por ciclo completo da onda

function ehPendente(no: NoTrilha) {
  return no.status === 'atual' && no.tipo === 'atividade_rastreavel';
}

/** Caminho contínuo com TODOS os nós da trilha, atravessando módulos. */
export function TrilhaCaminho({ grupos, onPressNo, onMedirGrupos, onMedirNoAtual }: TrilhaCaminhoProps) {
  const { width } = useWindowDimensions();

  // achata os grupos numa lista única de pontos (x, y), carregando junto o
  // índice global (pra manter a onda contínua através dos módulos, em vez de
  // reiniciar a cada módulo) e se é o primeiro nó de um novo grupo (pra saber
  // onde encaixar a divisória "Módulo N").
  const { pontos, alturaTotal, offsetsGrupo, yAtual } = useMemo(() => {
    const amplitude = Math.min(width * 0.22, 84);
    let indiceGlobal = 0;
    let y = TOPO;
    let yDoAtual: number | null = null;
    const pts: { no: NoTrilha; x: number; y: number; inicioDeGrupo: string | null }[] = [];
    const offsets: Record<string, number> = {};

    grupos.forEach((grupo, indiceGrupo) => {
      if (grupo.nos.length === 0) return;
      if (indiceGrupo > 0) y += ALTURA_DIVISORIA;
      const topoGrupo = y - NODE_SIZE_ATUAL / 2;
      offsets[grupo.moduloId] = Math.max(0, topoGrupo - 16);

      grupo.nos.forEach((no, i) => {
        // onda suave: começa no centro, vai pra direita, volta, vai pra esquerda
        const x = width / 2 + amplitude * Math.sin((indiceGlobal * 2 * Math.PI) / PERIODO_ONDA);
        pts.push({ no, x, y, inicioDeGrupo: i === 0 ? grupo.titulo : null });
        if (no.status === 'atual' && yDoAtual === null) yDoAtual = y;
        if (i < grupo.nos.length - 1) y += ALTURA_LINHA;
        indiceGlobal++;
      });

      y += ALTURA_LINHA; // espaço até o próximo grupo
    });

    return {
      pontos: pts,
      alturaTotal: y - ALTURA_LINHA + TOPO,
      offsetsGrupo: offsets,
      yAtual: yDoAtual,
    };
  }, [grupos, width]);

  React.useEffect(() => {
    onMedirGrupos?.(offsetsGrupo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetsGrupo]);

  React.useEffect(() => {
    if (yAtual !== null) onMedirNoAtual?.(yAtual);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yAtual]);

  const noAtual = pontos.find((p) => p.no.status === 'atual');

  return (
    <View style={{ width, height: alturaTotal, backgroundColor: 'transparent' }}>
      {/* mascote do lado oposto ao nó atual, como na referência */}
      {!!noAtual && (
        <Image
          source={MASCOTE}
          resizeMode="contain"
          accessible={false}
          style={{
            position: 'absolute',
            width: MASCOTE_LARGURA,
            height: MASCOTE_ALTURA,
            left:
              noAtual.x >= width / 2
                ? Math.max(12, noAtual.x - 140 - MASCOTE_LARGURA / 2)
                : Math.min(width - MASCOTE_LARGURA - 12, noAtual.x + 140 - MASCOTE_LARGURA / 2),
            top: noAtual.y - MASCOTE_ALTURA / 2 + 6,
          }}
        />
      )}

      {pontos.map(({ no, x, y, inicioDeGrupo }, index) => (
        <React.Fragment key={no.id}>
          {!!inicioDeGrupo && index > 0 && (
            <View style={[styles.divisoria, { top: y - ALTURA_DIVISORIA - NODE_SIZE_ATUAL / 2 + 10, width }]}>
              <View style={styles.divisoriaLinha} />
              <AppText style={styles.divisoriaTexto}>{inicioDeGrupo}</AppText>
              <View style={styles.divisoriaLinha} />
            </View>
          )}
          <NoDoCaminho no={no} x={x} y={y} onPress={() => onPressNo?.(no, index)} />
        </React.Fragment>
      ))}
    </View>
  );
}

// Balão "COMEÇAR" que fica subindo e descendo devagar em cima do nó atual.
// Com "reduzir movimento" ligado no aparelho, fica parado.
function BalaoAcao({ texto, cor }: { texto: string; cor: string }) {
  const deslocamento = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let ativo = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduzir) => {
        if (!ativo || reduzir) return;
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(deslocamento, { toValue: -5, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(deslocamento, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        );
        loop.start();
      })
      .catch(() => {});

    return () => {
      ativo = false;
      loop?.stop();
    };
  }, [deslocamento]);

  return (
    <Animated.View pointerEvents="none" style={[styles.balaoWrapper, { transform: [{ translateY: deslocamento }] }]}>
      <View style={styles.balaoCorpo}>
        <AppText style={[styles.balaoTexto, { color: cor }]}>{texto}</AppText>
      </View>
      <View style={styles.balaoSeta} />
    </Animated.View>
  );
}

function NoDoCaminho({ no, x, y, onPress }: { no: NoTrilha; x: number; y: number; onPress: () => void }) {
  const ehAtual = no.status === 'atual';
  const bloqueada = no.status === 'bloqueada';
  const concluida = no.status === 'concluida';
  const pendente = ehPendente(no);
  const d = ehAtual ? NODE_SIZE_ATUAL : NODE_SIZE;

  const face = bloqueada
    ? colors.trilhaNoBloqueadoFace
    : pendente
      ? colors.warning
      : ehAtual
        ? colors.primary
        : colors.primaryDark;
  const borda = bloqueada
    ? colors.trilhaNoBloqueadoBorda
    : pendente
      ? colors.warningShadow
      : ehAtual
        ? colors.primaryShadow
        : '#0D3425';
  const corIcone = bloqueada ? colors.trilhaNoBloqueadoIcone : colors.white;
  const corHalo = pendente ? 'rgba(245, 166, 35, 0.35)' : 'rgba(139, 207, 74, 0.45)';
  const corBalao = pendente ? colors.warningShadow : colors.primaryShadow;

  const rotulo = bloqueada ? 'Lição bloqueada' : concluida ? 'Lição concluída' : pendente ? 'Registrar prática real' : 'Começar lição';

  return (
    <View
      style={{
        position: 'absolute',
        left: x - CAIXA_LARGURA / 2,
        top: y - d / 2,
        width: CAIXA_LARGURA,
        height: d + PROFUNDIDADE,
        alignItems: 'center',
      }}
    >
      {ehAtual && <BalaoAcao texto={pendente ? 'REGISTRAR' : 'COMEÇAR'} cor={corBalao} />}

      {/* anel em volta do nó atual */}
      {ehAtual && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -9,
            width: d + 18,
            height: d + 18,
            borderRadius: (d + 18) / 2,
            borderWidth: 5,
            borderColor: corHalo,
          }}
        />
      )}

      <Pressable
        disabled={bloqueada}
        onPress={onPress}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityState={{ disabled: bloqueada }}
        style={{ width: d, height: d + PROFUNDIDADE }}
      >
        {({ pressed }) => (
          <>
            {/* base: a "espessura" do botão, aparece só como borda de baixo */}
            <View
              style={{
                position: 'absolute',
                top: PROFUNDIDADE,
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: borda,
              }}
            />
            {/* face: afunda até a base quando pressionada */}
            <View
              style={{
                position: 'absolute',
                top: pressed ? PROFUNDIDADE - 2 : 0,
                width: d,
                height: d,
                borderRadius: d / 2,
                backgroundColor: face,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconeDoNo no={no} size={ehAtual ? 32 : 30} color={corIcone} />
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

// Ícone por tipo de lição. Versões preenchidas, que combinam com o botão 3D.
const ICONE_POR_TIPO: Record<TipoLicao, keyof typeof Ionicons.glyphMap> = {
  conteudo: 'bulb',
  quiz: 'reader',
  atividade_rastreavel: 'walk',
};

// `licoes.icone` aceita dois formatos: um nome do Ionicons ("bulb-outline") ou,
// com o prefixo "mci:", um nome do MaterialCommunityIcons ("mci:karate",
// "mci:dumbbell"), que cobre ícones que o Ionicons não tem (chute, halter).
// Nome inválido cai no ícone padrão do tipo da lição.
const PREFIXO_MCI = 'mci:';

function IconeDoNo({ no, size, color }: { no: NoTrilha; size: number; color: string }) {
  const nome = no.icone ?? '';
  if (nome.startsWith(PREFIXO_MCI)) {
    const nomeMci = nome.slice(PREFIXO_MCI.length);
    if (nomeMci in MaterialCommunityIcons.glyphMap) {
      return (
        <MaterialCommunityIcons
          name={nomeMci as keyof typeof MaterialCommunityIcons.glyphMap}
          size={size}
          color={color}
        />
      );
    }
  }
  return <Ionicons name={resolverIcone(no)} size={size} color={color} />;
}

function resolverIcone(no: NoTrilha): keyof typeof Ionicons.glyphMap {
  if (no.icone) {
    // prefere a versão preenchida ("bulb") à de contorno ("bulb-outline")
    const preenchido = no.icone.replace(/-outline$/, '');
    if (preenchido in Ionicons.glyphMap) return preenchido as keyof typeof Ionicons.glyphMap;
    if (no.icone in Ionicons.glyphMap) return no.icone as keyof typeof Ionicons.glyphMap;
  }
  return ICONE_POR_TIPO[no.tipo];
}

const styles = StyleSheet.create({
  balaoWrapper: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  balaoCorpo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.trilhaBalaoBorda,
  },
  balaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  balaoSeta: {
    width: 12,
    height: 12,
    marginTop: -7,
    backgroundColor: colors.white,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.trilhaBalaoBorda,
    transform: [{ rotate: '45deg' }],
  },
  divisoria: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  divisoriaLinha: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.trilhaBalaoBorda,
  },
  divisoriaTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.trilhaChipTexto,
  },
});
