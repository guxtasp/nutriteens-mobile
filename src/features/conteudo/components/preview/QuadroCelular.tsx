// src/features/conteudo/components/preview/QuadroCelular.tsx
// Moldura de CELULAR para as prévias: borda escura arredondada, botões laterais, ilha da câmera,
// barra de status e barra de início. O conteúdo roda com os componentes reais do aplicativo do
// adolescente, numa tela de tamanho fixo, sob um aviso de que nada é salvo.
// Todas as prévias do painel (lição, trilha, receita) passam por aqui: mude a moldura só neste arquivo.
import React, { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LarguraTelaProvider } from '../../../../shared/ui/LarguraTela';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';

export const LARGURA_MAX_QUADRO = 400;
const BORDA_APARELHO = 10; // espessura da moldura escura
const COR_APARELHO = '#1F2A26';
const COR_BORDA_APARELHO = '#3B4A43';
const ALTURA_STATUS = 34;
const ALTURA_INICIO = 22;

export function QuadroCelular({ children, altura = 680, aviso }: { children: React.ReactNode; altura?: number; aviso?: string }) {
  const { width: janela } = useWindowDimensions();
  // largura útil da tela: a medida de verdade (onLayout), ou uma estimativa até medir
  const [medida, setMedida] = useState<number | null>(null);
  const estimada = Math.max(240, Math.min(LARGURA_MAX_QUADRO, janela - 40) - BORDA_APARELHO * 2);
  const largura = medida ?? estimada;

  return (
    <View style={styles.externo}>
      <View style={styles.aviso} accessibilityRole="alert">
        <AppText style={styles.avisoTexto}>{aviso ?? 'PRÉVIA · como o adolescente vê. Nada é salvo e não gera XP.'}</AppText>
      </View>

      <View style={styles.aparelho} accessibilityLabel="Moldura de celular com a prévia">
        {/* botões laterais */}
        <View style={[styles.botao, styles.esquerda, { top: 92, height: 22 }]} />
        <View style={[styles.botao, styles.esquerda, { top: 132, height: 44 }]} />
        <View style={[styles.botao, styles.esquerda, { top: 186, height: 44 }]} />
        <View style={[styles.botao, styles.direita, { top: 150, height: 70 }]} />

        {/* `altura` é a área do conteúdo; a barra de status e a de início são somadas por fora */}
        <View style={[styles.tela, { height: altura + ALTURA_STATUS + ALTURA_INICIO }]}>
          <View style={styles.statusBar} pointerEvents="none">
            <AppText style={styles.hora}>9:41</AppText>
            <View style={styles.statusIcones}>
              <Ionicons name="cellular" size={14} color={COR_APARELHO} />
              <Ionicons name="wifi" size={14} color={COR_APARELHO} />
              <Ionicons name="battery-full" size={16} color={COR_APARELHO} />
            </View>
          </View>
          <View style={styles.ilha} pointerEvents="none" />

          <View style={styles.conteudo} onLayout={(e) => setMedida(Math.max(240, Math.round(e.nativeEvent.layout.width)))}>
            <LarguraTelaProvider largura={largura}>{children}</LarguraTelaProvider>
          </View>

          <View style={styles.inicio} pointerEvents="none">
            <View style={styles.inicioBarra} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externo: { width: '100%', maxWidth: LARGURA_MAX_QUADRO, alignSelf: 'center', gap: 8 },
  aviso: { backgroundColor: '#FFF4CC', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  avisoTexto: { fontFamily: typography.semiBold, fontSize: 12, color: '#7A5B00', textAlign: 'center' },
  // o corpo do celular (sem overflow escondido, para os botões laterais aparecerem)
  aparelho: {
    marginHorizontal: 4,
    padding: BORDA_APARELHO,
    borderRadius: 44,
    backgroundColor: COR_APARELHO,
    borderWidth: 2,
    borderColor: COR_BORDA_APARELHO,
  },
  botao: { position: 'absolute', width: 4, borderRadius: 2, backgroundColor: COR_BORDA_APARELHO },
  esquerda: { left: -5 },
  direita: { right: -5 },
  tela: { borderRadius: 34, overflow: 'hidden', backgroundColor: colors.white },
  statusBar: { height: ALTURA_STATUS, paddingHorizontal: 22, paddingTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hora: { fontFamily: typography.bold, fontSize: 13, color: COR_APARELHO },
  statusIcones: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // "ilha" da câmera, no centro do topo
  ilha: { position: 'absolute', top: 8, alignSelf: 'center', width: 86, height: 22, borderRadius: 11, backgroundColor: COR_APARELHO, zIndex: 5 },
  conteudo: { flex: 1 },
  inicio: { height: ALTURA_INICIO, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  inicioBarra: { width: 112, height: 4, borderRadius: 2, backgroundColor: COR_APARELHO, opacity: 0.4 },
});
