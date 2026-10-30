// src/shared/painel/components/FiltroPeriodoPersonalizado.tsx
// 7 / 30 / 90 dias ou período personalizado (DD/MM/AAAA). Sem larguras fixas.
import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from '../../ui/AppText';
import { typography } from '../../theme/typography';
import { mascaraDataBR, parseDataBR, validarIntervalo, type Intervalo } from '../periodo';
import type { TemaPainel } from '../tema/paletas';
import { useEstilos, useTemaPainel } from '../tema/TemaPainelContext';

export type EscolhaPeriodo = { tipo: 'dias'; dias: number } | { tipo: 'personalizado'; intervalo: Intervalo };

type Props = { valor: EscolhaPeriodo; onChange: (v: EscolhaPeriodo) => void };

export function FiltroPeriodoPersonalizado({ valor, onChange }: Props) {
  const { tema } = useTemaPainel();
  const styles = useEstilos(criarEstilos);
  const [aberto, setAberto] = useState(valor.tipo === 'personalizado');
  const [de, setDe] = useState('');
  const [ate, setAte] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  function aplicar() {
    const ini = parseDataBR(de);
    const fim = parseDataBR(ate);
    const msg = validarIntervalo(ini, fim);
    if (msg) return setErro(msg);
    setErro(null);
    onChange({ tipo: 'personalizado', intervalo: { inicio: ini!, fim: fim! } });
  }

  return (
    <View style={styles.coluna}>
      <View style={styles.linha}>
        {[7, 30, 90].map((d) => {
          const on = valor.tipo === 'dias' && valor.dias === d;
          return (
            <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: on }}
              onPress={() => { setErro(null); onChange({ tipo: 'dias', dias: d }); }}
              style={[styles.chip, on && styles.chipOn]}>
              <AppText style={[styles.texto, on && styles.textoOn]}>{d} dias</AppText>
            </Pressable>
          );
        })}
        <Pressable accessibilityRole="button" accessibilityState={{ selected: valor.tipo === 'personalizado' }}
          onPress={() => setAberto((a) => !a)}
          style={[styles.chip, valor.tipo === 'personalizado' && styles.chipOn]}>
          <AppText style={[styles.texto, valor.tipo === 'personalizado' && styles.textoOn]}>Personalizado</AppText>
        </Pressable>
      </View>
      {aberto && (
        <View style={styles.linha}>
          <TextInput value={de} onChangeText={(t) => setDe(mascaraDataBR(t))} placeholder="De DD/MM/AAAA"
            placeholderTextColor={tema.placeholder} keyboardType="number-pad" maxLength={10} style={styles.input} />
          <TextInput value={ate} onChangeText={(t) => setAte(mascaraDataBR(t))} placeholder="Até DD/MM/AAAA"
            placeholderTextColor={tema.placeholder} keyboardType="number-pad" maxLength={10} style={styles.input} />
          <Pressable accessibilityRole="button" onPress={aplicar} style={[styles.chip, styles.chipOn]}>
            <AppText style={[styles.texto, styles.textoOn]}>Aplicar</AppText>
          </Pressable>
        </View>
      )}
      {!!erro && <AppText style={styles.erro}>{erro}</AppText>}
    </View>
  );
}

const criarEstilos = (t: TemaPainel) => ({
  coluna: { gap: 8, alignItems: 'flex-start' },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: t.chipBorda, backgroundColor: t.card, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: t.botaoFundo, borderColor: t.texto },
  texto: { fontFamily: typography.medium, fontSize: 12, color: t.textoSuave },
  textoOn: { color: t.botaoTexto },
  input: { minHeight: 40, minWidth: 130, flexGrow: 1, maxWidth: 180, borderWidth: 1.5, borderColor: t.chipBorda, borderRadius: 12, paddingHorizontal: 12, backgroundColor: t.card, fontFamily: typography.regular, fontSize: 13, color: t.textoCorpo },
  erro: { fontFamily: typography.regular, fontSize: 12, color: t.erro },
}) as const;
