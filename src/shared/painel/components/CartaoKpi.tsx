// src/shared/painel/components/CartaoKpi.tsx
// Indicador numérico do painel. Com `onPress`, o cartão vira atalho para a lista que
// explica o número (ex.: "Aguardando aprovação" abre a fila), em vez de ser um beco sem saída.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { formatarNumero } from '../formatadores';
import { formatarVariacao } from '../utils/widgets';
import type { IconeNome } from '../types';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import type { AjudaWidget } from '../ajuda';
import { fonte } from '../painelTheme';
import { AjudaInfo } from './AjudaInfo';
import { Sparkline } from './widgets/Sparkline';

type Props = {
  titulo: string;
  valor: number | null | undefined;
  icone: IconeNome;
  /** destaca o cartão (ex.: itens aguardando aprovação) */
  alerta?: boolean;
  detalhe?: string;
  /** explicação curta do indicador (abre ao tocar no "i") */
  ajuda?: AjudaWidget;
  /** minigráfico com a evolução diária (opcional) */
  sparkline?: number[];
  /** variação % da 2ª metade do período sobre a 1ª (opcional); null esconde a etiqueta */
  tendencia?: number | null;
  /** abre a tela relacionada ao indicador */
  onPress?: () => void;
  /** texto do atalho, lido por leitores de tela e mostrado no rodapé (padrão: "Ver detalhes") */
  rotuloAcao?: string;
};

export function CartaoKpi({ titulo, valor, icone, alerta, detalhe, ajuda, sparkline, tendencia, onPress, rotuloAcao = 'Ver detalhes' }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const subiu = (tendencia ?? 0) >= 0;

  const conteudo = (
    <>
      <View style={styles.linhaIcone}>
        <View style={[styles.icone, { backgroundColor: alerta ? tema.alertaSuave : tema.destaqueSuave }]}>
          <Ionicons name={icone} size={20} color={alerta ? tema.alertaTexto : tema.destaqueTexto} />
        </View>
        {!!ajuda && <AjudaInfo titulo={titulo} texto={ajuda} />}
      </View>
      <AppText style={styles.titulo} numberOfLines={2}>
        {titulo}
      </AppText>
      <View style={styles.linhaValor}>
        <AppText style={[styles.valor, alerta && { color: tema.alertaTexto }]}>{formatarNumero(valor)}</AppText>
        {tendencia !== null && tendencia !== undefined && (
          <View
            style={[styles.etiqueta, { backgroundColor: subiu ? tema.destaqueSuave : tema.alertaSuave }]}
            accessibilityLabel={`${subiu ? 'Alta' : 'Queda'} de ${formatarVariacao(Math.abs(tendencia))} na segunda metade do período`}
          >
            <Ionicons name={subiu ? 'trending-up' : 'trending-down'} size={12} color={subiu ? tema.destaqueTexto : tema.alertaTexto} />
            <AppText style={[styles.etiquetaTexto, { color: subiu ? tema.destaqueTexto : tema.alertaTexto }]}>{formatarVariacao(tendencia)}</AppText>
          </View>
        )}
      </View>
      {!!detalhe && <AppText style={styles.detalhe}>{detalhe}</AppText>}
      {!!sparkline && sparkline.length > 1 && <Sparkline valores={sparkline} cor={alerta ? tema.alerta : tema.serie[0]} />}
      {!!onPress && (
        <View style={styles.rodape}>
          <AppText style={styles.rodapeTexto}>{rotuloAcao}</AppText>
          <Ionicons name="arrow-forward" size={14} color={tema.destaqueTexto} />
        </View>
      )}
    </>
  );

  if (!onPress) return <View style={[styles.card, alerta && styles.cardAlerta]}>{conteudo}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${formatarNumero(valor)}. ${rotuloAcao}`}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.card,
        alerta && styles.cardAlerta,
        hovered && styles.cardHover,
        pressed && styles.cardPressionado,
      ]}
    >
      {conteudo}
    </Pressable>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  card: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: t.borda, borderColor: t.cardBorda, padding: 16, gap: 6, flex: 1 } as const,
  cardAlerta: { borderColor: t.alerta, borderLeftWidth: 4 } as const,
  cardHover: { borderColor: t.campoBorda } as const,
  cardPressionado: { opacity: 0.85 } as const,
  linhaIcone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as const,
  icone: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 } as const,
  linhaValor: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 } as const,
  valor: { fontFamily: typography.bold, fontSize: fonte.kpi, color: t.texto, lineHeight: 34 } as const,
  etiqueta: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 } as const,
  etiquetaTexto: { fontFamily: typography.bold, fontSize: fonte.selo } as const,
  titulo: { fontFamily: typography.medium, fontSize: fonte.legenda, color: t.textoSuave } as const,
  detalhe: { fontFamily: typography.medium, fontSize: fonte.selo, color: t.textoSuave } as const,
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto', paddingTop: 6 } as const,
  rodapeTexto: { fontFamily: typography.semiBold, fontSize: fonte.legenda, color: t.destaqueTexto } as const,
});
