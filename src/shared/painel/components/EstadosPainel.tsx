// src/shared/painel/components/EstadosPainel.tsx
// Estados padrão das telas do painel: carregando e erro. O erro nunca mostra a mensagem
// crua do banco como texto principal: ela é traduzida (utils/mensagemErro) e o original
// fica recolhido em "Detalhe técnico", para a equipe poder relatar o problema.
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { typography } from '../../theme/typography';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { erroAmigavel } from '../utils/mensagemErro';
import { ALVO_TOQUE, fonte } from '../painelTheme';

export function EstadoCarregando({ texto = 'Carregando…' }: { texto?: string }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.centro} accessibilityRole="progressbar" accessibilityLabel={texto}>
      <ActivityIndicator color={tema.destaqueTexto} size="large" />
      <AppText style={styles.carregandoTexto}>{texto}</AppText>
    </View>
  );
}

export function EstadoErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [verDetalhe, setVerDetalhe] = useState(false);
  const e = erroAmigavel(mensagem);
  return (
    <View style={[styles.centro, styles.caixaErro]} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={30} color={tema.alertaTexto} />
      <AppText style={styles.erroTitulo}>{e.titulo}</AppText>
      <AppText style={styles.erroTexto}>{e.texto}</AppText>
      {!!onTentar && (
        <AppButton
          label="TENTAR DE NOVO"
          fullWidth={false}
          size="compact"
          backgroundColor={tema.botaoFundo}
          textColor={tema.botaoTexto}
          shadowColor={tema.botaoSombra}
          style={{ paddingHorizontal: 20, minHeight: ALVO_TOQUE, marginTop: 4 }}
          onPress={onTentar}
        />
      )}
      {!!e.detalhe && (
        <>
          <Pressable
            onPress={() => setVerDetalhe((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: verDetalhe }}
            style={styles.detalheBotao}
          >
            <AppText style={styles.detalheBotaoTexto}>{verDetalhe ? 'Ocultar detalhe técnico' : 'Ver detalhe técnico'}</AppText>
          </Pressable>
          {verDetalhe && <AppText style={styles.detalhe} selectable>{e.detalhe}</AppText>}
        </>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 } as const,
  carregandoTexto: { fontFamily: typography.medium, fontSize: fonte.apoio, color: t.textoSuave } as const,
  caixaErro: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.alerta, borderLeftWidth: 4, paddingHorizontal: 20 } as const,
  erroTitulo: { fontFamily: typography.bold, fontSize: fonte.tituloSecao, color: t.texto, textAlign: 'center' } as const,
  erroTexto: { fontFamily: typography.regular, fontSize: fonte.apoio, color: t.textoCorpo, textAlign: 'center', maxWidth: 520, lineHeight: 19 } as const,
  detalheBotao: { minHeight: ALVO_TOQUE, justifyContent: 'center', paddingHorizontal: 8 } as const,
  detalheBotaoTexto: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.info, textDecorationLine: 'underline' } as const,
  detalhe: { fontFamily: typography.regular, fontSize: fonte.legenda, color: t.textoSuave, textAlign: 'center', maxWidth: 560 } as const,
});
