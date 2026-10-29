// src/features/adolescente/trilha/components/TrilhaPath.tsx
//
// Caminho contínuo de lições sobre fundo levemente esverdeado: nós em forma de "prato"
// (miolo + aro) que seguem uma onda suave, ligados por uma trilha de pontinhos; balão
// "BORA!" parado em cima do nó atual e o mascote ao lado dele. As etiquetas
// "Módulo N" aparecem como divisórias no meio do próprio caminho. As cores e a
// aparência ficam em ../ui/tema.ts.
//
// Lógica de cor (confirmada com o usuário):
//   verde escuro (primaryDark) = concluída (com selo de check)
//   verde claro   (primary)     = atual (em andamento)
//   cinza claro                 = ainda não iniciada / bloqueada
// O desbloqueio progressivo em si (quem é "atual" vs "bloqueada") já vem
// pronto do backend em trilhaService.ts — este componente só desenha o que
// recebe.
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useLarguraTela } from '../../../../shared/ui/LarguraTela';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AppText } from '../../../../shared/ui/AppText';
import type { TipoLicao } from '../services/trilhaService';
import { pontosDoTrilho } from '../utils/trilhoPontilhado';
import { TEMA_TRILHA as T } from '../ui/tema';

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
// Vários módulos formam uma trilha (a "unidade"); quando o grupo é o
// primeiro da trilha, o caminho desenha o divisor grande da unidade antes dele.
export interface GrupoModuloTrilha {
  moduloId: string;
  titulo: string;
  trilhaId: string;
  tituloTrilha: string;
  numeroTrilha: number; // 1ª, 2ª, 3ª trilha do caminho
  inicioDeTrilha: boolean;
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

const ALTURA_LINHA = 108; // um pouco maior que antes: dá espaço para os pontinhos entre os nós
const ESPACO_BALAO = 52; // folga extra ACIMA do nó atual: o balão "BORA!" não pode cobrir o nó anterior
const TOPO = 104; // folga pro balão "BORA!" caber acima do primeiro nó
const NODE_SIZE = 66;
const NODE_SIZE_ATUAL = 72;
const ARO = 6; // espessura do aro do "prato"
const TAM_PONTO = 7; // pontinhos entre os nós
const CAIXA_LARGURA = 128;
const ALTURA_DIVISORIA = 96; // etiqueta "Módulo N" + folga pro balão do primeiro nó do módulo
const ALTURA_UNIDADE = 176; // cartão da nova trilha (unidade) + etiqueta do módulo + folga pro balão
const PERIODO_ONDA = 8; // nós por ciclo completo da onda

interface InicioDeGrupo {
  titulo: string; // rótulo do módulo
  tituloTrilha: string | null; // preenchido só quando o módulo abre uma nova trilha
  numeroTrilha: number;
  topoDivisor: number;
  temDivisor: boolean; // false só no primeiro grupo do caminho (a faixa fixa já o apresenta)
}

function ehPendente(no: NoTrilha) {
  return no.status === 'atual' && no.tipo === 'atividade_rastreavel';
}

/** Caminho contínuo com TODOS os nós da trilha, atravessando módulos. */
export function TrilhaCaminho({ grupos, onPressNo, onMedirGrupos, onMedirNoAtual }: TrilhaCaminhoProps) {
  const width = useLarguraTela();

  // achata os grupos numa lista única de pontos (x, y), carregando junto o
  // índice global (pra manter a onda contínua através dos módulos, em vez de
  // reiniciar a cada módulo) e se é o primeiro nó de um novo grupo (pra saber
  // onde encaixar a divisória "Módulo N").
  const { pontos, alturaTotal, offsetsGrupo, yAtual, trilho } = useMemo(() => {
    const amplitude = Math.min(width * 0.22, 84);
    let indiceGlobal = 0;
    let y = TOPO;
    let yDoAtual: number | null = null;
    const pts: { no: NoTrilha; x: number; y: number; inicioDeGrupo: InicioDeGrupo | null }[] = [];
    const offsets: Record<string, number> = {};
    let gruposDesenhados = 0;

    grupos.forEach((grupo) => {
      if (grupo.nos.length === 0) return;
      // yBase = onde terminou o grupo anterior; o divisor é desenhado a partir dele
      const yBase = y;
      const temDivisor = gruposDesenhados > 0;
      if (temDivisor) y += grupo.inicioDeTrilha ? ALTURA_UNIDADE : ALTURA_DIVISORIA;
      gruposDesenhados++;
      const topoGrupo = y - NODE_SIZE_ATUAL / 2;
      // o início do módulo na rolagem é o do divisor (se tiver), pra faixa fixa trocar junto com ele
      offsets[grupo.moduloId] = Math.max(0, (temDivisor ? yBase - NODE_SIZE_ATUAL / 2 : topoGrupo) - 16);

      grupo.nos.forEach((no, i) => {
        // o nó atual leva o balão por cima: abre espaço antes dele
        if (no.status === 'atual' && indiceGlobal > 0) y += ESPACO_BALAO;
        // onda suave: começa no centro, vai pra direita, volta, vai pra esquerda
        const x = width / 2 + amplitude * Math.sin((indiceGlobal * 2 * Math.PI) / PERIODO_ONDA);
        pts.push({
          no,
          x,
          y,
          inicioDeGrupo:
            i === 0
              ? {
                  titulo: grupo.titulo,
                  tituloTrilha: grupo.inicioDeTrilha ? grupo.tituloTrilha : null,
                  numeroTrilha: grupo.numeroTrilha,
                  topoDivisor: yBase - NODE_SIZE_ATUAL / 2 + 10,
                  temDivisor,
                }
              : null,
        });
        if (no.status === 'atual' && yDoAtual === null) yDoAtual = y;
        if (i < grupo.nos.length - 1) y += ALTURA_LINHA;
        indiceGlobal++;
      });

      y += ALTURA_LINHA; // espaço até o próximo grupo
    });

    // pontinhos entre nós vizinhos do mesmo módulo. Não há pontinhos até o nó atual (o balão
    // fica ali) nem entre módulos (a divisória fica ali). Colorido só entre lições concluídas.
    const raio = (no: NoTrilha) => (no.status === 'atual' ? NODE_SIZE_ATUAL : NODE_SIZE) / 2;
    const trilho: { key: string; x: number; y: number; ativo: boolean }[] = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (b.inicioDeGrupo || b.no.status === 'atual') continue;
      const ativo = a.no.status === 'concluida' && b.no.status === 'concluida';
      const folgaA = a.no.status === 'atual' ? 12 : 4; // o nó atual tem o halo em volta
      pontosDoTrilho(a, b, raio(a.no) + folgaA, raio(b.no) + 4).forEach((p, k) =>
        trilho.push({ key: `${a.no.id}-${k}`, x: p.x, y: p.y, ativo })
      );
    }

    return {
      pontos: pts,
      alturaTotal: y - ALTURA_LINHA + TOPO,
      offsetsGrupo: offsets,
      yAtual: yDoAtual,
      trilho,
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
      {/* mascote do lado oposto ao nó atual */}
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

      {/* trilha de pontinhos: desenhada antes dos nós, que ficam por cima */}
      {trilho.map((p) => (
        <View
          key={p.key}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: p.x - TAM_PONTO / 2,
            top: p.y - TAM_PONTO / 2,
            width: TAM_PONTO,
            height: TAM_PONTO,
            borderRadius: TAM_PONTO / 2,
            backgroundColor: p.ativo ? T.trilhoAtivo : T.trilhoInativo,
          }}
        />
      ))}

      {pontos.map(({ no, x, y, inicioDeGrupo }, index) => (
        <React.Fragment key={no.id}>
          {!!inicioDeGrupo && inicioDeGrupo.temDivisor && (
            <View style={[styles.divisoriaBloco, { top: inicioDeGrupo.topoDivisor, width }]}>
              {!!inicioDeGrupo.tituloTrilha && (
                <View style={styles.unidade} accessibilityRole="header">
                  <View style={styles.unidadeRotuloLinha}>
                    <Ionicons name="leaf" size={13} color={colors.primaryShadow} />
                    <AppText style={styles.unidadeRotulo}>TRILHA {inicioDeGrupo.numeroTrilha}</AppText>
                  </View>
                  <AppText numberOfLines={2} style={styles.unidadeTitulo}>
                    {inicioDeGrupo.tituloTrilha}
                  </AppText>
                </View>
              )}
              <View style={styles.divisoria}>
                <View style={styles.divisoriaLinha} />
                <AppText style={styles.divisoriaTexto}>{inicioDeGrupo.titulo}</AppText>
                <View style={styles.divisoriaLinha} />
              </View>
            </View>
          )}
          <NoDoCaminho no={no} x={x} y={y} onPress={() => onPressNo?.(no, index)} />
        </React.Fragment>
      ))}
    </View>
  );
}

