// src/features/adolescente/scanner/components/DiagnosticoProduto.tsx
// Diagnóstico visual do produto escaneado: termômetro de processamento + Raio-X do rótulo.
// Tom neutro e curioso: sem caloria, sem alerta vermelho, sem "bom/ruim". Barras em verde da marca.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import type { ClassificacaoNova } from '../../alimentacao/utils/regraFeedbackRefeicao';
import {
  colheresDeAcucar, EXPLICACAO_PROCESSAMENTO, NivelNutriente, nivelNutriente, NutrienteNivel, pontosPositivos,
  ProdutoScanner, ROTULO_NIVEL, textoAditivos, TEXTO_SEM_CLASSIFICACAO,
} from '../utils/scanner';

const ORDEM: ClassificacaoNova[] = ['IN_NATURA', 'INGREDIENTE_CULINARIO', 'PROCESSADO', 'ULTRAPROCESSADO'];
const CURTO = ['Natural', 'Ingrediente', 'Preparado', 'Industrial'];
const VAZIO = '#E3EAE6';

function Cartao({ icone, titulo, children, atraso = 0 }: { icone: string; titulo: string; children: React.ReactNode; atraso?: number }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320, delay: atraso }}
      style={styles.cartao}
    >
      <View style={styles.cartaoTitulo}>
        <MaterialCommunityIcons name={icone as any} size={18} color={colors.primaryDark} />
        <AppText style={styles.cartaoTituloTexto}>{titulo}</AppText>
      </View>
      {children}
    </MotiView>
  );
}

function Termometro({ nova }: { nova: ClassificacaoNova | null }) {
  if (!nova) {
    return (
      <Cartao icone="thermometer" titulo="Nível de processamento">
        <AppText style={styles.texto}>{TEXTO_SEM_CLASSIFICACAO}</AppText>
      </Cartao>
    );
  }
  const atual = ORDEM.indexOf(nova);
  return (
    <Cartao icone="thermometer" titulo="Nível de processamento">
      <View style={styles.termometro}>
        {ORDEM.map((n, i) => (
          <View key={n} style={styles.passo}>
            <MotiView
              from={{ opacity: 0, scaleY: 0.4 }}
              animate={{ opacity: 1, scaleY: i === atual ? 1.35 : 1 }}
              transition={{ type: 'timing', duration: 300, delay: 120 + i * 90 }}
              style={[styles.segmento, { backgroundColor: i <= atual ? colors.primary : VAZIO }, i === atual && styles.segmentoAtual]}
            />
            <AppText style={[styles.passoRotulo, i === atual && styles.passoRotuloAtual]} numberOfLines={1}>{CURTO[i]}</AppText>
          </View>
        ))}
      </View>
      <AppText style={styles.texto}>{EXPLICACAO_PROCESSAMENTO[nova]}</AppText>
    </Cartao>
  );
}

function Barra({ nivel }: { nivel: NivelNutriente }) {
  const cheios = nivel === 'POUCO' ? 1 : nivel === 'MEDIO' ? 2 : 3;
  return (
    <View style={styles.barra}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.barraSeg, { backgroundColor: i <= cheios ? colors.primary : VAZIO }]} />
      ))}
    </View>
  );
}

const LINHAS: { tipo: NutrienteNivel; icone: string; rotulo: string; campo: 'acucarG' | 'salG' | 'gorduraSatG' }[] = [
  { tipo: 'ACUCAR', icone: 'cube-outline', rotulo: 'Açúcar', campo: 'acucarG' },
  { tipo: 'SAL', icone: 'shaker-outline', rotulo: 'Sal', campo: 'salG' },
  { tipo: 'GORDURA_SAT', icone: 'water-outline', rotulo: 'Gordura saturada', campo: 'gorduraSatG' },
];

