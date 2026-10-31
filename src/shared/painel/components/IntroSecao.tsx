// src/shared/painel/components/IntroSecao.tsx
// Explicação da página ("o que é, o que dá pra fazer, quem pode o quê").
// Antes era um balão fixo sobre o conteúdo; agora é um botão discreto
// "Sobre esta página" que abre a explicação só quando a pessoa quer.
// Mesma API de antes: nenhuma tela precisa mudar.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

type Props = {
  /** mantido por compatibilidade (antes lembrava que a seção já tinha sido lida) */
  chave: string;
  titulo: string;
  /** frases curtas; cada uma vira uma linha com marcador */
  linhas: string[];
};

export function IntroSecao({ titulo, linhas }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setAberto(true)}
        accessibilityRole="button"
        accessibilityLabel={`Sobre esta página: ${titulo}`}
        style={styles.botao}
      >
        <Ionicons name="help-circle-outline" size={18} color={tema.info} />
        <AppText style={styles.botaoTexto}>Sobre esta página</AppText>
      </Pressable>

      <Modal visible={aberto} transparent animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable style={styles.fundo} onPress={() => setAberto(false)}>
          <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
            <View style={styles.topo}>
              <Ionicons name="bulb-outline" size={22} color={tema.destaque} />
              <AppText style={styles.titulo}>{titulo}</AppText>
              <Pressable onPress={() => setAberto(false)} accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={10}>
                <Ionicons name="close" size={22} color={tema.textoSuave} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 8 }}>
              {linhas.map((l, i) => (
                <View key={i} style={styles.linhaItem}>
                  <AppText style={styles.marcador}>•</AppText>
                  <AppText style={styles.linha}>{l}</AppText>
                </View>
              ))}
            </ScrollView>
            <Pressable onPress={() => setAberto(false)} accessibilityRole="button" style={styles.fechar}>
              <AppText style={styles.fecharTexto}>Entendi</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  botao: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 10, borderRadius: 18, backgroundColor: t.card, borderWidth: 1, borderColor: t.cardBorda, marginBottom: 12 } as const,
  botaoTexto: { fontFamily: typography.medium, fontSize: 13, color: t.info } as const,
  fundo: { flex: 1, backgroundColor: 'rgba(10, 28, 39, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 } as const,
  card: { width: '100%', maxWidth: 520, backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 18, gap: 12 } as const,
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 } as const,
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 16, color: t.texto } as const,
  linhaItem: { flexDirection: 'row', gap: 8 } as const,
  marcador: { fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo, lineHeight: 20 } as const,
  linha: { flex: 1, fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo, lineHeight: 20 } as const,
  fechar: { alignSelf: 'flex-end', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 } as const,
  fecharTexto: { fontFamily: typography.bold, fontSize: 14, color: t.info } as const,
});
