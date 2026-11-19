// src/shared/painel/components/SeletorIconeMissao.tsx
// Grade de ícones para missões e desafios: a pessoa escolhe olhando, sem digitar nome nem emoji.
// Os ícones vêm agrupados por tema (Alimentação, Água e corpo, Rotina, Conquista e diversão)
// e o nome em português do escolhido aparece embaixo.
import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { GRUPOS_ICONES_MISSAO, resolverIconeMissao, rotuloIconeMissao } from '../../ui/iconesMissao';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';
import { ALVO_TOQUE, fonte } from '../painelTheme';
import { RotuloCampo } from './Formulario';

export function SeletorIconeMissao({ valor, onChange }: { valor: string | null | undefined; onChange: (nome: string) => void }) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const atual = resolverIconeMissao(valor);
  return (
    <View style={{ gap: 10 }}>
      <RotuloCampo texto="Ícone" ajuda={`Escolhido: ${rotuloIconeMissao(atual)}`} />
      {GRUPOS_ICONES_MISSAO.map((g) => (
        <View key={g.titulo} style={{ gap: 6 }}>
          <AppText style={styles.grupo}>{g.titulo}</AppText>
          <View style={styles.grade} accessibilityRole="radiogroup" accessibilityLabel={`Ícones: ${g.titulo}`}>
            {g.icones.map((i) => {
              const on = i.nome === atual;
              return (
                <Pressable
                  key={i.nome}
                  onPress={() => onChange(i.nome)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, selected: on }}
                  accessibilityLabel={i.rotulo}
                  style={({ hovered }: { pressed: boolean; hovered?: boolean }) => [styles.icone, hovered && !on && styles.iconeHover, on && styles.iconeOn]}
                >
                  <Ionicons name={i.nome as any} size={22} color={on ? tema.chipAtivoTexto : tema.texto} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  grupo: { fontFamily: typography.semiBold, fontSize: fonte.selo, color: t.textoSuave, textTransform: 'uppercase', letterSpacing: 0.5 } as const,
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 } as const,
  icone: { width: ALVO_TOQUE + 4, height: ALVO_TOQUE + 4, borderRadius: 12, borderWidth: t.borda, borderColor: t.chipBorda, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' } as const,
  iconeHover: { backgroundColor: t.superficieSuave } as const,
  iconeOn: { backgroundColor: t.chipAtivoFundo, borderColor: t.chipAtivoFundo } as const,
});