function RaioX({ produto }: { produto: ProdutoScanner }) {
  const d = produto.detalhes;
  if (!d) return null;
  const linhas = LINHAS.map((l) => ({ ...l, nivel: nivelNutriente(l.tipo, d[l.campo]) })).filter((l) => l.nivel);
  const positivos = pontosPositivos(d);
  if (linhas.length === 0 && positivos.length === 0) return null;

  return (
    <Cartao icone="magnify-scan" titulo="Raio-X do rótulo" atraso={120}>
      {linhas.map((l) => (
        <View key={l.tipo} style={styles.linha}>
          <View style={styles.linhaIcone}>
            <MaterialCommunityIcons name={l.icone as any} size={20} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.linhaTopo}>
              <AppText style={styles.linhaRotulo}>{l.rotulo}</AppText>
              <AppText style={styles.linhaNivel}>{ROTULO_NIVEL[l.nivel as NivelNutriente]}</AppText>
            </View>
            <Barra nivel={l.nivel as NivelNutriente} />
            {l.tipo === 'ACUCAR' && !!colheresDeAcucar(d.acucarG) && (
              <AppText style={styles.linhaDetalhe}>{colheresDeAcucar(d.acucarG)} de açúcar a cada 100 g</AppText>
            )}
          </View>
        </View>
      ))}

      {positivos.length > 0 && (
        <View style={styles.chips}>
          {positivos.map((p) => (
            <View key={p} style={styles.chip}>
              <MaterialCommunityIcons name="leaf" size={13} color={colors.primaryDark} />
              <AppText style={styles.chipTexto}>{p}</AppText>
            </View>
          ))}
        </View>
      )}
      <AppText style={styles.nota}>Valores a cada 100 g (ou 100 ml). Dados colaborativos da Open Food Facts: podem ter diferenças.</AppText>
    </Cartao>
  );
}

function Ingredientes({ produto }: { produto: ProdutoScanner }) {
  const d = produto.detalhes;
  const aditivos = textoAditivos(d?.aditivos);
  const ingredientes = d?.ingredientes ?? [];
  if (!aditivos && ingredientes.length === 0) return null;

  return (
    <Cartao icone="format-list-numbered" titulo="Lá dentro" atraso={200}>
      {ingredientes.length > 0 && (
        <>
          <AppText style={styles.texto}>Os ingredientes vêm em ordem: do que tem mais para o que tem menos. Os primeiros são:</AppText>
          <View style={styles.chips}>
            {ingredientes.map((ing, i) => (
              <View key={`${i}-${ing}`} style={styles.chipNum}>
                <View style={styles.num}><AppText style={styles.numTexto}>{i + 1}</AppText></View>
                <AppText style={styles.chipTexto} numberOfLines={2}>{ing}</AppText>
              </View>
            ))}
          </View>
        </>
      )}
      {!!aditivos && (
        <View style={styles.aditivos}>
          <MaterialCommunityIcons name="flask-outline" size={16} color={colors.primaryDark} />
          <AppText style={styles.aditivosTexto}>{aditivos}</AppText>
        </View>
      )}
    </Cartao>
  );
}

export default function DiagnosticoProduto({ produto }: { produto: ProdutoScanner }) {
  return (
    <View style={{ gap: 14 }}>
      <Termometro nova={produto.classificacaoNova} />
      <RaioX produto={produto} />
      <Ingredientes produto={produto} />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: '#F2F7F4', borderRadius: 20, padding: 16, gap: 12 },
  cartaoTitulo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartaoTituloTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  texto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#5A6B63' },
  nota: { fontFamily: typography.regular, fontSize: 11, lineHeight: 15, color: '#7A8B94' },

  termometro: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', paddingTop: 6 },
  passo: { flex: 1, alignItems: 'center', gap: 6 },
  segmento: { height: 12, alignSelf: 'stretch', borderRadius: 6 },
  segmentoAtual: { borderWidth: 2, borderColor: colors.primaryDark },
  passoRotulo: { fontFamily: typography.regular, fontSize: 10.5, color: '#7A8B94' },
  passoRotuloAtual: { fontFamily: typography.bold, color: colors.primaryDark },

  linha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linhaIcone: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  linhaTopo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  linhaRotulo: { fontFamily: typography.bold, fontSize: 14, color: colors.primaryDark },
  linhaNivel: { fontFamily: typography.bold, fontSize: 13, color: '#5A6B63' },
  linhaDetalhe: { fontFamily: typography.regular, fontSize: 12, color: '#7A8B94', marginTop: 4 },
  barra: { flexDirection: 'row', gap: 4 },
  barraSeg: { flex: 1, height: 8, borderRadius: 4 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  chipNum: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '100%' },
  chipTexto: { fontFamily: typography.regular, fontSize: 12.5, color: colors.primaryDark, flexShrink: 1 },
  num: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  numTexto: { fontFamily: typography.bold, fontSize: 11, color: '#2E3A45' },
  aditivos: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aditivosTexto: { fontFamily: typography.regular, fontSize: 13, color: '#5A6B63', flexShrink: 1 },
});
