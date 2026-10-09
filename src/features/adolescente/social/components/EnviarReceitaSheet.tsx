// src/features/adolescente/social/components/EnviarReceitaSheet.tsx
//
// Escolher um amigo para receber a receita. Mensagem fixa, sem texto livre.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { AvatarSocialView } from './AvatarSocialView';
import { listarAmigos, type AmigoSocial } from '../services/socialService';
import { compartilharReceita } from '../services/receitaCompartilhadaService';
import { mensagemEnvioReceita } from '../utils/receitaCompartilhada';

type Props = { receita: { id: string; titulo: string } | null; onFechar: () => void };

export function EnviarReceitaSheet({ receita, onFechar }: Props) {
  const [amigos, setAmigos] = useState<AmigoSocial[] | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!receita) return;
    let ativo = true;
    setAmigos(null);
    listarAmigos()
      .then((l) => ativo && setAmigos(l))
      .catch(() => ativo && setAmigos([]));
    return () => {
      ativo = false;
    };
  }, [receita]);

  if (!receita) return null;

  async function enviar(amigo: AmigoSocial) {
    if (enviando) return;
    setEnviando(true);
    let msg: string;
    try {
      msg = mensagemEnvioReceita(await compartilharReceita(amigo.amizadeId, receita!.id), amigo.apelido);
    } catch {
      msg = 'Algo deu errado. Tente de novo daqui a pouco.';
    }
    setEnviando(false);
    onFechar();
    // iOS ignora um Alert aberto enquanto o Modal ainda está fechando
    setTimeout(() => Alert.alert('Receita para um amigo', msg), 450);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <View style={styles.raiz}>
        <Pressable style={styles.fundo} onPress={onFechar} />
        <View style={styles.caixa}>
          <View style={styles.puxador} />
          <AppText style={styles.titulo}>Mandar para quem?</AppText>
          <AppText style={styles.sub} numberOfLines={2}>{receita.titulo}</AppText>

          {amigos === null ? (
            <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: 24 }} />
          ) : amigos.length === 0 ? (
            <AppText style={styles.vazio}>Você ainda não tem amigos no app. Adicione alguém na aba Social!</AppText>
          ) : (
            <ScrollView
              style={styles.lista}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {amigos.map((a) => (
                <View key={a.amizadeId} style={styles.linha}>
                  <AvatarSocialView avatar={a.avatar} size="small" />
                  <AppText style={styles.nome}>{a.apelido}</AppText>
                  <TouchableOpacity
                    style={styles.botao}
                    disabled={enviando}
                    onPress={() => void enviar(a)}
                    accessibilityRole="button"
                    accessibilityLabel={`Enviar receita para ${a.apelido}`}
                  >
                    <AppText style={styles.botaoTexto}>Enviar</AppText>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.fechar} onPress={onFechar} accessibilityRole="button">
            <AppText style={styles.fecharTexto}>Cancelar</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  // o Pressable pai roubava o gesto de rolagem; agora o fundo é irmão da caixa e a lista tem altura própria
  lista: { flexGrow: 0, maxHeight: 320 },
  caixa: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  puxador: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5DDD8', marginBottom: 14 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 12 },
  vazio: { fontSize: 14, color: '#4B5563', marginVertical: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  nome: { flex: 1, fontFamily: typography.semiBold, fontSize: 15, color: colors.textOnLight },
  botao: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 9 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  fechar: { alignItems: 'center', marginTop: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB' },
  fecharTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#4B5563' },
});
