// src/features/admin/components/UsoSemanalUsuario.tsx
// Admin/Usuários: o app está funcionando para esta pessoa? Uso semanal e uma tendência de hábito
// (% de ultraprocessados, só com 5+ itens na semana). Nenhum alimento ou dado de saúde aparece.
import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import { Colunas } from '../../../shared/painel/components/Colunas';
import { EstadoCarregando, EstadoErro } from '../../../shared/painel/components/EstadosPainel';
import { GraficoLinha } from '../../../shared/painel/components/GraficoLinha';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import { paraGrafico, tendencia, textoTendencia } from '../../nutricionista/utils/evolucao';
import { buscarUsoUsuario, type SemanaUsoUsuario } from '../services/usuariosAdminService';

function Tendencia({ valores, melhora }: { valores: (number | null)[]; melhora: 'sobe' | 'desce' }) {
  const styles = useEstilos(criarEstilos);
  const t = textoTendencia(tendencia(valores), melhora);
  const cor = t.tom === 'bom' ? styles.bom : t.tom === 'atencao' ? styles.atencao : styles.neutro;
  return <AppText style={[styles.tendencia, cor]}>{t.texto} (últimas 4 semanas x 4 anteriores)</AppText>;
}

export function UsoSemanalUsuario({ id }: { id: string }) {
  const styles = useEstilos(criarEstilos);
  const [semanas, setSemanas] = useState<SemanaUsoUsuario[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(() => {
    setErro(null);
    buscarUsoUsuario(id).then(setSemanas).catch((e) => setErro(e?.message ?? 'Não foi possível carregar o uso.'));
  }, [id]);
  useEffect(() => { carregar(); }, [carregar]);

  if (erro) return <EstadoErro mensagem={erro} onTentar={carregar} />;
  if (!semanas) return <EstadoCarregando />;

  const dias = semanas.map((s) => s.inicio);
  const registro = semanas.map((s) => s.diasComRegistro);
  const noApp = semanas.map((s) => s.diasNoApp);
  const ultra = semanas.map((s) => s.pctUltra);
  const vazio = semanas.every((s) => s.diasNoApp === 0 && s.diasComRegistro === 0);

  return (
    <View style={{ gap: 16 }}>
      {vazio && <AppText style={styles.aviso}>Sem uso do app nas últimas {semanas.length} semanas.</AppText>}
      <Colunas bases={[340, 340]}>
        <CartaoSecao
          titulo="Uso por semana"
          subtitulo="Dias de 0 a 7"
          ajuda={{
            oque: 'Em quantos dias da semana a pessoa abriu o app e em quantos registrou algo.',
            como: 'De 0 a 7; cada ponto é uma semana (data = segunda-feira). Subir indica mais constância.',
            origem: 'Eventos do app (acesso) e registros de água, atividade e refeições. Mostra quanto usa, não o que registrou.',
          }}
        >
          <GraficoLinha dias={dias} series={[{ nome: 'Dias no app', valores: noApp }, { nome: 'Dias com registro', valores: registro }]} />
          <Tendencia valores={registro} melhora="sobe" />
        </CartaoSecao>
        <CartaoSecao
          titulo="Hábito: ultraprocessados"
          subtitulo="% dos itens registrados"
          ajuda={{
            oque: 'Parte dos itens registrados na semana que são ultraprocessados. Só aparece com 5 ou mais itens na semana.',
            como: 'Descer ao longo das semanas indica melhora do hábito. Semana sem dado suficiente aparece como 0 no gráfico.',
            origem: 'Refeições registradas e classificação NOVA do catálogo. Nenhum alimento é mostrado ao Admin; o detalhe é da nutricionista.',
          }}
        >
          <GraficoLinha dias={dias} series={[{ nome: '% ultraprocessados', valores: paraGrafico(ultra) }]} />
          <Tendencia valores={ultra} melhora="desce" />
        </CartaoSecao>
      </Colunas>
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  aviso: { fontFamily: typography.semiBold, fontSize: 13, color: t.textoSuave },
  tendencia: { fontFamily: typography.semiBold, fontSize: 12, marginTop: 6 },
  bom: { color: t.selos.ok.texto },
  atencao: { color: t.selos.aviso.texto },
  neutro: { color: t.textoSuave },
}) as const;
