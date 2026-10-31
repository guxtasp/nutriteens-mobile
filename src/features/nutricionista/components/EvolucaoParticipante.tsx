// Aba "Evolução" do participante: hábitos semana a semana e comparação das reavaliações (EBIA e recordatório).
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { GraficoLinha } from '../../../shared/painel/components/GraficoLinha';
import { dataCurta } from '../../../shared/painel/formatadores';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import { buscarEvolucao, type EvolucaoParticipante } from '../services/evolucaoService';
import { EBIA_LABEL } from '../services/participantesService';
import { paraGrafico, pctUltra, tendencia, textoTendencia, variacao } from '../utils/evolucao';

function Tendencia({ valores, melhora }: { valores: (number | null)[]; melhora: 'sobe' | 'desce' }) {
  const styles = useEstilos(criarEstilos);
  const t = textoTendencia(tendencia(valores), melhora);
  const cor = t.tom === 'bom' ? styles.bom : t.tom === 'atencao' ? styles.atencao : styles.neutro;
  return <AppText style={[styles.tendencia, cor]}>{t.texto} (últimas 4 semanas x 4 anteriores)</AppText>;
}

export function EvolucaoParticipante({ id }: { id: string }) {
  const styles = useEstilos(criarEstilos);
  const [d, setD] = useState<EvolucaoParticipante | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setErro(null);
    buscarEvolucao(id).then(setD).catch((e) => setErro(e?.message ?? 'Não foi possível carregar a evolução.'));
  }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  if (erro) return <EstadoErro mensagem={erro} onTentar={carregar} />;
  if (!d) return <EstadoCarregando />;

  const semanas = d.semanas;
  const dias = semanas.map((s) => s.inicio);
  const vazio = semanas.every((s) => s.diasComRegistro === 0);
  const registro = semanas.map((s) => s.diasComRegistro);
  const agua = semanas.map((s) => (s.aguaMediaMl > 0 ? s.aguaMediaMl : null));
  const ativ = semanas.map((s) => s.atividadeMin);
  const ultra = semanas.map(pctUltra);

  return (
    <View style={{ gap: 16 }}>
      {vazio && <AppText style={styles.aviso}>Este participante ainda não tem registros nas últimas {semanas.length} semanas.</AppText>}

      <Colunas bases={[340, 340]}>
        <CartaoSecao titulo="Dias com registro por semana" subtitulo="De 0 a 7 dias" ajuda={{ oque: "Em quantos dias da semana o adolescente registrou água, atividade ou refeição.", como: "De 0 a 7; cada ponto é uma semana (a data é a segunda-feira). Subir indica mais constância.", origem: "Registros de água, atividade física e refeições do participante." }}>
          <GraficoLinha dias={dias} series={[{ nome: 'Dias com registro', valores: registro }]} />
          <Tendencia valores={registro} melhora="sobe" />
        </CartaoSecao>
        <CartaoSecao titulo="Ultraprocessados" subtitulo="% dos alimentos registrados" ajuda={{ oque: "Parte dos alimentos registrados na semana que são ultraprocessados.", como: "Descer ao longo das semanas é melhor. Semana sem refeição registrada aparece como 0.", origem: "Refeições do participante e classificação NOVA do catálogo de alimentos." }}>
          <GraficoLinha dias={dias} series={[{ nome: '% ultraprocessados', valores: paraGrafico(ultra) }]} />
          <Tendencia valores={ultra} melhora="desce" />
        </CartaoSecao>
      </Colunas>

      <Colunas bases={[340, 340]}>
        <CartaoSecao titulo="Água" subtitulo="Média (ml) nos dias com registro" ajuda={{ oque: "Média de água registrada por dia, só nos dias com registro de água.", como: "Compare com a meta de água do participante. Semana sem registro aparece como 0.", origem: "Registros de água do participante." }}>
          <GraficoLinha dias={dias} series={[{ nome: 'Água (ml/dia)', valores: paraGrafico(agua) }]} />
          <Tendencia valores={agua} melhora="sobe" />
        </CartaoSecao>
        <CartaoSecao titulo="Atividade física" subtitulo="Minutos por semana" ajuda={{ oque: "Soma dos minutos de atividade física de cada semana.", como: "Subir indica mais atividade; compare com a recomendação para a idade.", origem: "Registros de atividade física do participante." }}>
          <GraficoLinha dias={dias} series={[{ nome: 'Minutos', valores: ativ }]} />
          <Tendencia valores={ativ} melhora="sobe" />
        </CartaoSecao>
      </Colunas>

      <Colunas bases={[340, 340]}>
        <CartaoSecao titulo="Reavaliações de EBIA" subtitulo="Da mais antiga para a mais recente" ajuda={{ oque: "Pontuação e classificação de cada vez que o adolescente refez a EBIA.", como: "Pontuação menor indica menos insegurança alimentar. Leia da mais antiga para a mais recente.", origem: "Reavaliações de EBIA do participante." }}>
          {d.ebia.length === 0 ? <AppText style={styles.texto}>Nenhuma EBIA concluída.</AppText> : d.ebia.map((e, i) => {
            const v = variacao(e.pontuacao, d.ebia[i - 1]?.pontuacao);
            return (
              <View key={`${e.data}-${i}`} style={styles.linha}>
                <AppText style={styles.data}>{dataCurta(e.data)}</AppText>
                <AppText style={styles.valor}>{EBIA_LABEL[e.classificacao ?? ''] ?? '—'}{e.pontuacao !== null ? ` · ${e.pontuacao} pts` : ''}</AppText>
                {v !== null && <AppText style={[styles.delta, v < 0 ? styles.bom : v > 0 ? styles.atencao : styles.neutro]}>{v > 0 ? `+${v}` : v}</AppText>}
              </View>
            );
          })}
        </CartaoSecao>
        <CartaoSecao titulo="Recordatórios alimentares" subtitulo="Escores de cada avaliação" ajuda={{ oque: "Escore saudável e não saudável de cada recordatório alimentar concluído.", como: "A variação mostra a diferença para o recordatório anterior: escore saudável maior e não saudável menor indicam melhora.", origem: "Recordatórios de 24 horas do participante." }}>
          {d.recordatorios.length === 0 ? <AppText style={styles.texto}>Nenhum recordatório concluído.</AppText> : d.recordatorios.map((r, i) => {
            const vs = variacao(r.saudavel, d.recordatorios[i - 1]?.saudavel);
            const vn = variacao(r.naoSaudavel, d.recordatorios[i - 1]?.naoSaudavel);
            return (
              <View key={`${r.data}-${i}`} style={styles.linha}>
                <AppText style={styles.data}>{dataCurta(r.data)}</AppText>
                <AppText style={styles.valor}>
                  Saudável {r.saudavel ?? '—'}{vs !== null ? ` (${vs > 0 ? '+' : ''}${vs})` : ''} · Não saudável {r.naoSaudavel ?? '—'}{vn !== null ? ` (${vn > 0 ? '+' : ''}${vn})` : ''}
                </AppText>
              </View>
            );
          })}
        </CartaoSecao>
      </Colunas>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  texto: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave } as const,
  aviso: { fontFamily: typography.regular, fontSize: 13, color: t.textoSuave, backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 14 } as const,
  tendencia: { fontFamily: typography.medium, fontSize: 12, marginTop: 8 } as const,
  bom: { color: t.selos.ok.texto } as const,
  atencao: { color: t.alerta } as const,
  neutro: { color: t.textoSuave } as const,
  linha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: t.linhaSuave, flexWrap: 'wrap' } as const,
  data: { fontFamily: typography.bold, fontSize: 12, color: t.textoSuave, minWidth: 72 } as const,
  valor: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo, flexShrink: 1 } as const,
  delta: { fontFamily: typography.bold, fontSize: 12 } as const,
});
