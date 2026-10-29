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
import { Ionicons } from '@expo/vector-icons';
import { FormConquista, FormDesafioPeriodico } from '../components/FormulariosDesafio';
import {
  CRITERIO_LABEL, InsigniaPainel, definirInsigniaAtiva, listarInsignias,
  DesafioDiario, DesafioPeriodico, METRICA_LABEL, definirDesafioAtivo, listarDesafios,
} from '../../../features/nutricionista/services/desafiosService';

function CartaoDesafio(p: {
  titulo: string; descricao: string; selos: string[]; ativa: boolean; uso: string; ocupado: boolean; erro?: string | null; onAlternar: () => void; onEditar?: () => void;
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
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {!!p.onEditar && (
          <AppButton label="EDITAR" fullWidth={false} size="compact" outlineColor={colors.primaryDark} textColor={colors.primaryDark} style={{ paddingHorizontal: 16, minHeight: 44 }} onPress={p.onEditar} />
        )}
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
  const [insignias, setInsignias] = useState<InsigniaPainel[]>([]);
  // formulário aberto: null = nenhum; 'novo' = criar; objeto = editar
  const [formDesafio, setFormDesafio] = useState<DesafioPeriodico | 'novo' | null>(null);
  const [formConquista, setFormConquista] = useState<InsigniaPainel | 'novo' | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await listarDesafios();
      setDiarios(r.diarios);
      setPeriodicos(r.periodicos);
      // falha aqui (migration ainda não rodou) não derruba a tela dos desafios
      setInsignias(await listarInsignias().catch(() => []));
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

  async function alternarInsignia(i: InsigniaPainel) {
    setOcupado(i.id);
    setErroItem(null);
    try {
      await definirInsigniaAtiva(i.id, !i.ativa);
      await carregar();
    } catch (e: any) {
      setErroItem({ ref: i.id, msg: e?.message ?? 'Não foi possível alterar.' });
    } finally {
      setOcupado(null);
    }
  }

  function salvou() {
    setFormDesafio(null);
    setFormConquista(null);
    carregar();
  }

  const ROTULO_CAT: Record<string, string> = { conquista: 'Conquista', marco: 'Marco', insignia: 'Insígnia' };

  return (
    <PainelLayout config={config} titulo="Desafios e conquistas" subtitulo="Missões e reconhecimentos que os adolescentes recebem">
      <IntroSecao
        chave="painel_desafios"
        titulo="Como funcionam os desafios"
        linhas={[
          'Desafios diários: cada dia o adolescente recebe missões (ex.: beber água, registrar refeição). Ao concluir, ganha pontos.',
          'Desafios semanais e mensais: metas maiores, que somam vários dias de hábito.',
          'Os desafios diários têm regras próprias no app, então aqui só dá para ativar ou desativar. Semanais, mensais, conquistas e marcos você cria e edita pelos botões.',
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

          <CartaoSecao
            titulo={`Desafios semanais e mensais (${periodicos.length})`}
            ajuda="Metas acumuladas. 'Resgatado' = quantas vezes um adolescente completou a meta e recebeu os pontos. Aqui você cria e edita sem mexer em código."
            direita={formDesafio ? undefined : <AppButton label="+ NOVO DESAFIO" fullWidth={false} size="compact" style={{ paddingHorizontal: 14, minHeight: 40 }} onPress={() => setFormDesafio('novo')} />}
          >
            {formDesafio && (
              <FormDesafioPeriodico inicial={formDesafio === 'novo' ? null : formDesafio} onSalvo={salvou} onCancelar={() => setFormDesafio(null)} />
            )}
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
                    onEditar={() => setFormDesafio(d)}
                  />
                ))}
              </GridResponsiva>
            )}
          </CartaoSecao>

          <CartaoSecao
            titulo={`Conquistas, marcos e insígnias (${insignias.length})`}
            ajuda="Reconhecimentos que o adolescente ganha sozinho ao atingir a meta. Conquistas e marcos podem ser criados aqui. Insígnias têm arte exclusiva e só entram pelo código do app; aqui dá para editar o texto e a meta delas."
            direita={formConquista ? undefined : <AppButton label="+ NOVA" fullWidth={false} size="compact" style={{ paddingHorizontal: 14, minHeight: 40 }} onPress={() => setFormConquista('novo')} />}
          >
            {formConquista && (
              <FormConquista inicial={formConquista === 'novo' ? null : formConquista} onSalvo={salvou} onCancelar={() => setFormConquista(null)} />
            )}
            {insignias.length === 0 && !formConquista ? (
              <VazioPainel titulo="Nada por aqui ainda" texto="Se você acabou de atualizar o app, rode a migration migration_painel_mvp_final.sql no Supabase." />
            ) : (
              <GridResponsiva minItem={300} gap={12} maxColunas={3}>
                {insignias.map((i) => (
                  <View key={i.id}>
                    <CartaoDesafio
                      titulo={i.nome}
                      descricao={i.descricao ?? ''}
                      selos={[ROTULO_CAT[i.categoria] ?? i.categoria]}
                      ativa={i.ativa}
                      uso={`Ganha com ${i.min ?? '?'} ${CRITERIO_LABEL[i.tipo ?? ''] ?? i.tipo ?? ''} · Conquistada ${i.ganhas}x`}
                      ocupado={ocupado === i.id}
                      erro={erroItem?.ref === i.id ? erroItem.msg : null}
                      onAlternar={() => alternarInsignia(i)}
                      onEditar={() => setFormConquista(i)}
                    />
                  </View>
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
