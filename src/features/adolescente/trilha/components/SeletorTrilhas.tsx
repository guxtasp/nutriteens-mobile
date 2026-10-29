// src/features/adolescente/trilha/components/SeletorTrilhas.tsx
//
// Lista de trilhas. Abre ao tocar na faixa verde-clara do topo da tela. Trilha concluída ou em andamento pode ser aberta (a tela rola
// até ela); trilha bloqueada aparece cinza, com cadeado, e NÃO responde ao toque.
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { StatusTrilha } from '../utils/sequenciaTrilhas';
import { TEMA_TRILHA as T } from '../ui/tema';

export interface ItemSeletorTrilha {
  id: string;
  numero: number; // 1ª, 2ª, 3ª trilha do caminho
  titulo: string;
  descricao: string | null;
  feitas: number;
  total: number;
  status: StatusTrilha;
}

interface SeletorTrilhasProps {
  visivel: boolean;
  itens: ItemSeletorTrilha[];
  trilhaNaVistaId: string | null; // a que está sob a faixa fixa agora (ganha destaque)
  onFechar: () => void;
  onEscolher: (item: ItemSeletorTrilha) => void;
}

export function SeletorTrilhas({ visivel, itens, trilhaNaVistaId, onFechar, onEscolher }: SeletorTrilhasProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar lista de trilhas">
        <Pressable
          style={[styles.folha, { paddingBottom: 20 + insets.bottom }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.alca} />
          <View style={styles.cabecalho}>
            <AppText style={styles.titulo}>Trilhas</AppText>
            <Pressable onPress={onFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={26} color={colors.trilhaChipTexto} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.lista}>
            {itens.map((item) => (
              <CartaoTrilha
                key={item.id}
                item={item}
                naVista={item.id === trilhaNaVistaId}
                anterior={itens.find((i) => i.numero === item.numero - 1)}
                onPress={() => onEscolher(item)}
              />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CartaoTrilha({
  item,
  naVista,
  anterior,
  onPress,
}: {
  item: ItemSeletorTrilha;
  naVista: boolean;
  anterior?: ItemSeletorTrilha;
  onPress: () => void;
}) {
  const bloqueada = item.status === 'bloqueada';
  const concluida = item.status === 'concluida';
  const progresso = item.total > 0 ? item.feitas / item.total : 0;

  const rotuloEstado = bloqueada ? 'Bloqueada' : concluida ? 'Concluída' : 'Em andamento';
  const dica = bloqueada
    ? `Termine a Trilha ${anterior?.numero ?? item.numero - 1} para liberar.`
    : item.descricao;

  return (
    <Pressable
      disabled={bloqueada}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Trilha ${item.numero}, ${item.titulo}, ${rotuloEstado}`}
      accessibilityState={{ disabled: bloqueada, selected: naVista }}
      style={({ pressed }) => [
        styles.cartao,
        bloqueada && styles.cartaoBloqueado,
        naVista && !bloqueada && styles.cartaoNaVista,
        pressed && !bloqueada && styles.cartaoPressionado,
      ]}
    >
      <View style={[styles.selo, bloqueada ? styles.seloBloqueado : concluida ? styles.seloConcluido : styles.seloAtual]}>
        {bloqueada ? (
          <Ionicons name="lock-closed" size={22} color={colors.trilhaNoBloqueadoIcone} />
        ) : concluida ? (
          <Ionicons name="checkmark" size={26} color={colors.white} />
        ) : (
          <AppText style={styles.seloNumero}>{item.numero}</AppText>
        )}
      </View>

      <View style={styles.textos}>
        <AppText style={[styles.rotulo, bloqueada && styles.textoBloqueado]}>
          TRILHA {item.numero} · {rotuloEstado.toUpperCase()}
        </AppText>
        <AppText numberOfLines={2} style={[styles.tituloTrilha, bloqueada && styles.textoBloqueado]}>
          {item.titulo}
        </AppText>
        {!!dica && (
          <AppText numberOfLines={2} style={[styles.dica, bloqueada && styles.textoBloqueado]}>
            {dica}
          </AppText>
        )}
        {!bloqueada && (
          <View style={styles.progressoLinha}>
            <View style={styles.trilhoBarra}>
              <View style={[styles.preenchimento, { width: `${Math.round(progresso * 100)}%` }]} />
            </View>
            <AppText style={styles.progressoTexto}>
              {item.feitas}/{item.total}
            </AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(10, 28, 39, 0.55)', justifyContent: 'flex-end' },
  folha: {
    maxHeight: '78%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  alca: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.trilhaBalaoBorda },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  lista: { gap: 12, paddingBottom: 8 },

  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.trilhaBalaoBorda,
    backgroundColor: colors.white,
  },
  cartaoNaVista: { borderColor: colors.primary, backgroundColor: colors.exercicioAcertoFundo },
  cartaoBloqueado: { backgroundColor: '#F7F7F7' },
  cartaoPressionado: { opacity: 0.85 },

  // selo no mesmo formato de "prato" dos nós do caminho: miolo + aro
  selo: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 5 },
  seloAtual: { backgroundColor: colors.primary, borderColor: T.atualAro },
  seloConcluido: { backgroundColor: colors.primaryDark, borderColor: T.concluidaAro },
  seloBloqueado: { backgroundColor: colors.trilhaNoBloqueadoFace, borderColor: T.bloqueadoAro },
  seloNumero: { fontFamily: typography.bold, fontSize: 22, color: colors.white },

  textos: { flex: 1 },
  rotulo: { fontFamily: typography.semiBold, fontSize: 11, letterSpacing: 0.6, color: colors.primaryShadow },
  tituloTrilha: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark, marginTop: 2 },
  dica: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 3, lineHeight: 16 },
  textoBloqueado: { color: colors.trilhaNoBloqueadoIcone },

  progressoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  trilhoBarra: { flex: 1, height: 10, borderRadius: 5, backgroundColor: '#E3E8E5', overflow: 'hidden' },
  preenchimento: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  progressoTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
});
