// src/features/adolescente/social/components/PedidosAmizadeSheet.tsx
//
// Tela de "Pedidos de amizade": duas listas, o que chegou para você (Recebidos) e o que você mandou (Enviados).
// Aceitar passa por uma confirmação curta, porque é uma decisão de segurança: só aceite quem conhece de verdade.
// A contagem de cada lista vem do mesmo array que o aviso da Turma usa, então os números sempre batem.
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { BroxisMascot } from '../../../../shared/ui/BroxisMascot';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { SolicitacaoSocial } from '../services/socialService';
import { turma } from '../theme/turma';
import { AvatarSocialView } from './AvatarSocialView';

type Props = {
  visivel: boolean;
  recebidos: SolicitacaoSocial[];
  enviados: SolicitacaoSocial[];
  ocupado: boolean;
  onFechar: () => void;
  onResponder: (pedido: SolicitacaoSocial, aceitar: boolean) => void;
  onCancelar: (pedido: SolicitacaoSocial) => void;
  onOpcoes: (pedido: SolicitacaoSocial) => void;
};

/** "hoje", "ontem" ou "há N dias": ajuda a decidir e mostra que o pedido não é novo. */
function quando(data: Date): string {
  const dias = Math.floor((Date.now() - data.getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

function Contador({ valor, suave }: { valor: number; suave?: boolean }) {
  return (
    <View style={[estilos.contador, suave && estilos.contadorSuave]}>
      <AppText style={[estilos.contadorTexto, suave && estilos.contadorTextoSuave]}>{valor}</AppText>
    </View>
  );
}

export function PedidosAmizadeSheet({ visivel, recebidos, enviados, ocupado, onFechar, onResponder, onCancelar, onOpcoes }: Props) {
  const [confirmando, setConfirmando] = useState<SolicitacaoSocial | null>(null);

  // Se o pedido some da lista (respondido em outro aparelho, por exemplo), a confirmação some junto.
  useEffect(() => {
    if (confirmando && !recebidos.some((p) => p.amizadeId === confirmando.amizadeId)) setConfirmando(null);
  }, [recebidos, confirmando]);

  useEffect(() => {
    if (!visivel) setConfirmando(null);
  }, [visivel]);

  const vazio = recebidos.length === 0 && enviados.length === 0;

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <View style={estilos.overlay}>
        <Pressable style={estilos.fundo} onPress={onFechar} accessibilityLabel="Fechar" />

        <View style={estilos.cartao}>
          <View style={estilos.alca} />
          <View style={estilos.cabecalho}>
            <View style={{ flex: 1 }}>
              <AppText style={estilos.titulo}>Pedidos de amizade</AppText>
              {recebidos.length > 0 && (
                <AppText style={estilos.tituloSub}>{recebidos.length} {recebidos.length === 1 ? 'esperando você' : 'esperando você'}</AppText>
              )}
            </View>
            <TouchableOpacity style={estilos.fechar} onPress={onFechar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={20} color="#68777D" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {vazio && (
              <View style={estilos.vazio}>
                <BroxisMascot size={84} pose="curioso" entrance="nenhuma" />
                <AppText style={estilos.vazioTitulo}>Nenhum pedido por enquanto</AppText>
                <AppText style={estilos.vazioTexto}>
                  Quando alguém quiser entrar na sua turma, o pedido aparece aqui. Os que você mandar também.
                </AppText>
              </View>
            )}

            {recebidos.length > 0 && (
              <>
                <View style={estilos.secao}>
                  <AppText style={estilos.secaoTitulo}>Recebidos</AppText>
                  <Contador valor={recebidos.length} />
                </View>
                <View style={{ gap: 12 }}>
                  {recebidos.map((p) => (
                    <View key={p.amizadeId} style={estilos.pedido}>
                      <View style={estilos.pedidoTopo}>
                        <AvatarSocialView avatar={p.avatar} size="small" />
                        <View style={estilos.info}>
                          <AppText style={estilos.nome} numberOfLines={1}>{p.apelido}</AppText>
                          <AppText style={estilos.sub}>quer entrar na sua turma · {quando(p.criadoEm)}</AppText>
                        </View>
                        <TouchableOpacity
                          style={estilos.mais}
                          onPress={() => onOpcoes(p)}
                          disabled={ocupado}
                          accessibilityRole="button"
                          accessibilityLabel="Mais opções: bloquear ou denunciar"
                        >
                          <Ionicons name="ellipsis-horizontal" size={19} color="#7D898E" />
                        </TouchableOpacity>
                      </View>
                      <View style={estilos.pedidoBotoes}>
                        <TouchableOpacity
                          style={estilos.aceitar}
                          onPress={() => setConfirmando(p)}
                          disabled={ocupado}
                          accessibilityRole="button"
                          accessibilityLabel={`Aceitar pedido de ${p.apelido}`}
                        >
                          <AppText style={estilos.aceitarTexto}>ACEITAR</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={estilos.recusar}
                          onPress={() => onResponder(p, false)}
                          disabled={ocupado}
                          accessibilityRole="button"
                          accessibilityLabel={`Agora não: recusar pedido de ${p.apelido}`}
                        >
                          <AppText style={estilos.recusarTexto}>AGORA NÃO</AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {enviados.length > 0 && (
              <>
                <View style={estilos.secao}>
                  <AppText style={estilos.secaoTitulo}>Enviados</AppText>
                  <Contador valor={enviados.length} suave />
                </View>
                <View style={estilos.lista}>
                  {enviados.map((p, i) => (
                    <View key={p.amizadeId} style={[estilos.linha, i === enviados.length - 1 && estilos.ultima]}>
                      <AvatarSocialView avatar={p.avatar} size="small" />
                      <View style={estilos.info}>
                        <AppText style={estilos.nome} numberOfLines={1}>{p.apelido}</AppText>
                        <AppText style={estilos.sub}>Aguardando resposta · enviado {quando(p.criadoEm)}</AppText>
                      </View>
                      <TouchableOpacity
                        style={estilos.cancelar}
                        onPress={() => onCancelar(p)}
                        disabled={ocupado}
                        accessibilityRole="button"
                        accessibilityLabel={`Cancelar pedido para ${p.apelido}`}
                      >
                        <AppText style={estilos.cancelarTexto}>Cancelar</AppText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {confirmando && (
            <View style={estilos.confirmaFundo} accessibilityViewIsModal>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setConfirmando(null)} accessibilityLabel="Voltar" />
              <View style={estilos.confirma}>
                <BroxisMascot size={72} pose="aceno" entrance="nenhuma" />
                <AppText style={estilos.confirmaTitulo}>Aceitar o pedido de {confirmando.apelido}?</AppText>
                <AppText style={estilos.confirmaTexto}>
                  Vocês vão ver as novidades um do outro e poder trocar cartinhas e receitas. Só aceite quem você conhece de verdade.
                </AppText>
                <TouchableOpacity
                  style={estilos.confirmaSim}
                  disabled={ocupado}
                  onPress={() => {
                    const p = confirmando;
                    setConfirmando(null);
                    onResponder(p, true);
                  }}
                  accessibilityRole="button"
                >
                  <AppText style={estilos.confirmaSimTexto}>SIM, ACEITAR</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={estilos.confirmaVoltar} onPress={() => setConfirmando(null)} accessibilityRole="button">
                  <AppText style={estilos.confirmaVoltarTexto}>Agora não</AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 35, 28, 0.55)' },
  cartao: { width: '100%', maxHeight: '92%', backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, overflow: 'hidden' },
  alca: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#D9E1DC', marginBottom: 10 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  fechar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F0F3F1', alignItems: 'center', justifyContent: 'center' },

  secao: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 10 },
  secaoTitulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark },
  contador: { minWidth: 25, height: 25, paddingHorizontal: 7, borderRadius: 13, backgroundColor: '#FF8A1F', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  contadorSuave: { backgroundColor: '#E9EEEE' },
  contadorTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  contadorTextoSuave: { color: '#68777D' },

  lista: { backgroundColor: colors.white, borderRadius: 22, paddingHorizontal: 14, borderWidth: 1, borderColor: turma.borda, overflow: 'hidden' },
  linha: { minHeight: 69, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#EFF2EF' },
  ultima: { borderBottomWidth: 0 },
  info: { flex: 1, marginLeft: 11, marginRight: 8 },
  nome: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  sub: { fontFamily: typography.regular, fontSize: 11, color: '#849095', marginTop: 2 },

  tituloSub: { fontFamily: typography.regular, fontSize: 13, color: '#68777D', marginTop: 1 },
  pedido: { padding: 14, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: turma.borda },
  pedidoTopo: { flexDirection: 'row', alignItems: 'center' },
  pedidoBotoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  aceitar: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.primary, borderBottomWidth: 3, borderBottomColor: colors.primaryShadow, alignItems: 'center', justifyContent: 'center' },
  aceitarTexto: { fontFamily: typography.bold, fontSize: 14, letterSpacing: 0.4, color: colors.primaryDark },
  recusar: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1.5, borderColor: turma.borda, alignItems: 'center', justifyContent: 'center' },
  recusarTexto: { fontFamily: typography.bold, fontSize: 14, letterSpacing: 0.4, color: '#4A5D53' },
  mais: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  cancelar: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F0F3F1' },
  cancelarTexto: { fontFamily: typography.bold, fontSize: 11.5, color: '#68777D' },

  vazio: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 12 },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 16, color: colors.primaryDark, marginTop: 12, textAlign: 'center' },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: '#7A888D', marginTop: 6, textAlign: 'center' },

  confirmaFundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20, 35, 28, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  confirma: { width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: 24, padding: 20, alignItems: 'center' },
  confirmaTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginTop: 8, textAlign: 'center' },
  confirmaTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5E6F66', marginTop: 8, marginBottom: 16, textAlign: 'center' },
  confirmaSim: { width: '100%', height: 50, borderRadius: 16, backgroundColor: colors.primary, borderBottomWidth: 3, borderBottomColor: colors.primaryShadow, alignItems: 'center', justifyContent: 'center' },
  confirmaSimTexto: { fontFamily: typography.bold, fontSize: 15, letterSpacing: 0.4, color: colors.primaryDark },
  confirmaVoltar: { paddingVertical: 14, paddingHorizontal: 20 },
  confirmaVoltarTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#68777D' },
});
