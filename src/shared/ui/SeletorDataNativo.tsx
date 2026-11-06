// src/shared/ui/SeletorDataNativo.tsx
//
// Seletor de data do próprio sistema (o que o usuário já conhece do celular):
//  - Android: calendário padrão do Android (diálogo nativo).
//  - iOS: rodas de data do iOS numa folha embaixo, com Cancelar / Confirmar.
//  - Web: usa o SeletorDataModal (a biblioteca nativa não existe no navegador).
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';
import { SeletorDataModal } from './SeletorDataModal';
import { dataInicialDoSeletor, formatarDataBR, limitesDoSeletor } from '../utils/dataNascimento';

type Props = {
  visivel: boolean;
  /** valor atual no formato DD/MM/AAAA (pode estar incompleto) */
  valor: string;
  onFechar: () => void;
  onEscolher: (formatado: string) => void;
};

export function SeletorDataNativo({ visivel, valor, onFechar, onEscolher }: Props) {
  const insets = useSafeAreaInsets();
  const { minimo, maximo } = limitesDoSeletor();
  const [rascunho, setRascunho] = useState<Date>(() => dataInicialDoSeletor(valor));

  // Android: abre o diálogo nativo (imperativo) quando `visivel` vira true
  useEffect(() => {
    if (Platform.OS !== 'android' || !visivel) return;
    DateTimePickerAndroid.open({
      value: dataInicialDoSeletor(valor),
      mode: 'date',
      display: 'calendar',
      minimumDate: minimo,
      maximumDate: maximo,
      onChange: (evento, data) => {
        if (evento.type === 'set' && data) onEscolher(formatarDataBR(data));
        onFechar();
      },
    });
    // abre só quando `visivel` muda; valor/limites são lidos nesse instante
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  // iOS: sincroniza o rascunho com o que foi digitado ao abrir
  useEffect(() => {
    if (Platform.OS === 'ios' && visivel) setRascunho(dataInicialDoSeletor(valor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  if (Platform.OS === 'web') {
    return <SeletorDataModal visivel={visivel} valor={valor} onFechar={onFechar} onEscolher={onEscolher} />;
  }
  if (Platform.OS === 'android') return null;

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.fundo} onPress={onFechar} accessibilityLabel="Fechar seletor de data" />
      <View style={[styles.folha, { paddingBottom: 16 + insets.bottom }]}>
        <View style={styles.barra}>
          <Pressable onPress={onFechar} hitSlop={8} accessibilityRole="button" style={styles.acao}>
            <AppText style={styles.cancelar}>Cancelar</AppText>
          </Pressable>
          <Pressable
            onPress={() => {
              onEscolher(formatarDataBR(rascunho));
              onFechar();
            }}
            hitSlop={8}
            accessibilityRole="button"
            style={styles.acao}
          >
            <AppText style={styles.confirmar}>Confirmar</AppText>
          </Pressable>
        </View>
        <DateTimePicker
          value={rascunho}
          mode="date"
          display="spinner"
          locale="pt-BR"
          themeVariant="light"
          textColor={colors.primaryDark}
          minimumDate={minimo}
          maximumDate={maximo}
          onChange={(_, data) => data && setRascunho(data)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  folha: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
  },
  barra: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  acao: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 },
  cancelar: { fontFamily: typography.regular, fontSize: 16, color: colors.primaryDark },
  confirmar: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
});
