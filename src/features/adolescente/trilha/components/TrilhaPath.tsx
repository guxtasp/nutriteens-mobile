// src/features/adolescente/trilha/components/TrilhaPath.tsx
//
// Redesenhado (2ª vez) pra bater com a nova referência: em vez de acordeão
// por módulo, agora é UM caminho contínuo (estilo Duolingo) descendo a tela
// inteira, com as etiquetas "Módulo N" aparecendo como divisórias no meio do
// próprio caminho. A ilustração de obstáculos é posicionada pela tela e fica
// fixa no rodapé enquanto os nós rolam por cima dela.
//
// Lógica de cor (confirmada com o usuário):
//   verde escuro (primaryDark) = concluída
//   verde claro   (primary)     = atual (em andamento)
//   cinza         (trilhaBloqueada) = ainda não iniciada / bloqueada
// O desbloqueio progressivo em si (quem é "atual" vs "bloqueada") já vem
// pronto do backend em trilhaService.ts — este componente só desenha o que
// recebe.
import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  // pra rolar até o módulo escolhido no menu do cabeçalho
  onMedirGrupos?: (offsets: Record<string, number>) => void;
}

const FAIXAS = [0.5, 0.26, 0.5, 0.74]; // primeiro nó centralizado, depois zigue-zague (bate com a referência)
const ALTURA_LINHA = 100;
const TOPO = 40;
const NODE_SIZE = 64;
const NODE_SIZE_ATUAL = 76;
const CAIXA_NO = NODE_SIZE_ATUAL + 12;
const ALTURA_DIVISORIA = 56; // espaço reservado pra etiqueta "Módulo N" entre grupos

function ehPendente(no: NoTrilha) {
  return no.status === 'atual' && no.tipo === 'atividade_rastreavel';
}

/** Caminho contínuo com TODOS os nós da trilha, atravessando módulos —
 * substitui o antigo `NosDoModulo` (por módulo, dentro de um acordeão). */
export function TrilhaCaminho({ grupos, onPressNo, onMedirGrupos }: TrilhaCaminhoProps) {
  const { width } = useWindowDimensions();

  // achata os grupos numa lista única de pontos (x, y), carregando junto o
  // índice global (pra manter o zigue-zague contínuo através dos módulos,
  // em vez de reiniciar a faixa a cada módulo) e se é o primeiro nó de um
  // novo grupo (pra saber onde encaixar a divisória "Módulo N").
  const { pontos, alturaTotal, offsetsGrupo } = useMemo(() => {
    let indiceGlobal = 0;
    let y = TOPO;
    const pts: { no: NoTrilha; x: number; y: number; inicioDeGrupo: string | null }[] = [];
    const offsets: Record<string, number> = {};

    grupos.forEach((grupo, indiceGrupo) => {
      if (grupo.nos.length === 0) return;
      if (indiceGrupo > 0) y += ALTURA_DIVISORIA;
      const topoGrupo = y - NODE_SIZE_ATUAL / 2;
      offsets[grupo.moduloId] = Math.max(0, topoGrupo - 16);

      grupo.nos.forEach((no, i) => {
        pts.push({
          no,
          x: width * FAIXAS[indiceGlobal % FAIXAS.length],
          y,
          inicioDeGrupo: i === 0 ? grupo.titulo : null,
        });
        if (i < grupo.nos.length - 1) y += ALTURA_LINHA;
        indiceGlobal++;
      });

      y += ALTURA_LINHA; // espaço até o próximo grupo
    });

    return { pontos: pts, alturaTotal: y - ALTURA_LINHA + TOPO, offsetsGrupo: offsets };
  }, [grupos, width]);

  React.useEffect(() => {
    onMedirGrupos?.(offsetsGrupo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offsetsGrupo]);

  return (
    <View style={{ width, height: alturaTotal, backgroundColor: 'transparent' }}>

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

function NoDoCaminho({ no, x, y, onPress }: { no: NoTrilha; x: number; y: number; onPress: () => void }) {
  const ehAtual = no.status === 'atual';
  const bloqueada = no.status === 'bloqueada';
  const pendente = ehPendente(no);
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
      {ehAtual && !pendente && (
        <>
          <View style={[styles.anelAtualExterno, { width: CAIXA_NO, height: CAIXA_NO, borderRadius: CAIXA_NO / 2 }]} />
          <View style={[styles.anelAtualInterno, { width: CAIXA_NO - 10, height: CAIXA_NO - 10, borderRadius: (CAIXA_NO - 10) / 2 }]} />
        </>
      )}

      {/* Prática Real pendente: anel âmbar em vez do verde padrão — sinaliza
          "esperando um registro real" sem parecer bloqueado nem um erro. */}
      {pendente && (
        <>
          <View style={[styles.anelPendenteExterno, { width: CAIXA_NO, height: CAIXA_NO, borderRadius: CAIXA_NO / 2 }]} />
          <View style={[styles.anelPendenteInterno, { width: CAIXA_NO - 10, height: CAIXA_NO - 10, borderRadius: (CAIXA_NO - 10) / 2 }]} />
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
            backgroundColor: bloqueada ? colors.trilhaTrilhoBloqueado : pendente ? colors.warning : ehAtual ? colors.primary : colors.primaryDark,
          },
          bloqueada ? styles.sombraNoBloqueado : pendente ? styles.sombraNoPendente : styles.sombraNo,
        ]}
      >
        <Ionicons
          name={resolverIcone(no)}
          size={bloqueada ? 24 : 27}
          color={bloqueada ? '#D7DED9' : colors.white}
        />
      </Pressable>
    </View>
  );
}

// Ícone por tipo de lição (mesma linguagem visual já usada em
// LicaoDetalheScreen: walk-outline pra atividade rastreável).
const ICONE_POR_TIPO: Record<TipoLicao, keyof typeof Ionicons.glyphMap> = {
  conteudo: 'bulb-outline',
  quiz: 'reader-outline',
  atividade_rastreavel: 'walk-outline',
};

function resolverIcone(no: NoTrilha): keyof typeof Ionicons.glyphMap {
  if (no.icone && no.icone in Ionicons.glyphMap) {
    return no.icone as keyof typeof Ionicons.glyphMap;
  }
  return ICONE_POR_TIPO[no.tipo];
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
  sombraNoPendente: {
    borderBottomWidth: 4,
    borderBottomColor: colors.warningShadow,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sombraNoBloqueado: {
    borderBottomWidth: 4,
    borderBottomColor: colors.trilhaTrilhoBloqueadoSombra,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  anelAtualExterno: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 207, 74, 0.18)',
  },
  anelAtualInterno: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 207, 74, 0.30)',
  },
  anelPendenteExterno: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 166, 35, 0.18)',
  },
  anelPendenteInterno: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 166, 35, 0.30)',
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
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  divisoriaTexto: {
    fontFamily: typography.semiBold,
    fontSize: 13,
    color: colors.white,
  },
});
