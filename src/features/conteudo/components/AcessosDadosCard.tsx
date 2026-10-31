// src/features/conteudo/components/AcessosDadosCard.tsx
// Auditoria (Admin): quem abriu os dados de participantes. Registro imutável gerado pelo banco.
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { typography } from '../../../shared/theme/typography';
import { CartaoSecao } from '../../../shared/painel/components/CartaoSecao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';
import { listarAcessosDados, type AcessoDados } from '../../admin/services/acessosDadosService';
import { formatarDataHora } from '../utils/fluxo';

export function AcessosDadosCard() {
  const styles = useEstilos(criarEstilos);
  const [dados, setDados] = useState<{ total30d: number; registros: AcessoDados[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarAcessosDados(50).then(setDados).catch((e) => setErro(e?.message ?? 'Não foi possível carregar os acessos.'));
  }, []);

  return (
    <CartaoSecao
      titulo="Acessos a dados de participantes"
      subtitulo={dados ? `${dados.total30d} abertura(s) nos últimos 30 dias` : undefined}
      ajuda={{
        oque: 'Lista de quem abriu o detalhe de um participante (nome completo, medidas, EBIA e recordatório).',
        como: 'Cada linha é uma abertura; abrir de novo em menos de 10 minutos não gera outra linha. Use para conferir se o acesso faz sentido.',
        origem: 'Registrado pelo banco ao abrir o detalhe na área da nutricionista. Não pode ser editado nem apagado.',
      }}
    >
      {erro && <AppText style={styles.erro}>{erro}</AppText>}
      {!erro && !dados && <AppText style={styles.meta}>Carregando…</AppText>}
      {dados && dados.registros.length === 0 && <AppText style={styles.meta}>Nenhuma abertura registrada ainda.</AppText>}
      {dados?.registros.map((r) => (
        <View key={r.id} style={styles.linha}>
          <AppText style={styles.titulo}>{r.leitor} abriu o participante {r.participante}</AppText>
          <AppText style={styles.meta}>{formatarDataHora(r.criadoEm)}</AppText>
        </View>
      ))}
    </CartaoSecao>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  linha: { borderTopWidth: 1, borderTopColor: t.linhaSuave, paddingTop: 8, gap: 2 },
  titulo: { fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo },
  meta: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
}) as const;
