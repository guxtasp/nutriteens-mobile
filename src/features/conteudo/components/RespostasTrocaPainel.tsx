// src/features/conteudo/components/RespostasTrocaPainel.tsx
//
// Revisão de conteúdo das trocas: como os adolescentes responderam ao "Testei?" desta troca e da
// categoria dela. Só contagens agregadas (a RPC não devolve ids). A taxa só aparece com 5 ou mais
// pessoas, para não enganar nem expor alguém. Nunca vira ranking de adolescentes: é sobre a troca.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import { buscarResumoAvaliacoes } from '../../adolescente/trocas/services/trocasService';
import {
  MINIMO_PARA_TAXA,
  somarCategoria,
  taxasAvaliacao,
  type ResumoAvaliacaoTroca,
} from '../../adolescente/trocas/utils/avaliacaoTrocas';
import { ROTULO_CATEGORIA, type CategoriaTroca } from '../../adolescente/trocas/utils/trocas';

type Contagens = Omit<ResumoAvaliacaoTroca, 'trocaId' | 'categoria'>;

function Linha({ titulo, c }: { titulo: string; c: Contagens }) {
  const styles = useEstilos(criarEstilos);
  const taxas = taxasAvaliacao(c);
  const fmt = (v: number | null) => (v === null ? `— (menos de ${MINIMO_PARA_TAXA})` : `${v}%`);
  return (
    <View style={styles.bloco}>
      <AppText style={styles.titulo}>{titulo}</AppText>
      <AppText style={styles.texto}>
        Guardaram: {c.guardaram} · testaram: {taxas.testaram} · não tinham em casa: {c.naoTenho}
      </AppText>
      <AppText style={styles.texto}>
        Curti {c.curti} · mais ou menos {c.meio} · não rolou {c.naoRolou}
      </AppText>
      <AppText style={styles.taxa}>
        Taxa de "testei": {fmt(taxas.testei)} · taxa de "curti": {fmt(taxas.curti)}
      </AppText>
    </View>
  );
}

export function RespostasTrocaPainel({ trocaId, categoria }: { trocaId: string; categoria: CategoriaTroca }) {
  const styles = useEstilos(criarEstilos);
  const [linhas, setLinhas] = useState<ResumoAvaliacaoTroca[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    buscarResumoAvaliacoes(categoria)
      .then((l) => vivo && setLinhas(l))
      .catch((e) => {
        console.warn('Resumo do "Testei?" indisponível:', e);
        if (vivo) setErro(true);
      });
    return () => {
      vivo = false;
    };
  }, [categoria]);

  if (erro) {
    return (
      <AppText style={styles.dica}>
        As respostas do "Testei?" ainda não estão disponíveis (confira se a migration_trocas_avaliacao.sql já rodou).
      </AppText>
    );
  }
  if (!linhas) return <AppText style={styles.dica}>Carregando respostas…</AppText>;

  const desta = linhas.find((l) => l.trocaId === trocaId) ?? {
    guardaram: 0, curti: 0, meio: 0, naoRolou: 0, naoTenho: 0,
  };
  return (
    <View style={styles.grupo}>
      <AppText style={styles.dica}>
        "Testei" = curtiu, mais ou menos ou não rolou, sobre quem guardou. "Curti" = curtiu, sobre quem testou.
        Use para reescrever ou trocar o que não funciona.
      </AppText>
      <Linha titulo="Esta troca" c={desta} />
      <Linha titulo={`Categoria ${ROTULO_CATEGORIA[categoria]}`} c={somarCategoria(linhas, categoria)} />
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  grupo: { gap: 10 },
  bloco: { borderWidth: t.borda, borderColor: t.cardBorda, borderRadius: 14, padding: 12, gap: 2 },
  titulo: { fontFamily: typography.bold, fontSize: 13, color: t.texto, marginBottom: 4 },
  texto: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo, lineHeight: 19 },
  taxa: { fontFamily: typography.semiBold, fontSize: 13, color: t.texto, marginTop: 4 },
  dica: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave, lineHeight: 17 },
});
