// src/features/conteudo/components/CamposEdicao.tsx
// Peças comuns das telas de edição de conteúdo.
import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { Papel } from '../utils/regrasAprovacao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos, useTemaPainel } from '../../../shared/painel/tema/TemaPainelContext';

/** O que acontece com o status ao editar (espelha fluxo_alteracao_relevante no banco). */
export function textoAvisoEdicao(papel: Papel | null): string {
  return papel === 'NUTRICIONISTA'
    ? 'Como nutricionista responsável, suas edições mantêm o status do conteúdo. A versão sobe e fica registrada na auditoria.'
    : 'Atenção: se este conteúdo já foi enviado, aprovado ou publicado, editar o devolve para rascunho e ele precisa de nova aprovação da nutricionista.';
}

export function AvisoEdicao({ papel }: { papel: Papel | null }) {
  const styles = useEstilos(criarEstilos);
  return (
    <View style={styles.aviso}>
      <AppText style={styles.avisoTexto}>{textoAvisoEdicao(papel)}</AppText>
    </View>
  );
}

export function BarraSalvar(p: {
  rotulo: string;
  ocupado: boolean;
  onSalvar: () => void;
  onCancelar: () => void;
  mensagem?: string | null;
  erro?: string | null;
}) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  return (
    <View style={{ gap: 8 }}>
      {!!p.erro && <AppText style={styles.erro}>{p.erro}</AppText>}
      {!!p.mensagem && <AppText style={styles.ok}>{p.mensagem}</AppText>}
      <View style={styles.linha}>
        <AppButton
          label={p.ocupado ? 'SALVANDO…' : p.rotulo}
          fullWidth={false}
          size="compact"
          backgroundColor={tema.botaoFundo}
          textColor={tema.botaoTexto}
          shadowColor={tema.botaoSombra}
          disabled={p.ocupado}
          style={styles.botao}
          onPress={p.onSalvar}
        />
        <AppButton
          label="CANCELAR"
          fullWidth={false}
          size="compact"
          outlineColor={tema.texto}
          textColor={tema.texto}
          disabled={p.ocupado}
          style={styles.botao}
          onPress={p.onCancelar}
        />
      </View>
    </View>
  );
}

export function numeroOuNulo(t: string): number | null {
  const n = parseInt(t.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

const criarEstilos = (t: TemaPainel) => ({
  aviso: { backgroundColor: t.alertaSuave, borderRadius: 12, padding: 12 },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: t.selos.aviso.texto, lineHeight: 17 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botao: { paddingHorizontal: 18, minHeight: 44 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: t.erro },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: t.selos.ok.texto, backgroundColor: t.destaqueSuave, borderRadius: 10, padding: 10 },
}) as const;
export const campoMultilinha = { minHeight: 110, textAlignVertical: 'top' as const };
export const estiloLinhaCampos = { borderColor: painel.cardBorda };
