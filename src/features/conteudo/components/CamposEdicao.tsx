// src/features/conteudo/components/CamposEdicao.tsx
// Peças comuns das telas de edição de conteúdo.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { AppButton } from '../../../shared/ui/AppButton';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { painel } from '../../../shared/painel/painelTheme';
import type { Papel } from '../utils/regrasAprovacao';

/** O que acontece com o status ao editar (espelha fluxo_alteracao_relevante no banco). */
export function textoAvisoEdicao(papel: Papel | null): string {
  return papel === 'NUTRICIONISTA'
    ? 'Como nutricionista responsável, suas edições mantêm o status do conteúdo. A versão sobe e fica registrada na auditoria.'
    : 'Atenção: se este conteúdo já foi enviado, aprovado ou publicado, editar o devolve para rascunho e ele precisa de nova aprovação da nutricionista.';
}

export function AvisoEdicao({ papel }: { papel: Papel | null }) {
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
  return (
    <View style={{ gap: 8 }}>
      {!!p.erro && <AppText style={styles.erro}>{p.erro}</AppText>}
      {!!p.mensagem && <AppText style={styles.ok}>{p.mensagem}</AppText>}
      <View style={styles.linha}>
        <AppButton
          label={p.ocupado ? 'SALVANDO…' : p.rotulo}
          fullWidth={false}
          size="compact"
          backgroundColor={colors.primaryDark}
          textColor={colors.white}
          shadowColor="#123024"
          disabled={p.ocupado}
          style={styles.botao}
          onPress={p.onSalvar}
        />
        <AppButton
          label="CANCELAR"
          fullWidth={false}
          size="compact"
          outlineColor={colors.primaryDark}
          textColor={colors.primaryDark}
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

const styles = StyleSheet.create({
  aviso: { backgroundColor: colors.warningSoft, borderRadius: 12, padding: 12 },
  avisoTexto: { fontFamily: typography.regular, fontSize: 12, color: colors.warningShadow, lineHeight: 17 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  botao: { paddingHorizontal: 18, minHeight: 44 },
  erro: { fontFamily: typography.regular, fontSize: 13, color: colors.error },
  ok: { fontFamily: typography.semiBold, fontSize: 13, color: '#2F6B12', backgroundColor: '#E2F3D3', borderRadius: 10, padding: 10 },
});
export const campoMultilinha = { minHeight: 110, textAlignVertical: 'top' as const };
export const estiloLinhaCampos = { borderColor: painel.cardBorda };
