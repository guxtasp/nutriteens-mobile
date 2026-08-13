// src/features/adolescente/components/ReceitaDetalheSheet.tsx
import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { ReceitaComAlimento, PassoReceita } from '../services/receitasService';
import { buscarPassosDaReceita } from '../services/receitasService';
import GuiaPreparoReceitaSheet from './GuiaPreparoReceitaSheet';

type Props = {
  receita: ReceitaComAlimento | null;
  onFechar: () => void;
  onAdicionarAoCarrinho: (receita: ReceitaComAlimento) => void;
};

const ROTULO_DIFICULDADE = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

export default function ReceitaDetalheSheet({ receita, onFechar, onAdicionarAoCarrinho }: Props) {
  const [passos, setPassos] = useState<PassoReceita[]>([]);
  const [guiaVisivel, setGuiaVisivel] = useState(false);
  const [carregandoPassos, setCarregandoPassos] = useState(false);

  if (!receita) return null;

  async function abrirGuia() {
    setCarregandoPassos(true);
    try {
      const dados = await buscarPassosDaReceita(receita!.id);
      setPassos(dados);
      if (dados.length > 0) setGuiaVisivel(true);
    } catch (e) {
      console.error('Erro ao buscar passos da receita:', e);
    } finally {
      setCarregandoPassos(false);
    }
  }

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
        <Pressable style={styles.backdrop} onPress={onFechar}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.puxador} />
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {receita.foto_url ? (
                <Image source={{ uri: receita.foto_url }} style={styles.foto} resizeMode="cover" />
              ) : (
                <View style={[styles.foto, styles.fotoPlaceholder]}>
                  <Ionicons name="restaurant-outline" size={32} color="#B8C4BE" />
                </View>
              )}

              <AppText style={styles.titulo}>{receita.titulo}</AppText>

              <View style={styles.infoLinha}>
                {!!receita.tempo_preparo_min && (
                  <View style={styles.infoChip}>
                    <Ionicons name="time-outline" size={14} color={colors.primaryDark} />
                    <AppText style={styles.infoChipTexto}>{receita.tempo_preparo_min} min</AppText>
                  </View>
                )}
                <View style={styles.infoChip}>
                  <Ionicons name="people-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{receita.porcoes} porção(ões)</AppText>
                </View>
                <View style={styles.infoChip}>
                  <Ionicons name="speedometer-outline" size={14} color={colors.primaryDark} />
                  <AppText style={styles.infoChipTexto}>{ROTULO_DIFICULDADE[receita.dificuldade]}</AppText>
                </View>
              </View>

              <Pressable style={styles.botaoGuia} onPress={abrirGuia} disabled={carregandoPassos}>
                <Ionicons name="list-outline" size={16} color={colors.primaryDark} />
                <AppText style={styles.botaoGuiaTexto}>
                  {carregandoPassos ? 'Carregando passo a passo...' : 'Ver passo a passo'}
                </AppText>
              </Pressable>

              <AppText style={styles.secaoTitulo}>Modo de preparo</AppText>
              <AppText style={styles.modoPreparo}>{receita.modo_preparo}</AppText>
            </ScrollView>

            <Pressable style={styles.botaoAdicionar} onPress={() => onAdicionarAoCarrinho(receita)}>
              <AppText style={styles.botaoAdicionarTexto}>ADICIONAR AO REGISTRO</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <GuiaPreparoReceitaSheet
        visivel={guiaVisivel}
        tituloReceita={receita.titulo}
        passos={passos}
        onFechar={() => setGuiaVisivel(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32, maxHeight: '85%',
  },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 16 },
  foto: { width: '100%', height: 160, borderRadius: 16, marginBottom: 16, backgroundColor: '#F0F5F1' },
  fotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  titulo: { fontFamily: typography.bold, fontSize: 20, color: colors.primaryDark, marginBottom: 12 },
  infoLinha: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#F0F5F1', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
  },
  infoChipTexto: { fontFamily: typography.medium, fontSize: 12, color: colors.primaryDark },
  botaoGuia: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.primaryDark, borderRadius: 24,
    paddingVertical: 10, marginBottom: 20,
  },
  botaoGuiaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark, marginBottom: 8 },
  modoPreparo: { fontFamily: typography.regular, fontSize: 14, color: '#5A6B63', lineHeight: 22 },
  botaoAdicionar: { marginTop: 16, backgroundColor: colors.primaryDark, borderRadius: 24, paddingVertical: 14, alignItems: 'center' },
  botaoAdicionarTexto: { fontFamily: typography.bold, fontSize: 13, color: '#fff', letterSpacing: 0.5 },
});