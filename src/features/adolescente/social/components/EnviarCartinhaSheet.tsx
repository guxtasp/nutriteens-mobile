// src/features/adolescente/social/components/EnviarCartinhaSheet.tsx
//
// Escolher e mandar uma cartinha para UM amigo. Figurinhas fixas (sem texto livre), 1 por dia por amigo.
// O grupo "Lembrete gentil" fica separado e com explicação; o app nunca diz se o amigo já registrou o dia.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { buscarEnviadasHoje, enviarCartinha } from '../services/cartinhaService';
import { ehErroRestricaoSocial } from '../utils/moderacao';
import {
  CARTINHAS_CELEBRAR,
  CARTINHAS_LEMBRETE,
  LIMITE_DIARIO,
  mensagemEnvioCartinha,
  type DefinicaoCartinha,
  type TipoCartinha,
} from '../utils/cartinhas';
import CartinhaArte from './CartinhaArte';

type Props = {
  /** null = fechado */
  amigo: { amizadeId: string; apelido: string } | null;
  onFechar: () => void;
};

type Resultado = { ok: boolean; texto: string };

export function EnviarCartinhaSheet({ amigo, onFechar }: Props) {
  const [escolhida, setEscolhida] = useState<TipoCartinha | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [jaHoje, setJaHoje] = useState<boolean | null>(null);
  const [limiteAtingido, setLimiteAtingido] = useState(false);

  useEffect(() => {
    if (!amigo) return;
    let vivo = true;
    setEscolhida(null);
    setResultado(null);
    setJaHoje(null);
    setLimiteAtingido(false);
    buscarEnviadasHoje()
      .then((r) => {
        if (!vivo) return;
        setJaHoje(r.amizades.includes(amigo.amizadeId));
        setLimiteAtingido(r.total >= LIMITE_DIARIO);
      })
      .catch(() => vivo && setJaHoje(false)); // o banco confere de novo ao enviar
    return () => {
      vivo = false;
    };
  }, [amigo]);

  if (!amigo) return null;

  const bloqueado = jaHoje === true || limiteAtingido;

  async function enviar() {
    if (!amigo || !escolhida || enviando) return;
    setEnviando(true);
    try {
      const r = await enviarCartinha(amigo.amizadeId, escolhida);
      setResultado({ ok: r === 'enviada', texto: mensagemEnvioCartinha(r, amigo.apelido) });
      if (r === 'enviada') {
        setJaHoje(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (e) {
      setResultado({
        ok: false,
        texto: ehErroRestricaoSocial(e)
          ? 'Seu espaço de amigos está em pausa por enquanto, então não dá para mandar cartinha.'
          : 'Algo deu errado. Tente de novo daqui a pouco.',
      });
    } finally {
      setEnviando(false);
    }
  }

  function grade(lista: DefinicaoCartinha[]) {
    return (
      <View style={estilos.grade}>
        {lista.map((c) => (
          <TouchableOpacity
            key={c.tipo}
            style={estilos.celula}
            disabled={bloqueado || enviando || resultado?.ok === true}
            activeOpacity={0.8}
            onPress={() => setEscolhida(c.tipo)}
            accessibilityRole="button"
            accessibilityState={{ selected: escolhida === c.tipo, disabled: bloqueado }}
            accessibilityLabel={`${c.titulo}. ${c.frase}`}
          >
            <CartinhaArte cartinha={c} marcada={escolhida === c.tipo} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onFechar}>
      <View style={estilos.raiz}>
        <Pressable style={estilos.fundo} onPress={onFechar} accessibilityLabel="Fechar" />
        <View style={estilos.caixa}>
          <View style={estilos.puxador} />
          <AppText style={estilos.titulo}>Cartinha para {amigo.apelido}</AppText>
          <AppText style={estilos.sub}>Escolha uma. Dá para mandar 1 por dia para cada amigo.</AppText>

          {resultado ? (
            <View style={[estilos.resultado, resultado.ok ? estilos.resultadoOk : estilos.resultadoInfo]} accessibilityRole="alert">
              <Ionicons
                name={resultado.ok ? 'checkmark-circle' : 'information-circle'}
                size={24}
                color={resultado.ok ? '#3E8E2F' : colors.primaryDark}
              />
              <AppText style={estilos.resultadoTexto}>{resultado.texto}</AppText>
            </View>
          ) : jaHoje === null ? (
            <ActivityIndicator color={colors.primaryDark} style={{ marginVertical: 24 }} />
          ) : bloqueado ? (
            <View style={[estilos.resultado, estilos.resultadoInfo]}>
              <Ionicons name="information-circle" size={24} color={colors.primaryDark} />
              <AppText style={estilos.resultadoTexto}>
                {mensagemEnvioCartinha(jaHoje ? 'ja_enviada' : 'limite', amigo.apelido)}
              </AppText>
            </View>
          ) : (
            <ScrollView style={estilos.lista} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <AppText style={estilos.grupo}>Para celebrar</AppText>
              {grade(CARTINHAS_CELEBRAR)}

              <AppText style={estilos.grupo}>Lembrete gentil</AppText>
              <AppText style={estilos.grupoSub}>
                Um convite leve, sem cobrança. {amigo.apelido} nunca vê se você achou que faltava algo.
              </AppText>
              {grade(CARTINHAS_LEMBRETE)}
            </ScrollView>
          )}

          {!resultado && !bloqueado && jaHoje !== null && (
            <TouchableOpacity
              style={[estilos.enviar, (!escolhida || enviando) && estilos.enviarOff]}
              disabled={!escolhida || enviando}
              onPress={() => void enviar()}
              accessibilityRole="button"
            >
              {enviando ? (
                <ActivityIndicator color={colors.primaryDark} />
              ) : (
                <AppText style={estilos.enviarTexto}>ENVIAR CARTINHA</AppText>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={estilos.fechar} onPress={onFechar} accessibilityRole="button">
            <AppText style={estilos.fecharTexto}>{resultado?.ok ? 'Pronto' : 'Cancelar'}</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, justifyContent: 'flex-end' },
  fundo: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  caixa: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28, maxHeight: '88%' },
  puxador: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5DDD8', marginBottom: 14 },
  titulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2, marginBottom: 8 },
  lista: { flexGrow: 0 },
  grupo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark, marginTop: 10, marginBottom: 6 },
  grupoSub: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  celula: { width: '30.5%' },
  resultado: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14, marginVertical: 14 },
  resultadoOk: { backgroundColor: '#E8F5DF' },
  resultadoInfo: { backgroundColor: '#EEF4F0' },
  resultadoTexto: { flex: 1, fontSize: 14, color: colors.primaryDark },
  enviar: { alignItems: 'center', justifyContent: 'center', minHeight: 50, marginTop: 14, borderRadius: 16, backgroundColor: colors.primary },
  enviarOff: { opacity: 0.45 },
  enviarTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  fechar: { alignItems: 'center', marginTop: 10, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#D1D5DB' },
  fecharTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#4B5563' },
});
