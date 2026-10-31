// src/features/adolescente/social/components/AvisoModeracaoModal.tsx
// Aviso da equipe (advertência ou pausa no social). Aparece uma vez, na Home, até a pessoa tocar em "Entendi".
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { AppButton } from '../../../../shared/ui/AppButton';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { textoAviso, type AvisoModeracao } from '../utils/moderacao';

type Props = { aviso: AvisoModeracao | null; onEntendi: () => void };

export default function AvisoModeracaoModal({ aviso, onEntendi }: Props) {
  if (!aviso) return null;
  const { titulo, corpo } = textoAviso(aviso.tipo, aviso.restritoAte);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onEntendi}>
      <View style={estilos.fundo}>
        <View style={estilos.cartao} accessibilityViewIsModal>
          <AppText style={estilos.titulo}>{titulo}</AppText>
          <AppText style={estilos.corpo}>{corpo}</AppText>
          <AppButton label="ENTENDI" onPress={onEntendi} />
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 24 },
  cartao: { backgroundColor: colors.white ?? '#fff', borderRadius: 20, padding: 20, gap: 14 },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark },
  corpo: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.primaryDark },
});
