// src/features/conteudo/components/PaletaBlocos.tsx
// Paleta de blocos (estilo Scratch): um botão colorido por formato de passo, agrupado por tipo.
// Tocar adiciona o bloco logo depois do selecionado (ou no fim) e já o abre para editar.
import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '../../../shared/ui/AppText';
import { colors } from '../../../shared/theme/colors';
import { typography } from '../../../shared/theme/typography';
import { ROTULO_FORMATO } from '../utils/descreverQuestao';
import { COR_CATEGORIA, ORDEM_CATEGORIAS, ROTULO_CATEGORIA, formatosDaCategoria } from '../utils/blocos';
import type { FormatoPasso } from '../utils/passosEdicao';
import type { TemaPainel } from '../../../shared/painel/tema/paletas';
import { useEstilos } from '../../../shared/painel/tema/TemaPainelContext';

type Props = {
  total: number;
  max: number;
  /** posição (1-based) do bloco selecionado, só para dizer onde o novo bloco entra */
  aposDoBloco: number | null;
  onAdicionar: (f: FormatoPasso) => void;
};

export default function PaletaBlocos({ total, max, aposDoBloco, onAdicionar }: Props) {
  const styles = useEstilos(criarEstilos);
  const cheio = total >= max;
  return (
    <View style={styles.caixa}>
      <View style={styles.topo}>
        <AppText style={styles.titulo}>Blocos</AppText>
        <AppText style={styles.suave}>
          {cheio ? `Limite de ${max} blocos atingido.` : aposDoBloco ? `Entra depois do bloco ${aposDoBloco} · ${total} de ${max}` : `Entra no fim · ${total} de ${max}`}
        </AppText>
      </View>
      {ORDEM_CATEGORIAS.map((cat) => (
        <View key={cat} style={styles.grupo}>
          <AppText style={[styles.rotuloGrupo, { color: COR_CATEGORIA[cat].borda }]}>{ROTULO_CATEGORIA[cat]}</AppText>
          <View style={styles.linha}>
            {formatosDaCategoria(cat).map((f) => (
              <Pressable
                key={f}
                disabled={cheio}
                onPress={() => onAdicionar(f)}
                accessibilityRole="button"
                accessibilityLabel={`Adicionar bloco ${ROTULO_FORMATO[f] ?? f}`}
                style={({ pressed }) => [
                  styles.peca,
                  { backgroundColor: COR_CATEGORIA[cat].fundo, borderColor: COR_CATEGORIA[cat].borda },
                  pressed && { marginTop: 2, borderBottomWidth: 2 },
                  cheio && { opacity: 0.4 },
                ]}
              >
                <AppText style={styles.pecaTexto}>+ {ROTULO_FORMATO[f] ?? f}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  caixa: { backgroundColor: t.card, borderRadius: t.cardRaio, borderWidth: 2, borderColor: t.cardBorda, padding: 16, gap: 12 },
  topo: { gap: 2 },
  titulo: { fontFamily: typography.bold, fontSize: 15, color: t.texto },
  suave: { fontFamily: typography.regular, fontSize: 12, color: t.textoSuave },
  grupo: { gap: 6 },
  rotuloGrupo: { fontFamily: typography.bold, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  peca: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 2, borderBottomWidth: 5, justifyContent: 'center' },
  pecaTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
}) as const;