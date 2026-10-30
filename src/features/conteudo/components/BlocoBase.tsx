// src/features/conteudo/components/BlocoBase.tsx
// Bloco colorido genérico (estilo Scratch), usado nos ingredientes e nos passos da receita:
// "encaixe" no topo, cabeçalho colorido com botões e corpo. Com `recolhivel`, só o bloco
// selecionado mostra o corpo; os outros mostram o resumo de uma linha. Tocar o seleciona.
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';

export type BotaoDoBloco = { rotulo: string; acessivel: string; onPress: () => void; desativado?: boolean };

type Props = {
  cor: { fundo: string; borda: string; suave: string };
  titulo: string;
  resumo?: string;
  recolhivel?: boolean;
  selecionado?: boolean;
  incompleto?: boolean;
  erros?: string[];
  botoes: BotaoDoBloco[];
  onSelecionar?: () => void;
  children?: React.ReactNode;
};

export default function BlocoBase({ cor, titulo, resumo, recolhivel = false, selecionado = true, incompleto, erros = [], botoes, onSelecionar, children }: Props) {
  const styles = useEstilos(criarEstilos);
  const aberto = !recolhivel || selecionado;
  return (
    <View
      // captura o toque só para selecionar; não rouba o foco dos campos de texto
      onStartShouldSetResponderCapture={() => {
        if (onSelecionar && !selecionado) onSelecionar();
        return false;
      }}
      style={[styles.bloco, { borderColor: cor.borda, backgroundColor: cor.suave }, recolhivel && selecionado && styles.selecionado]}
    >
      <View style={[styles.encaixe, { backgroundColor: cor.fundo, borderColor: cor.borda }]} />
      <View style={[styles.cabeca, { backgroundColor: cor.fundo, borderBottomColor: cor.borda }]}>
        <Pressable onPress={onSelecionar} style={styles.titulos} accessibilityRole="button" accessibilityState={{ expanded: aberto }} accessibilityLabel={titulo}>
          <AppText numberOfLines={1} style={styles.titulo}>{titulo}</AppText>
          {incompleto && <AppText style={styles.incompleto}>incompleto</AppText>}
        </Pressable>
        <View style={styles.botoes}>
          {botoes.map((b) => (
            <Pressable key={b.rotulo} onPress={b.onPress} disabled={b.desativado} accessibilityRole="button" accessibilityLabel={b.acessivel} hitSlop={6} style={[styles.botao, b.desativado && { opacity: 0.35 }]}>
              <AppText style={styles.botaoTexto}>{b.rotulo}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {aberto ? (
        !!children && <View style={styles.corpo}>{children}</View>
      ) : (
        <Pressable onPress={onSelecionar} style={styles.resumoLinha} accessibilityRole="button" accessibilityLabel="Abrir bloco para editar">
          <AppText numberOfLines={2} style={styles.resumo}>{resumo}</AppText>
          {erros.length > 0 && <AppText style={styles.erro}>⚠ {erros[0]}</AppText>}
        </Pressable>
      )}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  bloco: { borderWidth: 2, borderRadius: 14, marginTop: 6, minWidth: 0 },
  selecionado: { borderWidth: 3 },
  encaixe: { position: 'absolute', top: -9, left: 22, width: 34, height: 9, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 2, borderBottomWidth: 0 },
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderBottomWidth: 2, minHeight: 48 },
  titulos: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  titulo: { fontFamily: typography.bold, fontSize: 14, color: colors.white, flexShrink: 1 },
  incompleto: { fontFamily: typography.bold, fontSize: 10, color: t.selos.aviso.texto, backgroundColor: t.alertaSuave, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  botoes: { flexDirection: 'row', gap: 6 },
  botao: { minWidth: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.white },
  corpo: { padding: 14, gap: 12 },
  resumoLinha: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  resumo: { fontFamily: typography.regular, fontSize: 14, color: t.textoCorpo, lineHeight: 20 },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
}) as const;
