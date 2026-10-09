// src/features/adolescente/social/components/ChamaDuplaSection.tsx
//
// Seção "Chama em Dupla" da tela Social: dupla ativa (dias, vidas, progresso de
// hoje), convites recebidos e enviados, avisos neutros e o lembrete de fim de
// dia (toque para ir cumprir o dia). O convite é feito no perfil do amigo.
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '../../../../shared/ui/AppText';
import { InfoButton } from '../../../../shared/ui/InfoButton';
import { InfoSheet } from '../../../../shared/ui/InfoSheet';
import { AvatarSocialView } from './AvatarSocialView';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { useChamaDupla } from '../hooks/useChamaDupla';
import {
  COR_CHAMA,
  INFO_CHAMA_DUPLA,
  ehHoraDoLembrete,
  mensagemAviso,
  textoLembreteFimDeDia,
  textoProgressoHoje,
} from '../utils/chamaDupla';

type Props = {
  chama: ReturnType<typeof useChamaDupla>;
  /** abre a tela onde o dia é cumprido (lembrete de fim de dia) */
  onAbrirHome: () => void;
};

export function ChamaDuplaSection({ chama, onAbrirHome }: Props) {
  const { ativa, recebidos, enviados, responder, encerrar, dispensarAviso } = chama;
  const [infoAberta, setInfoAberta] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  function confirmar(id: string, titulo: string, texto: string) {
    Alert.alert(titulo, texto, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: () => void encerrar(id) },
    ]);
  }

  async function aoResponder(id: string, aceitar: boolean) {
    setOcupado(true);
    try {
      const ok = await responder(id, aceitar);
      if (!ok && aceitar) {
        Alert.alert('Chama em Dupla', 'Não foi possível aceitar: você ou seu amigo já está em outra dupla.');
      }
    } finally {
      setOcupado(false);
    }
  }

  const mostrarLembrete = !!ativa && !ativa.concluidaHoje && ehHoraDoLembrete(new Date());

  return (
    <>
      <View style={styles.titleRow}>
        <Ionicons name="flame" size={20} color={COR_CHAMA} />
        <AppText style={styles.title}>Chama em Dupla</AppText>
        <InfoButton onPress={() => setInfoAberta(true)} accessibilityLabel="O que é a Chama em Dupla?" />
      </View>

      {recebidos.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.linha}>
            <AvatarSocialView avatar={c.avatar} size="small" />
            <View style={styles.flex}>
              <AppText style={styles.nome}>{c.apelido} te convidou</AppText>
              <AppText style={styles.sub}>Para manter uma Chama em Dupla juntos.</AppText>
            </View>
          </View>
          <View style={styles.acoes}>
            <TouchableOpacity
              style={styles.botaoSec}
              disabled={ocupado}
              onPress={() => void aoResponder(c.id, false)}
              accessibilityRole="button"
            >
              <AppText style={styles.botaoSecTexto}>Agora não</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.botao}
              disabled={ocupado}
              onPress={() => void aoResponder(c.id, true)}
              accessibilityRole="button"
            >
              <AppText style={styles.botaoTexto}>Aceitar</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {ativa && (
        <View style={styles.card}>
          {ativa.aviso && (
            <View style={styles.aviso}>
              <AppText style={styles.avisoTexto}>{mensagemAviso(ativa.aviso, ativa.vidasRestantes)}</AppText>
              <TouchableOpacity onPress={() => void dispensarAviso(ativa.id)} hitSlop={10} accessibilityRole="button">
                <AppText style={styles.avisoOk}>Ok</AppText>
              </TouchableOpacity>
            </View>
          )}

          {mostrarLembrete && (
            <Pressable style={styles.aviso} onPress={onAbrirHome} accessibilityRole="button">
              <Ionicons name="alarm" size={20} color={COR_CHAMA} />
              <AppText style={styles.avisoTexto}>{textoLembreteFimDeDia(ativa.apelido)}</AppText>
              <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
            </Pressable>
          )}

          <View style={styles.linha}>
            <AvatarSocialView avatar={ativa.avatar} size="small" />
            <View style={styles.flex}>
              <AppText style={styles.nome}>Você e {ativa.apelido}</AppText>
              <AppText style={styles.sub}>{textoProgressoHoje(ativa)}</AppText>
            </View>
            <View style={styles.contador}>
              <AppText style={styles.contadorNumero}>{ativa.sequenciaAtual}</AppText>
              <AppText style={styles.contadorRotulo}>{ativa.sequenciaAtual === 1 ? 'dia' : 'dias'}</AppText>
            </View>
          </View>
          <View style={styles.rodape}>
            <View style={styles.vidas} accessible accessibilityLabel={`${ativa.vidasRestantes} vidas restantes`}>
              {[0, 1, 2].map((i) => (
                <Ionicons
                  key={i}
                  name={i < ativa.vidasRestantes ? 'heart' : 'heart-outline'}
                  size={20}
                  color={i < ativa.vidasRestantes ? colors.exercicioErro : colors.trilhaNoBloqueadoIcone}
                />
              ))}
            </View>
            <TouchableOpacity
              onPress={() => confirmar(ativa.id, 'Sair da dupla?', 'A Chama em Dupla será encerrada para vocês dois.')}
              accessibilityRole="button"
            >
              <AppText style={styles.sair}>Sair da dupla</AppText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {enviados.map((c) => (
        <View key={c.id} style={styles.card}>
          <View style={styles.linha}>
            <AvatarSocialView avatar={c.avatar} size="small" />
            <View style={styles.flex}>
              <AppText style={styles.nome}>Convite para {c.apelido}</AppText>
              <AppText style={styles.sub}>Esperando a resposta.</AppText>
            </View>
            <TouchableOpacity
              onPress={() => confirmar(c.id, 'Cancelar convite?', 'O convite será cancelado.')}
              accessibilityRole="button"
            >
              <AppText style={styles.sair}>Cancelar</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {!ativa && enviados.length === 0 && recebidos.length === 0 && (
        <View style={styles.card}>
          <AppText style={styles.sub}>
            Abra o perfil de um amigo e toque em “Convidar para Chama em Dupla” para começar.
          </AppText>
        </View>
      )}

      <InfoSheet visivel={infoAberta} onFechar={() => setInfoAberta(false)} {...INFO_CHAMA_DUPLA} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  title: { flex: 1, fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nome: { fontFamily: typography.semiBold, fontSize: 15, color: colors.textOnLight },
  sub: { fontSize: 13, lineHeight: 19, color: '#6B7280', marginTop: 2 },
  contador: { alignItems: 'center', minWidth: 48 },
  contadorNumero: { fontFamily: typography.bold, fontSize: 26, color: COR_CHAMA },
  contadorRotulo: { fontFamily: typography.medium, fontSize: 12, color: '#6B7280' },
  rodape: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  vidas: { flexDirection: 'row', gap: 4 },
  sair: { fontFamily: typography.medium, fontSize: 13, color: '#6B7280' },
  aviso: {
    backgroundColor: '#FFF4E8',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avisoTexto: { flex: 1, fontFamily: typography.medium, fontSize: 13, color: colors.textOnLight },
  avisoOk: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  acoes: { flexDirection: 'row', gap: 10, marginTop: 12 },
  botao: { flex: 1, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12 },
  botaoTexto: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  botaoSec: { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#D1D5DB' },
  botaoSecTexto: { fontFamily: typography.semiBold, fontSize: 14, color: '#4B5563' },
});
