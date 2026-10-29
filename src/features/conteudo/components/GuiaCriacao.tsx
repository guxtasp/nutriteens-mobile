// src/features/conteudo/components/GuiaCriacao.tsx
// Guia visual "Como criar", passo a passo: marcador de passos clicável, desenho do passo,
// o que fazer em ordem, uma dica e botões Voltar/Próximo. Dá para rever quando quiser
// (menu "Como criar" ou o botão dentro dos editores).
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import { COR_CATEGORIA } from '../utils/blocos';
import { PASSOS_GUIA, passoValido } from '../utils/guiaCriacao';
import IlustracaoGuia from './IlustracaoGuia';

type Props = {
  passoInicial?: number;
  /** ações extras de cada passo (ex.: "Criar uma trilha agora") */
  acoes?: Partial<Record<string, { rotulo: string; onPress: () => void }>>;
};

export default function GuiaCriacao({ passoInicial = 0, acoes }: Props) {
  const [i, setI] = useState(passoValido(passoInicial));
  const passo = PASSOS_GUIA[i];
  const cor = COR_CATEGORIA[passo.cor];
  const ultimo = i === PASSOS_GUIA.length - 1;
  const acao = acoes?.[passo.id];

  return (
    <View style={styles.raiz}>
      {/* marcador de passos: toque para pular */}
      <View style={styles.marcador} accessibilityRole="tablist">
        {PASSOS_GUIA.map((p, k) => {
          const c = COR_CATEGORIA[p.cor];
          const atual = k === i;
          const feito = k < i;
          return (
            <Pressable
              key={p.id}
              onPress={() => setI(k)}
              accessibilityRole="tab"
              accessibilityState={{ selected: atual }}
              accessibilityLabel={`Passo ${k + 1}: ${p.titulo}`}
              hitSlop={6}
              style={[styles.bolinha, { borderColor: c.borda, backgroundColor: atual || feito ? c.fundo : colors.white }]}
            >
              {feito ? <Ionicons name="checkmark" size={16} color={colors.white} /> : <AppText style={[styles.bolinhaTexto, { color: atual ? colors.white : c.borda }]}>{k + 1}</AppText>}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.cartao, { borderColor: cor.borda }]}>
        <View style={[styles.faixa, { backgroundColor: cor.fundo, borderBottomColor: cor.borda }]}>
          <AppText style={styles.faixaRotulo}>PASSO {i + 1} DE {PASSOS_GUIA.length}</AppText>
          <AppText style={styles.faixaTitulo}>{passo.titulo}</AppText>
        </View>

        <View style={styles.corpo}>
          <IlustracaoGuia tipo={passo.ilustracao} />
          <AppText style={styles.resumo}>{passo.resumo}</AppText>

          <View style={styles.lista}>
            <AppText style={styles.listaTitulo}>O que fazer</AppText>
            {passo.faca.map((f, k) => (
              <View key={k} style={styles.item}>
                <View style={[styles.itemNumero, { backgroundColor: cor.fundo }]}>
                  <AppText style={styles.itemNumeroTexto}>{k + 1}</AppText>
                </View>
                <AppText style={styles.itemTexto}>{f}</AppText>
              </View>
            ))}
          </View>

          <View style={[styles.dica, { backgroundColor: cor.suave, borderColor: cor.fundo }]}>
            <Ionicons name="bulb-outline" size={18} color={cor.borda} />
            <AppText style={styles.dicaTexto}>{passo.dica}</AppText>
          </View>

          {!!acao && (
            <View style={{ flexDirection: 'row' }}>
              <AppButton label={acao.rotulo} fullWidth={false} size="compact" backgroundColor={colors.primaryDark} textColor={colors.white} shadowColor="#123024" style={styles.botao} onPress={acao.onPress} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.navegacao}>
        <AppButton label="VOLTAR" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} disabled={i === 0} style={styles.botao} onPress={() => setI((v) => passoValido(v - 1))} />
        {ultimo ? (
          <AppButton label="REVER DO INÍCIO" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={styles.botao} onPress={() => setI(0)} />
        ) : (
          <AppButton label="PRÓXIMO" fullWidth={false} size="compact" backgroundColor={colors.primaryDark} textColor={colors.white} shadowColor="#123024" style={styles.botao} onPress={() => setI((v) => passoValido(v + 1))} />
        )}
      </View>
    </View>
  );
}

/** Botão de atalho para o guia, em um dos passos (usado dentro dos editores). */
export function BotaoComoCriar({ passo = 0 }: { passo?: number }) {
  const navigation = useNavigation<any>();
  return (
    <Pressable
      onPress={() => navigation.navigate('GuiaCriacao', { passo })}
      accessibilityRole="button"
      accessibilityLabel="Abrir o passo a passo de como criar"
      style={({ pressed }) => [styles.atalho, pressed && { opacity: 0.8 }]}
    >
      <Ionicons name="school-outline" size={18} color={colors.primaryDark} />
      <AppText style={styles.atalhoTexto}>Como criar? Ver o passo a passo</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 14, width: '100%', maxWidth: 720, alignSelf: 'center' },
  marcador: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  bolinha: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  bolinhaTexto: { fontFamily: typography.bold, fontSize: 15 },
  cartao: { backgroundColor: painel.card, borderRadius: 18, borderWidth: 2, overflow: 'hidden' },
  faixa: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, gap: 2 },
  faixaRotulo: { fontFamily: typography.semiBold, fontSize: 11, letterSpacing: 0.6, color: 'rgba(255,255,255,0.85)' },
  faixaTitulo: { fontFamily: typography.bold, fontSize: 20, color: colors.white },
  corpo: { padding: 16, gap: 14 },
  resumo: { fontFamily: typography.regular, fontSize: 15, lineHeight: 22, color: colors.textOnLight },
  lista: { gap: 8 },
  listaTitulo: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemNumero: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  itemNumeroTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.white },
  itemTexto: { flex: 1, fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: colors.textOnLight },
  dica: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 2, borderRadius: 12, padding: 12 },
  dicaTexto: { flex: 1, fontFamily: typography.regular, fontSize: 13, lineHeight: 19, color: colors.textOnLight },
  navegacao: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  botao: { paddingHorizontal: 18, minHeight: 44 },
  atalho: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', minHeight: 44, paddingHorizontal: 14, borderRadius: 22, borderWidth: 2, borderColor: '#CFE8B5', backgroundColor: '#F3F9EC' },
  atalhoTexto: { fontFamily: typography.semiBold, fontSize: 13, color: colors.primaryDark },
});
