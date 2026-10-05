import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { Insignia } from '../services/gamificacaoService';

type Props = { item: Insignia; onPress: (i: Insignia) => void };

/**
 * Componente PADRÃO e reutilizável de Conquistas e Marcos (sem arte exclusiva).
 * - conquista: círculo simples com ícone
 * - marco: maior, anel dourado, faixa com o número (ex.: 50, 100, 30)
 * Bloqueado: cinza com cadeado.
 */
export function ConquistaBadge({ item, onPress }: Props) {
  const marco = item.categoria === 'marco';
  const tamanho = marco ? 76 : 60;

  return (
    <Pressable onPress={() => onPress(item)} style={styles.wrap} accessibilityLabel={item.nome}>
      <View
        style={[
          styles.circulo,
          { width: tamanho, height: tamanho, borderRadius: tamanho / 2 },
          item.obtida ? (marco ? styles.marcoObtido : styles.conquistaObtida) : styles.bloqueado,
        ]}
      >
        <Ionicons
          name={(item.obtida ? item.icone ?? 'ribbon' : 'lock-closed') as any}
          size={marco ? 34 : 26}
          color={item.obtida ? (marco ? colors.warningShadow : colors.primaryDark) : colors.trilhaNoBloqueadoIcone}
        />
        {marco && item.valor != null && (
          <View style={[styles.faixa, !item.obtida && styles.faixaBloqueada]}>
            <AppText style={styles.faixaTexto}>{item.valor}</AppText>
          </View>
        )}
        {item.nova && <View style={styles.pontoNovo} />}
      </View>
      <AppText numberOfLines={2} style={[styles.nome, !item.obtida && styles.nomeBloqueado]}>
        {item.nome}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 86, alignItems: 'center' },
  circulo: { alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  conquistaObtida: { backgroundColor: colors.exercicioAcertoFundo, borderColor: colors.primary },
  marcoObtido: { backgroundColor: '#FFF4D6', borderColor: colors.warning },
  bloqueado: { backgroundColor: colors.trilhaNoBloqueadoFace, borderColor: colors.trilhaNoBloqueadoBorda },
  faixa: {
    position: 'absolute',
    bottom: -8,
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: colors.warning,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
  },
  faixaBloqueada: { backgroundColor: colors.trilhaNoBloqueadoIcone },
  faixaTexto: { fontSize: 11, fontFamily: typography.bold, color: '#fff' },
  nome: { marginTop: 12, fontSize: 11, fontFamily: typography.semiBold, color: colors.primaryDark, textAlign: 'center' },
  nomeBloqueado: { color: colors.placeholder },
  pontoNovo: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.exercicioErro,
    borderWidth: 2,
    borderColor: '#fff',
  },
});
