// src/features/adolescente/components/ReceitaDetalheSheet.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { MessageBanner } from '../../../../shared/ui/MessageBanner';
import { useMessageBanner } from '../../../../shared/hooks/useMessageBanner';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { ReceitaComAlimento, PassoReceita } from '../services/receitasService';
import { buscarPassosDaReceita } from '../services/receitasService';
import GuiaPreparoReceitaSheet from './GuiaPreparoReceitaSheet';
import { registrarEvento } from '../../../../shared/analytics/analytics';

type Props = {
  receita: ReceitaComAlimento | null;
  onFechar: () => void;
  /** sem esta função o botão "Adicionar ao registro" não aparece (ex.: receita vinda de um amigo) */
  onAdicionarAoCarrinho?: (receita: ReceitaComAlimento) => void;
  /** com esta função aparece o botão "Enviar para um amigo" */
  onEnviarParaAmigo?: (receita: ReceitaComAlimento) => void;
};

const ROTULO_DIFICULDADE = { FACIL: 'Fácil', MEDIO: 'Médio', DIFICIL: 'Difícil' };

export default function ReceitaDetalheSheet({ receita, onFechar, onAdicionarAoCarrinho, onEnviarParaAmigo }: Props) {
  const [passos, setPassos] = useState<PassoReceita[]>([]);
  const [guiaVisivel, setGuiaVisivel] = useState(false);
  const [carregandoPassos, setCarregandoPassos] = useState(false);
  const { message, type, showMessage, clearMessage } = useMessageBanner();
  const guiaAbertaRef = useRef(false);
  const concluidaRef = useRef(false);
  const receitaId = receita?.id;

  // visualizada ao abrir; abandonada se abriu o passo a passo e saiu sem concluir
  useEffect(() => {
    // zera o estado ao trocar/fechar a receita: sem isso o passo a passo e os
    // passos da receita anterior ficavam "grudados" na próxima que abrisse
    setGuiaVisivel(false);
    setPassos([]);
    setCarregandoPassos(false);
    clearMessage();
    if (!receitaId) return;
    guiaAbertaRef.current = false;
    concluidaRef.current = false;
    registrarEvento('receita_visualizada', { receita_id: receitaId });
    return () => {
      if (guiaAbertaRef.current && !concluidaRef.current) {
        registrarEvento('conteudo_abandonado', { tipo: 'receita', receita_id: receitaId });
      }
    };
  }, [receitaId]);

  if (!receita) return null;

  async function abrirGuia() {
    setCarregandoPassos(true);
    clearMessage();
    try {
      const dados = await buscarPassosDaReceita(receita!.id);
      setPassos(dados);
      if (dados.length > 0) {
        setGuiaVisivel(true);
        guiaAbertaRef.current = true;
      } else {
        // sem isso o botão só piscava "Carregando..." e voltava ao normal
        // sem avisar nada — parecia que tinha travado
        showMessage('Essa receita ainda não tem passo a passo cadastrado.', 'info');
      }
    } catch (e) {
      console.error('Erro ao buscar passos da receita:', e);
      showMessage('Não foi possível carregar o passo a passo. Tenta de novo.', 'error');
    } finally {
      setCarregandoPassos(false);
    }
  }

  return (
    <>
      <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
        {/* o passo a passo vive DENTRO deste Modal (overlay): abrir um segundo Modal
            por cima de outro falha no iOS e o guia nunca aparecia */}
        <View style={styles.raiz}>
          <Pressable style={styles.backdrop} onPress={onFechar} />

          <View style={styles.sheet}>
            <View style={styles.puxador} />

            {/* overlay absoluto: o banner reservava ~80px de altura vazia no topo mesmo sem mensagem */}
            <View style={styles.bannerOverlay} pointerEvents="box-none">
              <MessageBanner message={message} type={type} onClose={clearMessage} style={styles.banner} />
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
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

              {!!onEnviarParaAmigo && (
                <Pressable style={[styles.botaoGuia, { marginTop: -12 }]} onPress={() => onEnviarParaAmigo(receita)}>
                  <Ionicons name="paper-plane-outline" size={16} color={colors.primaryDark} />
                  <AppText style={styles.botaoGuiaTexto}>Enviar para um amigo</AppText>
                </Pressable>
              )}

              <AppText style={styles.secaoTitulo}>Modo de preparo</AppText>
              <AppText style={styles.modoPreparo}>{receita.modo_preparo}</AppText>
            </ScrollView>

            {!!onAdicionarAoCarrinho && (
              <Pressable style={styles.botaoAdicionar} onPress={() => onAdicionarAoCarrinho(receita)}>
                <AppText style={styles.botaoAdicionarTexto}>ADICIONAR AO REGISTRO</AppText>
              </Pressable>
            )}
          </View>

          <GuiaPreparoReceitaSheet
            visivel={guiaVisivel}
            tituloReceita={receita.titulo}
            passos={passos}
            onFechar={() => setGuiaVisivel(false)}
            onConcluir={() => {
              if (concluidaRef.current) return;
              concluidaRef.current = true;
              registrarEvento('receita_concluida', { receita_id: receita.id });
            }}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 32, maxHeight: '85%',
  },
  scroll: { flexGrow: 0, flexShrink: 1 },
  bannerOverlay: { position: 'absolute', top: 24, left: 20, right: 20, zIndex: 10 },
  puxador: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D9E2E8', alignSelf: 'center', marginBottom: 16 },
  banner: { marginTop: 0 },
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