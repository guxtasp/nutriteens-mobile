// src/features/adolescente/social/components/AbasSegmentadas.tsx
//
// Abas em pílula (2 ou 3 opções) para dividir uma tela cheia em partes: "Desafios | Troféus", "Jardim | Grupo".
// Altura mínima 44 para o toque; a aba marcada usa a cor da atividade.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { feedbackToque } from '../../../../shared/audio/feedback';

export type AbaSegmentada<T extends string> = { chave: T; rotulo: string; contador?: number };

type Props<T extends string> = {
  abas: AbaSegmentada<T>[];
  atual: T;
  aoMudar: (chave: T) => void;
  cor: string;
};

export default function AbasSegmentadas<T extends string>({ abas, atual, aoMudar, cor }: Props<T>) {
  return (
    <View style={estilos.trilho} accessibilityRole="tablist">
      {abas.map((a) => {
        const marcada = a.chave === atual;
        return (
          <Pressable
            key={a.chave}
            onPress={() => { if (!marcada) { feedbackToque(); aoMudar(a.chave); } }}
            accessibilityRole="tab"
            accessibilityState={{ selected: marcada }}
            accessibilityLabel={a.contador ? `${a.rotulo}, ${a.contador}` : a.rotulo}
            style={[estilos.aba, marcada && { backgroundColor: cor }]}
          >
            <AppText style={[estilos.texto, { color: marcada ? colors.white : '#5A6B64' }]}>{a.rotulo}</AppText>
            {!!a.contador && (
              <View style={[estilos.contador, { backgroundColor: marcada ? 'rgba(255,255,255,0.28)' : '#E4E9E6' }]}>
                <AppText style={[estilos.contadorTexto, { color: marcada ? colors.white : '#5A6B64' }]}>{a.contador}</AppText>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const estilos = StyleSheet.create({
  trilho: { flexDirection: 'row', backgroundColor: '#ECF0ED', borderRadius: 18, padding: 4, gap: 4 },
  aba: { flex: 1, minHeight: 44, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  texto: { fontFamily: typography.bold, fontSize: 14 },
  contador: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: typography.bold, fontSize: 11 },
});
