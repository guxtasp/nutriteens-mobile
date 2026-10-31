// src/features/adolescente/social/components/TrofeusTemporada.tsx
//
// Coleção de troféus da pessoa (um por desafio em grupo que ela terminou com 1+ dia cumprido). Só os dela.
// Sem ranking e sem comparação: é uma estante pessoal. Vazia, convida a terminar o primeiro desafio.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../../shared/ui/AppText';
import { colors } from '../../../../shared/theme/colors';
import { typography } from '../../../../shared/theme/typography';
import { ATIVIDADE } from '../theme/turma';
import TrofeuCard from './TrofeuCard';
import type { Trofeu } from '../utils/trofeu';

const MAX_VISIVEIS = 6;

export default function TrofeusTemporada({ trofeus }: { trofeus: Trofeu[] }) {
  const visiveis = trofeus.slice(0, MAX_VISIVEIS);
  const resto = trofeus.length - visiveis.length;
  return (
    <View style={estilos.secao}>
      <View style={estilos.topo}>
        <Ionicons name="trophy" size={18} color={ATIVIDADE.desafio.cor} />
        <AppText style={estilos.titulo}>Seus troféus</AppText>
        {trofeus.length > 0 && <View style={estilos.contador}><AppText style={estilos.contadorTexto}>{trofeus.length}</AppText></View>}
      </View>

      {trofeus.length === 0 ? (
        <View style={estilos.vazio}>
          <AppText style={estilos.vazioTexto}>Termine um desafio em grupo cumprindo pelo menos um dia e ganhe seu primeiro troféu de hábito.</AppText>
        </View>
      ) : (
        <>
          {visiveis.map((t) => <TrofeuCard key={t.desafioId} trofeu={t} compacto />)}
          {resto > 0 && <AppText style={estilos.mais}>e mais {resto} {resto === 1 ? 'troféu' : 'troféus'} guardados</AppText>}
        </>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  secao: { gap: 10, marginTop: 6 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { flex: 1, fontFamily: typography.bold, fontSize: 17, color: colors.primaryDark },
  contador: { minWidth: 24, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: ATIVIDADE.desafio.cor, alignItems: 'center', justifyContent: 'center' },
  contadorTexto: { fontFamily: typography.bold, fontSize: 13, color: colors.white },
  vazio: { padding: 14, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D9CCF7', backgroundColor: '#FBF9FF' },
  vazioTexto: { fontFamily: typography.regular, fontSize: 13.5, lineHeight: 19, color: '#6B7B74' },
  mais: { fontFamily: typography.bold, fontSize: 12.5, color: '#6B7B74', textAlign: 'center' },
});
