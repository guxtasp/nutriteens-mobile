// src/features/adolescente/_shared/components/ChatBroxisSheet.tsx
//
// Só o DESIGN do chat com o Bróxis. Ainda não responde nada: avisa claramente
// que está em desenvolvimento, mostra o que vem por aí e deixa o campo de
// mensagem desativado. Quando o chat existir de verdade, é aqui que entram a
// lista de mensagens e o envio.
import React from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

type Props = { visivel: boolean; onFechar: () => void };

const SUGESTOES = ['O que posso comer de lanche?', 'Quanta água devo beber?', 'Ideias de atividade física'];

export default function ChatBroxisSheet({ visivel, onFechar }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onFechar}>
        <Pressable
          style={[styles.folha, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.alca} />

          {/* cabeçalho */}
          <View style={styles.cabecalho}>
            <View style={styles.avatar}>
              <Image
                source={require('../../../../../assets/img/mascot/broxis-aceno.png')}
                style={styles.avatarImagem}
                resizeMode="contain"
              />
            </View>
            <View style={styles.cabecalhoTextos}>
              <AppText style={styles.titulo}>Converse com o Bróxis</AppText>
              <View style={styles.statusLinha}>
                <View style={styles.statusPonto} />
                <AppText style={styles.statusTexto}>Em desenvolvimento</AppText>
              </View>
            </View>
            <Pressable style={styles.fechar} onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar chat">
              <Ionicons name="close" size={20} color={colors.primaryDark} />
            </Pressable>
          </View>

          {/* conversa */}
          <View style={styles.conversa}>
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 300 }}
              style={styles.linhaBroxis}
            >
              <Image
                source={require('../../../../../assets/img/feedback/orgulhoso.png')}
                style={styles.miniBroxis}
                resizeMode="contain"
              />
              <View style={styles.balao}>
                <AppText style={styles.balaoTexto}>
                  Oi! Eu ainda estou em desenvolvimento e não consigo responder por enquanto. Logo, logo vou poder
                  bater papo com você sobre alimentação, água e atividade física.
                </AppText>
              </View>
            </MotiView>

            <View style={styles.aviso}>
              <Ionicons name="construct" size={18} color="#B7791F" />
              <AppText style={styles.avisoTexto}>
                O chat está sendo construído. Enquanto isso, a trilha e as missões do dia estão te esperando!
              </AppText>
            </View>

            <AppText style={styles.secao}>Exemplos do que vem por aí</AppText>
            <View style={styles.sugestoes}>
              {SUGESTOES.map((texto) => (
                <View key={texto} style={styles.chip}>
                  <AppText style={styles.chipTexto}>{texto}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* campo de mensagem desativado */}
          <View style={styles.entrada}>
            <View style={styles.campo}>
              <AppText style={styles.campoTexto} numberOfLines={1}>
                Em breve você poderá escrever aqui
              </AppText>
            </View>
            <View style={styles.enviar}>
              <Ionicons name="send" size={18} color="#fff" />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 28, 39, 0.55)', justifyContent: 'flex-end' },
  folha: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '88%',
  },
  alca: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', marginBottom: 14 },

  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EAF6D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImagem: { width: 40, height: 40 },
  cabecalhoTextos: { flex: 1 },
  titulo: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  statusLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusPonto: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5A524' },
  statusTexto: { fontFamily: typography.medium, fontSize: 12, color: '#7A8B94' },
  fechar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F9EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  conversa: { paddingTop: 22 },
  linhaBroxis: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  miniBroxis: { width: 44, height: 44 },
  balao: {
    flex: 1,
    backgroundColor: '#F4F9EE',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  balaoTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.primaryDark },

  aviso: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FFF6E0',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  avisoTexto: { flex: 1, fontFamily: typography.regular, fontSize: 12, lineHeight: 18, color: '#7A5A12' },

  secao: { fontFamily: typography.semiBold, fontSize: 12, color: '#7A8B94', marginTop: 20, marginBottom: 10 },
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, opacity: 0.55 },
  chip: {
    borderWidth: 1,
    borderColor: '#D9E2E8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipTexto: { fontFamily: typography.medium, fontSize: 12, color: colors.primaryDark },

  entrada: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },
  campo: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F3F2',
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  campoTexto: { fontFamily: typography.regular, fontSize: 14, color: '#9AA5A0' },
  enviar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C9D1CD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
