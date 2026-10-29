// src/features/conteudo/components/preview/PreviaTrilhaAoVivo.tsx
// Prévia AO VIVO da trilha: a faixa do topo (mesmo visual da TrilhaScreen, via ui/tema.ts) e o
// caminho de nós do app do adolescente (componente real TrilhaCaminho), com o que está na tela AGORA — título da trilha e nomes dos
// módulos ainda não salvos — e a ordem atual dos módulos/lições. Serve para criar e para alterar.
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { TrilhaCaminho } from '../../../adolescente/trilha/components/TrilhaPath';
import { TEMA_TRILHA as T } from '../../../adolescente/trilha/ui/tema';
import { gruposDoCaminho, type TrilhaDaPrevia } from '../../utils/previa';
import { useDebounced } from '../../hooks/useDebounced';
import { QuadroCelular } from './QuadroCelular';

const AVISO = 'AO VIVO · mostra o que você está editando. Nada é salvo e não gera XP.';

type Props = {
  titulo: string;
  modulos: TrilhaDaPrevia['modulos'];
  /** lugar da trilha no caminho dos adolescentes (1 = primeira) */
  numero: number;
  total: number;
  /** tocar num nó abre a prévia da lição (versão salva) */
  onPressNo?: (licaoId: string) => void;
  altura?: number;
};

export default function PreviaTrilhaAoVivo({ titulo, modulos, numero, total, onPressNo, altura = 640 }: Props) {
  const estado = useMemo(() => ({ titulo, modulos, numero, total }), [titulo, modulos, numero, total]);
  const atual = useDebounced(estado, 250);
  const atualizando = atual !== estado;

  const dados = useMemo<TrilhaDaPrevia>(
    () => ({ id: 'rascunho', titulo: atual.titulo.trim() || 'Sem título', xpBonus: null, modulos: atual.modulos }),
    [atual]
  );
  const grupos = useMemo(() => gruposDoCaminho(dados, atual.numero), [dados, atual.numero]);
  const qtdLicoes = dados.modulos.reduce((s, m) => s + m.licoes.length, 0);

  return (
    <View style={styles.raiz}>
      <View style={styles.aoVivo}>
        <View style={[styles.ponto, atualizando && styles.pontoAtualizando]} />
        <AppText style={styles.aoVivoTexto}>{atualizando ? 'ATUALIZANDO…' : 'AO VIVO'}</AppText>
      </View>

      <QuadroCelular aviso={AVISO} altura={altura}>
        <View style={styles.tela}>
          <View style={styles.faixa}>
            <View style={styles.faixaIcone}>
              <Ionicons name="leaf" size={20} color={colors.primaryDark} />
            </View>
            <View style={styles.faixaTextos}>
              <AppText numberOfLines={1} style={styles.faixaRotulo}>
                {atual.total > 1 ? `Trilha ${atual.numero} de ${atual.total}` : 'Trilha'}
              </AppText>
              <AppText numberOfLines={2} style={styles.faixaTitulo}>
                {dados.titulo}
              </AppText>
              {qtdLicoes > 0 && (
                <View style={styles.faixaBarra}>
                  <View style={[styles.faixaBarraPreenchimento, { width: '0%' }]} />
                </View>
              )}
            </View>
            <View style={styles.faixaProgresso}>
              <AppText style={styles.faixaNumero}>0/{qtdLicoes}</AppText>
              <AppText style={styles.faixaNumeroRotulo}>lições</AppText>
            </View>
          </View>

          {qtdLicoes === 0 ? (
            <View style={styles.vazio}>
              <AppText style={styles.vazioTitulo}>{dados.modulos.length === 0 ? 'Nenhum módulo ainda' : 'Nenhuma lição ainda'}</AppText>
              <AppText style={styles.vazioTexto}>
                {dados.modulos.length === 0
                  ? 'Depois de criar a trilha, adicione módulos e lições: eles aparecem aqui, como o adolescente vê.'
                  : 'Adicione lições aos módulos e elas aparecem aqui no caminho.'}
              </AppText>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              <TrilhaCaminho grupos={grupos} onPressNo={onPressNo ? (no) => onPressNo(no.id) : undefined} />
            </ScrollView>
          )}
        </View>
      </QuadroCelular>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: 8, width: '100%', maxWidth: 400, alignSelf: 'center' },
  aoVivo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ponto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  pontoAtualizando: { backgroundColor: '#FFAB19' },
  aoVivoTexto: { fontFamily: typography.bold, fontSize: 12, letterSpacing: 0.6, color: colors.primaryDark },
  tela: { flex: 1, paddingTop: 12, backgroundColor: T.fundoTela },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: T.cartaoFundo,
    borderWidth: 1.5,
    borderColor: T.cartaoBorda,
  },
  faixaIcone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  faixaTextos: { flex: 1 },
  faixaRotulo: { fontFamily: typography.semiBold, fontSize: 12, letterSpacing: 0.3, color: colors.primaryShadow },
  faixaTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark, marginTop: 2 },
  faixaBarra: { height: 6, borderRadius: 3, marginTop: 8, backgroundColor: 'rgba(27, 67, 50, 0.12)', overflow: 'hidden' },
  faixaBarraPreenchimento: { height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  faixaProgresso: { alignItems: 'center', minWidth: 44 },
  faixaNumero: { fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  faixaNumeroRotulo: { fontFamily: typography.medium, fontSize: 11, color: colors.primaryShadow },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 28 },
  vazioTitulo: { fontFamily: typography.bold, fontSize: 18, color: colors.primaryDark },
  vazioTexto: { fontFamily: typography.regular, fontSize: 14, lineHeight: 20, color: '#6B7280', textAlign: 'center' },
});
