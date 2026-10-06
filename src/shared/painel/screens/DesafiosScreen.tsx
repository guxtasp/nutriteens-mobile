// src/shared/painel/screens/DesafiosScreen.tsx
// Catálogo de desafios (missões diárias e periódicas) com uso real e botão ativar/desativar.
// Compartilhado por Admin e Nutricionista; o banco confere o papel em cada chamada.
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PainelLayout } from '../PainelLayout';
import { IntroSecao } from '../components/IntroSecao';
import { CartaoSecao } from '../components/CartaoSecao';
import { GridResponsiva } from '../components/GridResponsiva';
import { EstadoCarregando, EstadoErro } from '../components/EstadosPainel';
import { Selo, VazioPainel } from '../components/ControlesLista';
import { AppText } from '../../ui/AppText';
import { AppButton } from '../../ui/AppButton';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { painel } from '../painelTheme';
import type { ConfigPainel } from '../types';
import {
  DesafioDiario, DesafioPeriodico, METRICA_LABEL, definirDesafioAtivo, listarDesafios,
} from '../../../features/nutricionista/services/desafiosService';

function CartaoDesafio(p: {
  titulo: string; descricao: string; selos: string[]; ativa: boolean; uso: string; ocupado: boolean; erro?: string | null; onAlternar: () => void;
}) {
  return (
    <View style={[styles.card, !p.ativa && styles.cardInativo]}>
      <View style={styles.topo}>
        <Selo texto={p.ativa ? 'Ativo' : 'Desativado'} tom={p.ativa ? 'ok' : 'neutro'} />
        {p.selos.map((s) => <Selo key={s} texto={s} tom="info" />)}
      </View>
      <AppText style={styles.titulo}>{p.titulo}</AppText>
      <AppText style={styles.descricao}>{p.descricao}</AppText>
      <AppText style={styles.uso}>{p.uso}</AppText>
      {!!p.erro && <AppText style={styles.erro}>{p.erro}</AppText>}
      <View style={{ flexDirection: 'row' }}>
        <AppButton
          label={p.ativa ? 'DESATIVAR' : 'ATIVAR'}
          fullWidth={false}
          size="compact"
          outlineColor={p.ativa ? colors.error : colors.primaryDark}
          textColor={p.ativa ? colors.error : colors.primaryDark}
          disabled={p.ocupado}
          style={{ paddingHorizontal: 16, minHeight: 44 }}
          onPress={p.onAlternar}
        />
      </View>
    </View>
  );
}

export default function DesafiosScreen({ config }: { config: ConfigPainel }) {
  const [diarios, setDiarios] = useState<DesafioDiario[]>([]);
  const [periodicos, setPeriodicos] = useState<DesafioPeriodico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erroItem, setErroItem] = useState<{ ref: string; msg: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await listarDesafios();
      setDiarios(r.diarios);
      setPeriodicos(r.periodicos);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar os desafios.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      carregar();
    }, [carregar])
  );

  async function alternar(origem: 'DIARIO' | 'PERIODICO', ref: string, ativa: boolean) {
    setOcupado(ref);
    setErroItem(null);
    try {
      await definirDesafioAtivo(origem, ref, !ativa);
      await carregar();
    } catch (e: any) {
      setErroItem({ ref, msg: e?.message ?? 'Não foi possível alterar o desafio.' });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <PainelLayout config={config} titulo="Desafios" subtitulo="Missões que os adolescentes recebem">
      <IntroSecao
        chave="painel_desafios"
        titulo="Como funcionam os desafios"
        linhas={[
          'Desafios diários: cada dia o adolescente recebe missões (ex.: beber água, registrar refeição). Ao concluir, ganha pontos.',
          'Desafios semanais e mensais: metas maiores, que somam vários dias de hábito.',
          'Desativar um desafio o tira dos próximos sorteios e metas; o histórico de quem já concluiu permanece.',
        ]}
      />
      {carregando ? (
        <EstadoCarregando />
      ) : erro ? (
        <EstadoErro mensagem={erro} onTentar={() => { setCarregando(true); carregar(); }} />
      ) : (
        <>
          <CartaoSecao titulo={`Desafios diários (${diarios.length})`} ajuda="Missões sorteadas por dia. 'Sorteado' = quantas vezes apareceu para alguém; 'Concluído' = quantas vezes rendeu pontos.">
            {diarios.length === 0 ? (
              <VazioPainel titulo="Nenhum desafio diário" texto="O catálogo de missões diárias está vazio." />
            ) : (
              <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                {diarios.map((d) => (
                  <CartaoDesafio
                    key={d.ref}
                    titulo={d.titulo}
                    descricao={d.descricao}
                    selos={[`${d.pontos} pontos`]}
                    ativa={d.ativa}
                    uso={`Sorteado ${d.sorteada}x · Concluído ${d.concluida}x`}
                    ocupado={ocupado === d.ref}
                    erro={erroItem?.ref === d.ref ? erroItem.msg : null}
                    onAlternar={() => alternar('DIARIO', d.ref, d.ativa)}
                  />
                ))}
              </GridResponsiva>
            )}
          </CartaoSecao>

          <CartaoSecao titulo={`Desafios semanais e mensais (${periodicos.length})`} ajuda="Metas acumuladas. 'Resgatado' = quantas vezes um adolescente completou a meta e recebeu os pontos.">
            {periodicos.length === 0 ? (
              <VazioPainel titulo="Nenhum desafio periódico" texto="O catálogo de desafios semanais e mensais está vazio." />
            ) : (
              <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                {periodicos.map((d) => (
                  <CartaoDesafio
                    key={d.ref}
                    titulo={d.titulo}
                    descricao={d.descricao}
                    selos={[d.periodo === 'SEMANAL' ? 'Semanal' : 'Mensal', `${d.pontos} pontos`]}
                    ativa={d.ativa}
                    uso={`Meta: ${d.alvo} ${METRICA_LABEL[d.metrica] ?? d.metrica} · Resgatado ${d.resgatada}x`}
                    ocupado={ocupado === d.ref}
                    erro={erroItem?.ref === d.ref ? erroItem.msg : null}
                    onAlternar={() => alternar('PERIODICO', d.ref, d.ativa)}
                  />
                ))}
              </GridResponsiva>
            )}
          </CartaoSecao>
        </>
      )}
    </PainelLayout>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: painel.card, borderRadius: painel.cardRaio, borderWidth: 2, borderColor: painel.cardBorda, padding: 14, gap: 8, minWidth: 0 },
  cardInativo: { opacity: 0.75 },
  topo: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: colors.primaryDark },
  descricao: { fontFamily: typography.regular, fontSize: 13, color: colors.textOnLight, lineHeight: 19 },
  uso: { fontFamily: typography.medium, fontSize: 12, color: painel.textoSuave },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error },
});
