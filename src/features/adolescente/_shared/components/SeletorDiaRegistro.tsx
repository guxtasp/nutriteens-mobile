// src/features/adolescente/_shared/components/SeletorDiaRegistro.tsx
//
// "Hoje 📅" do cabeçalho dos carrinhos (comida e atividade).
// Decisão do MVP: registro só de hoje. Sem `onMudar` é só um rótulo (não é botão).
// Com `onMudar`, vira seletor (hoje, ontem ou anteontem) — hoje ninguém passa.
// Fica inline (sem Modal dentro de Modal, que é frágil no iOS).
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { opcoesDiaRegistro, rotuloDoDia } from '../utils/diasRegistro';

type Props = {
  /** null = hoje */
  dia: string | null;
  onMudar?: (iso: string | null) => void;
};

export default function SeletorDiaRegistro({ dia, onMudar }: Props) {
  const [aberto, setAberto] = useState(false);
  const opcoes = useMemo(() => opcoesDiaRegistro(), [aberto]);
  const rotulo = rotuloDoDia(dia);

  if (!onMudar) {
    return (
      <View style={styles.raiz}>
        <View style={styles.botao}>
          <AppText style={styles.texto}>{rotulo}</AppText>
          <Ionicons name="calendar-outline" size={18} color={colors.primaryDark} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      <Pressable
        onPress={() => setAberto((v) => !v)}
        style={styles.botao}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Dia do registro: ${rotulo}. Toque para mudar.`}
        accessibilityState={{ expanded: aberto }}
      >
        <AppText style={styles.texto}>{rotulo}</AppText>
        <Ionicons name="calendar-outline" size={18} color={colors.primaryDark} />
        <Ionicons name={aberto ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primaryDark} />
      </Pressable>

      {aberto && (
        <View style={styles.lista}>
          {opcoes.map((o, i) => {
            const selecionado = (dia ?? opcoes[0].iso) === o.iso;
            return (
              <Pressable
                key={o.iso}
                onPress={() => {
                  onMudar(i === 0 ? null : o.iso);
                  setAberto(false);
                }}
                style={[styles.opcao, selecionado && styles.opcaoAtiva]}
                accessibilityRole="button"
                accessibilityLabel={`${o.rotulo}, ${o.detalhe}`}
                accessibilityState={{ selected: selecionado }}
              >
                <AppText style={[styles.opcaoRotulo, selecionado && styles.opcaoRotuloAtivo]}>{o.rotulo}</AppText>
                <AppText style={[styles.opcaoDetalhe, selecionado && styles.opcaoRotuloAtivo]}>{o.detalhe}</AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'flex-end' },
  botao: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, minHeight: 32 },
  texto: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  lista: { flexDirection: 'row', gap: 8, marginTop: 8 },
  opcao: {
    borderWidth: 1.5,
    borderColor: '#D9E2E8',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    minWidth: 78,
  },
  opcaoAtiva: { backgroundColor: '#8BC34A', borderColor: '#8BC34A' },
  opcaoRotulo: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  opcaoRotuloAtivo: { color: '#fff' },
  opcaoDetalhe: { fontFamily: typography.regular, fontSize: 11, color: '#7A8B94', marginTop: 1 },
});
