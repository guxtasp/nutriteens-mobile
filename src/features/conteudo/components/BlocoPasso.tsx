// src/features/conteudo/components/BlocoPasso.tsx
// Um passo da lição como um BLOCO colorido (estilo Scratch): cor por tipo, "encaixe" no topo,
// cabeçalho com os botões de mover/duplicar/remover. Fechado mostra só o resumo de uma linha;
// aberto (selecionado) mostra o formulário do passo. Tocar em qualquer parte do bloco o
// seleciona — e a prévia ao vivo passa a começar nele.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { ROTULO_FORMATO } from '../utils/descreverQuestao';
import { CATEGORIA_DO_FORMATO, COR_CATEGORIA, resumoDoBloco } from '../utils/blocos';
import type { PassoEdicao } from '../utils/passosEdicao';

type Props = {
  passo: PassoEdicao;
  indice: number;
  total: number;
  selecionado: boolean;
  incompleto: boolean;
  erros: string[];
  onSelecionar: () => void;
  onMover: (dir: -1 | 1) => void;
  onDuplicar: () => void;
  onRemover: () => void;
  children?: React.ReactNode; // formulário do passo (PassoEditor embutido)
};

function Botao({ rotulo, acessivel, onPress, desativado }: { rotulo: string; acessivel: string; onPress: () => void; desativado?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      hitSlop={6}
      style={[styles.botao, desativado && { opacity: 0.35 }]}
    >
      <AppText style={styles.botaoTexto}>{rotulo}</AppText>
    </Pressable>
  );
}

export default function BlocoPasso({ passo, indice, total, selecionado, incompleto, erros, onSelecionar, onMover, onDuplicar, onRemover, children }: Props) {
  const cor = COR_CATEGORIA[CATEGORIA_DO_FORMATO[passo.formato]];

  return (
    // captura o toque só para selecionar; não rouba o foco dos campos de texto
    <View
      onStartShouldSetResponderCapture={() => {
        if (!selecionado) onSelecionar();
        return false;
      }}
      style={[styles.bloco, { borderColor: cor.borda, backgroundColor: cor.suave }, selecionado && styles.selecionado]}
    >
      <View style={[styles.encaixe, { backgroundColor: cor.fundo, borderColor: cor.borda }]} />

      <View style={[styles.cabeca, { backgroundColor: cor.fundo, borderBottomColor: cor.borda }]}>
        <Pressable onPress={onSelecionar} style={styles.titulos} accessibilityRole="button" accessibilityState={{ expanded: selecionado }} accessibilityLabel={`Bloco ${indice + 1}, ${ROTULO_FORMATO[passo.formato] ?? passo.formato}`}>
          <AppText numberOfLines={1} style={styles.titulo}>
            {indice + 1} · {ROTULO_FORMATO[passo.formato] ?? passo.formato}
          </AppText>
          {incompleto && <AppText style={styles.incompleto}>incompleto</AppText>}
        </Pressable>
        <View style={styles.botoes}>
          <Botao rotulo="↑" acessivel="Subir bloco" desativado={indice === 0} onPress={() => onMover(-1)} />
          <Botao rotulo="↓" acessivel="Descer bloco" desativado={indice === total - 1} onPress={() => onMover(1)} />
          <Botao rotulo="⧉" acessivel="Duplicar bloco" onPress={onDuplicar} />
          <Botao rotulo="✕" acessivel="Remover bloco" onPress={onRemover} />
        </View>
      </View>

      {selecionado ? (
        <View style={styles.corpo}>{children}</View>
      ) : (
        <Pressable onPress={onSelecionar} style={styles.resumoLinha} accessibilityRole="button" accessibilityLabel="Abrir bloco para editar">
          <AppText numberOfLines={2} style={styles.resumo}>
            {resumoDoBloco(passo)}
          </AppText>
          {erros.length > 0 && <AppText style={styles.erro}>⚠ {erros[0]}</AppText>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { borderWidth: 2, borderRadius: 14, marginTop: 6, minWidth: 0 },
  selecionado: { borderWidth: 3 },
  // o "dente" no topo que dá o jeito de peça encaixável
  encaixe: { position: 'absolute', top: -9, left: 22, width: 34, height: 9, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 2, borderBottomWidth: 0 },
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderTopLeftRadius: 11, borderTopRightRadius: 11, borderBottomWidth: 2, minHeight: 48 },
  titulos: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 },
  titulo: { fontFamily: typography.bold, fontSize: 14, color: colors.white, flexShrink: 1 },
  incompleto: { fontFamily: typography.bold, fontSize: 10, color: '#7A5B00', backgroundColor: '#FFF4CC', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  botoes: { flexDirection: 'row', gap: 6 },
  botao: { minWidth: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)' },
  botaoTexto: { fontFamily: typography.bold, fontSize: 15, color: colors.white },
  corpo: { padding: 14, gap: 12 },
  resumoLinha: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  resumo: { fontFamily: typography.regular, fontSize: 14, color: colors.textOnLight, lineHeight: 20 },
  erro: { fontFamily: typography.regular, fontSize: 12, color: colors.error },
});