// Balão "BORA!" em cima do nó atual. Fica parado (sem pulinho): o aro, o halo e o
// mascote já chamam a atenção para o nó.
function BalaoAcao({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return (
    <View pointerEvents="none" style={styles.balaoWrapper}>
      <View style={[styles.balaoCorpo, { backgroundColor: fundo }]}>
        <AppText style={[styles.balaoTexto, { color: cor }]}>{texto}</AppText>
      </View>
      <View style={[styles.balaoSeta, { backgroundColor: fundo }]} />
    </View>
  );
}

function NoDoCaminho({ no, x, y, onPress }: { no: NoTrilha; x: number; y: number; onPress: () => void }) {
  const ehAtual = no.status === 'atual';
  const bloqueada = no.status === 'bloqueada';
  const concluida = no.status === 'concluida';
  const pendente = ehPendente(no);
  const d = ehAtual ? NODE_SIZE_ATUAL : NODE_SIZE;
  const miolo = d - ARO * 2;

  // "prato": miolo (face) dentro de um aro mais claro
  const face = bloqueada ? T.bloqueadoFace : pendente ? T.pendenteFace : ehAtual ? T.atualFace : T.concluidaFace;
  const aro = bloqueada ? T.bloqueadoAro : pendente ? T.pendenteAro : ehAtual ? T.atualAro : T.concluidaAro;
  const corIcone = bloqueada ? colors.trilhaNoBloqueadoIcone : colors.white;
  const corHalo = pendente ? 'rgba(245, 166, 35, 0.30)' : 'rgba(139, 207, 74, 0.40)';
  const corBalao = pendente ? colors.warningShadow : colors.primaryDark;
  const fundoBalao = pendente ? T.balaoFundoPendente : T.balaoFundo;

  const rotulo = bloqueada ? 'Lição bloqueada' : concluida ? 'Lição concluída' : pendente ? 'Registrar prática real' : 'Começar lição';

  return (
    <View
      style={{
        position: 'absolute',
        left: x - CAIXA_LARGURA / 2,
        top: y - d / 2,
        width: CAIXA_LARGURA,
        height: d,
        alignItems: 'center',
      }}
    >
      {ehAtual && <BalaoAcao texto={pendente ? 'REGISTRAR' : 'BORA!'} cor={corBalao} fundo={fundoBalao} />}

      {/* halo em volta do nó atual */}
      {ehAtual && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -7,
            width: d + 14,
            height: d + 14,
            borderRadius: (d + 14) / 2,
            borderWidth: 3,
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
        style={({ pressed }) => [
          { width: d, height: d, borderRadius: d / 2, backgroundColor: aro, alignItems: 'center', justifyContent: 'center' },
          !bloqueada && styles.sombraNo,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <View style={{ width: miolo, height: miolo, borderRadius: miolo / 2, backgroundColor: face, alignItems: 'center', justifyContent: 'center' }}>
          <IconeDoNo no={no} size={ehAtual ? 30 : 28} color={corIcone} />
        </View>
        {/* selo de concluída */}
        {concluida && (
          <View style={styles.selo}>
            <Ionicons name="checkmark" size={13} color={colors.primaryDark} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

// Ícone por tipo de lição. Versões preenchidas, que combinam com o miolo do nó.
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
  sombraNo: {
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  selo: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
  },
  balaoWrapper: {
    position: 'absolute',
    top: -58,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  balaoCorpo: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  balaoTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  balaoSeta: {
    width: 12,
    height: 12,
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
  },
  divisoriaBloco: {
    position: 'absolute',
    gap: 14,
    paddingHorizontal: 24,
  },
  unidade: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: T.cartaoFundo,
    borderWidth: 1.5,
    borderColor: T.cartaoBorda,
  },
  unidadeRotuloLinha: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  unidadeRotulo: { fontFamily: typography.semiBold, fontSize: 12, letterSpacing: 0.8, color: colors.primaryShadow },
  unidadeTitulo: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark, marginTop: 2, textAlign: 'center' },
  divisoria: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divisoriaLinha: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: T.trilhoInativo,
  },
  divisoriaTexto: {
    fontFamily: typography.bold,
    fontSize: 14,
    color: colors.trilhaChipTexto,
  },
});
