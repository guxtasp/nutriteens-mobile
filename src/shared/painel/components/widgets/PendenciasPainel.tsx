// src/shared/painel/components/widgets/PendenciasPainel.tsx
// "Precisa da sua atenção": o que está esperando uma ação, com atalho para a tela certa.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../ui/AppText';
import { typography } from '../../../theme/typography';
import { formatarNumero } from '../../formatadores';
import type { IconeNome } from '../../types';
import type { TemaPainel } from '../../tema/paletas';
import { useEstilos, useTemaPainel } from '../../tema/TemaPainelContext';

export type Pendencia = { chave: string; icone: IconeNome; titulo: string; detalhe: string; rota: string; quantidade: number };

export function PendenciasPainel({ itens }: { itens: Pendencia[] }) {
  const navigation = useNavigation<any>();
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const abertas = itens.filter((i) => i.quantidade > 0);

  if (abertas.length === 0) {
    return (
      <View style={styles.tudoEmDia}>
        <Ionicons name="checkmark-circle" size={32} color={tema.destaque} />
        <AppText style={styles.tudoTitulo}>Tudo em dia</AppText>
        <AppText style={styles.tudoTexto}>Nenhuma aprovação ou pedido esperando por você agora.</AppText>
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      {abertas.map((p) => (
        <Pressable
          key={p.chave}
          onPress={() => navigation.navigate(p.rota)}
          accessibilityRole="button"
          accessibilityLabel={`${p.titulo}: ${p.quantidade}. ${p.detalhe}`}
          style={styles.linha}
        >
          <View style={styles.icone}>
            <Ionicons name={p.icone} size={18} color={tema.alerta} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <AppText style={styles.titulo} numberOfLines={1}>
              {p.titulo}
            </AppText>
            <AppText style={styles.detalhe} numberOfLines={2}>
              {p.detalhe}
            </AppText>
          </View>
          <View style={styles.contador}>
            <AppText style={styles.contadorTexto}>{formatarNumero(p.quantidade)}</AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={tema.textoSuave} />
        </Pressable>
      ))}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, padding: 10, borderRadius: 14, backgroundColor: t.superficieSuave } as const,
  icone: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.alertaSuave, alignItems: 'center', justifyContent: 'center' } as const,
  titulo: { fontFamily: typography.bold, fontSize: 13, color: t.texto } as const,
  detalhe: { fontFamily: typography.regular, fontSize: 11, color: t.textoSuave, marginTop: 1 } as const,
  contador: { minWidth: 28, height: 28, paddingHorizontal: 8, borderRadius: 14, backgroundColor: t.alerta, alignItems: 'center', justifyContent: 'center' } as const,
  contadorTexto: { fontFamily: typography.bold, fontSize: 12, color: '#1B1B1B' } as const,
  tudoEmDia: { alignItems: 'center', gap: 4, paddingVertical: 20 } as const,
  tudoTitulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto } as const,
  tudoTexto: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, textAlign: 'center' } as const,
});
