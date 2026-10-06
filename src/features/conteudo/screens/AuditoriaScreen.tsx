// src/features/conteudo/screens/AuditoriaScreen.tsx
// Histórico imutável: quem fez o quê, quando, em qual versão e por quê.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../../../shared/painel/PainelLayout';
import { IntroSecao } from '../../../shared/painel/components/IntroSecao';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { ConfigPainel } from '../../../shared/painel/types';
import { listarAuditoria, type RegistroAuditoria } from '../services/fluxoService';
import { ACAO_LABEL, STATUS_LABEL, TIPO_LABEL, formatarDataHora, type StatusFluxo, type TipoConteudo } from '../utils/fluxo';

const FILTROS: { chave: string; label: string; tipo?: TipoConteudo }[] = [
  { chave: 'TODOS', label: 'Tudo' },
  { chave: 'TRILHA', label: 'Trilhas', tipo: 'TRILHA' },
  { chave: 'RECEITA', label: 'Receitas', tipo: 'RECEITA' },
];

const rotuloStatus = (s: string | null) => (s ? STATUS_LABEL[s as StatusFluxo] ?? s : null);

export default function AuditoriaScreen({ config }: { config: ConfigPainel }) {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const tipo = FILTROS.find((f) => f.chave === filtro)?.tipo;
      setRegistros(await listarAuditoria(150, tipo));
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar a auditoria.');
    } finally {
      setCarregando(false);
    }
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  return (
    <PainelLayout config={config} titulo="Auditoria" subtitulo="Quem criou, aprovou, rejeitou ou alterou cada conteúdo">
      <IntroSecao
        chave="auditoria"
        titulo="Para que serve a Auditoria"
        linhas={[
          'É o histórico de tudo que aconteceu com os conteúdos: quem criou, enviou, aprovou, rejeitou, publicou, editou ou arquivou, e quando.',
          'Os registros não podem ser alterados nem apagados. Use os filtros para ver só trilhas ou só receitas.',
          'Em rejeições, o motivo informado pela nutricionista aparece no registro.',
        ]}
      />
      <View style={styles.filtros}>
        {FILTROS.map((f) => {
          const ativo = f.chave === filtro;
          return (
            <Pressable key={f.chave} onPress={() => setFiltro(f.chave)} accessibilityRole="button" style={[styles.chip, ativo && styles.chipAtivo]}>
              <AppText style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{f.label}</AppText>
            </Pressable>
          );
        })}
      </View>

      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <CartaoSecao titulo="Registros" subtitulo={`${registros.length} mais recentes`} ajuda="Cada linha é uma ação: quem fez, em qual conteúdo, de qual status para qual, e o motivo quando existir.">
          {registros.length === 0 && <AppText style={styles.vazio}>Nenhum registro ainda.</AppText>}
          {registros.map((r) => (
            <View key={r.id} style={styles.linha}>
              <View style={styles.linhaTopo}>
                <AppText style={styles.acao}>{(ACAO_LABEL as Record<string, string>)[r.acao] ?? r.acao}</AppText>
                <AppText style={styles.quando}>{formatarDataHora(r.criadoEm)}</AppText>
              </View>
              <AppText style={styles.titulo}>
                {TIPO_LABEL[r.tipo] ?? r.tipo}: {r.titulo ?? '(sem título)'}
                {r.versao ? ` · v${r.versao}` : ''}
              </AppText>
              <AppText style={styles.meta}>
                {r.atorNome ?? 'Sistema'}
                {r.atorPapel ? ` (${r.atorPapel === 'NUTRICIONISTA' ? 'nutricionista' : 'admin'})` : ''}
                {r.statusAnterior || r.statusNovo
                  ? ` · ${rotuloStatus(r.statusAnterior) ?? '—'} → ${rotuloStatus(r.statusNovo) ?? '—'}`
                  : ''}
              </AppText>
              {!!r.motivo && <AppText style={styles.motivo}>Motivo: {r.motivo}</AppText>}
            </View>
          ))}
        </CartaoSecao>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 2, borderColor: painel.cardBorda, backgroundColor: painel.card, alignItems: 'center', justifyContent: 'center' },
  chipAtivo: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  chipTexto: { fontFamily: typography.bold, fontSize: 12, color: colors.primaryDark },
  chipTextoAtivo: { color: colors.white },
  linha: { borderTopWidth: 1, borderTopColor: painel.linhaSuave, paddingTop: 10, gap: 2 },
  linhaTopo: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  acao: { fontFamily: typography.bold, fontSize: 13, color: colors.primaryDark },
  quando: { fontFamily: typography.regular, fontSize: 11, color: painel.textoSuave },
  titulo: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight },
  meta: { fontFamily: typography.regular, fontSize: 12, color: painel.textoSuave },
  motivo: { fontFamily: typography.regular, fontSize: 12, color: colors.error },
  vazio: { fontFamily: typography.regular, fontSize: 13, color: painel.textoSuave },
});
