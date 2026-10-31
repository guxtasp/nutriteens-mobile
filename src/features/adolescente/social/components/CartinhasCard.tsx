// src/features/adolescente/social/components/CartinhasCard.tsx
//
// Cartão da aba Turma para a caixa de cartinhas. Mostra quantas são novas e abre a caixa (sheet) com o que os
// amigos mandaram, mais a chave "Receber lembretes de amigos". Só celebra: nada de "você não respondeu".
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { turma, sombraCartao } from '../theme/turma';
import { buscarCaixaCartinhas, definirAceitaLembretes, marcarCartinhasVistas } from '../services/cartinhaService';
import {
  contarNovas,
  definicaoDaCartinha,
  quandoRecebida,
  resumoDoCartao,
  textoRecebida,
  type CaixaCartinhas,
} from '../utils/cartinhas';
import { AvatarSocialView } from './AvatarSocialView';
import CartinhaArte from './CartinhaArte';

export default function CartinhasCard() {
  const [caixa, setCaixa] = useState<CaixaCartinhas | null>(null);
  const [aberta, setAberta] = useState(false);
  const [salvandoLembretes, setSalvandoLembretes] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      buscarCaixaCartinhas()
        .then((c) => vivo && setCaixa(c))
        .catch(() => vivo && setCaixa(null));
      return () => {
        vivo = false;
      };
    }, [])
  );

  const itens = caixa?.itens ?? [];
  const novas = contarNovas(itens);
  const { titulo, sub } = resumoDoCartao(novas, itens.length);

  function abrir() {
    setAberta(true);
    if (novas > 0) {
      // o destaque de "nova" continua nesta abertura; o aviso do cartão some ao fechar
      void marcarCartinhasVistas();
    }
  }

  function fechar() {
    setAberta(false);
    setCaixa((c) => (c ? { ...c, itens: c.itens.map((i) => ({ ...i, nova: false })) } : c));
  }

  async function alternarLembretes(valor: boolean) {
    if (salvandoLembretes) return;
    setSalvandoLembretes(true);
    setCaixa((c) => (c ? { ...c, aceitaLembretes: valor } : c));
    try {
      await definirAceitaLembretes(valor);
    } catch {
      setCaixa((c) => (c ? { ...c, aceitaLembretes: !valor } : c)); // volta ao que estava
    } finally {
      setSalvandoLembretes(false);
    }
  }

  return (
    <>
      <TouchableOpacity
        style={estilos.cartao}
        onPress={abrir}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${sub}`}
      >
        <View style={estilos.icone}>
          <Ionicons name="mail" size={22} color="#C2477D" />
          {novas > 0 && (
            <View style={estilos.bolinha}>
              <AppText style={estilos.bolinhaTexto}>{novas > 9 ? '9+' : novas}</AppText>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={estilos.titulo}>{titulo}</AppText>
          <AppText style={estilos.sub}>{sub}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primaryDark} />
      </TouchableOpacity>

      <Modal visible={aberta} transparent animationType="slide" onRequestClose={fechar}>
        <View style={estilos.raiz}>
          <Pressable style={estilos.fundo} onPress={fechar} accessibilityLabel="Fechar" />
          <View style={estilos.caixa}>
            <View style={estilos.puxador} />
            <AppText style={estilos.caixaTitulo}>Suas cartinhas</AppText>

            {caixa === null ? (
              <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: 24 }} />
            ) : (
              <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {itens.length === 0 ? (
                  <AppText style={estilos.vazio}>
                    Ainda não chegou nenhuma. Mande a primeira: toque no envelope ao lado de um amigo na sua turma.
                  </AppText>
                ) : (
                  itens.map((i) => {
                    const def = definicaoDaCartinha(i.tipo);
                    if (!def) return null;
                    return (
                      <View key={i.id} style={[estilos.linha, i.nova && estilos.linhaNova]}>
                        <CartinhaArte cartinha={def} tamanho="pequena" />
                        <View style={{ flex: 1 }}>
                          <AppText style={estilos.linhaTitulo}>{i.presente ? `Presente: ${def.titulo}` : def.titulo}</AppText>
                          <AppText style={estilos.linhaFrase}>{def.frase}</AppText>
                          <AppText style={estilos.linhaQuem}>
                            {textoRecebida(i)} • {quandoRecebida(i.criadaEm)}
                          </AppText>
                        </View>
                        <AvatarSocialView avatar={i.avatar} size="small" />
                      </View>
                    );
                  })
                )}

                <View style={estilos.preferencia}>
                  <View style={{ flex: 1 }}>
                    <AppText style={estilos.prefTitulo}>Receber lembretes de amigos</AppText>
                    <AppText style={estilos.prefSub}>
                      Convites leves como "bora juntos hoje?". Desligando, ninguém é avisado.
                    </AppText>
                  </View>
                  <Switch
                    value={caixa.aceitaLembretes}
                    onValueChange={(v) => void alternarLembretes(v)}
                    disabled={salvandoLembretes}
                    trackColor={{ true: colors.primary, false: '#D1D5DB' }}
                    accessibilityLabel="Receber lembretes de amigos"
                  />
                </View>
              </ScrollView>
            )}

            <TouchableOpacity style={estilos.fechar} onPress={fechar} accessibilityRole="button">
              <AppText style={estilos.fecharTexto}>Fechar</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: turma.cartao,
    borderRadius: turma.raioCartao,
    borderWidth: 1,
    borderColor: turma.borda,
    padding: 14,
    marginBottom: 14,
    ...sombraCartao,
  },
  icone: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE0EC', alignItems: 'center', justifyContent: 'center' },
  bolinha: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: turma.chama,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bolinhaTexto: { fontFamily: typography.bold, fontSize: 11, color: '#fff' },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  sub: { fontSize: 12, color: turma.textoSuave, marginTop: 2 },

  raiz: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  caixa: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '85%' },
  puxador: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5DDD8', marginBottom: 14 },
  caixaTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginBottom: 8 },
  lista: { flexGrow: 0 },
  vazio: { fontSize: 14, color: '#4B5563', marginVertical: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 6, borderRadius: 16 },
  linhaNova: { backgroundColor: '#FFF6E6' },
  linhaTitulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  linhaFrase: { fontSize: 12, color: '#4B5563', marginTop: 1 },
  linhaQuem: { fontSize: 11, color: '#7A8B94', marginTop: 3 },
  preferencia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F3F8EE',
  },
  prefTitulo: { fontFamily: typography.semiBold, fontSize: 14, color: colors.primaryDark },
  prefSub: { fontSize: 12, color: '#5A6B64', marginTop: 2 },
  fechar: { alignItems: 'center', marginTop: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB' },
  fecharTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#4B5563' },
});
