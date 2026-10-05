import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { CREDITOS } from '../config/creditos';

/** Logos dos departamentos + equipe. Reutilizável em qualquer tela (perfil, login, sobre). */
export function CreditosApp() {
  return (
    <View style={styles.card}>
      <View style={styles.logos}>
        {CREDITOS.departamentos.map((d) => (
          <View key={d.nome} style={styles.dep}>
            <Image source={d.logo} style={styles.logo} resizeMode="contain" accessibilityLabel={`Logo: ${d.nome}`} />
            <AppText style={styles.depNome}>{d.nome}</AppText>
          </View>
        ))}
      </View>
      <AppText style={styles.instituicao}>{CREDITOS.departamentos[0]?.instituicao}</AppText>
      <View style={styles.divisor} />
      <AppText style={styles.titulo}>Equipe do projeto {CREDITOS.projeto}</AppText>
      {CREDITOS.equipe.map((p) => (
        <AppText key={p.nome} style={styles.pessoa}>
          {p.nome} <AppText style={styles.papel}>— {p.papel}</AppText>
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, alignItems: 'center', marginBottom: 20 },
  logos: { flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-around', gap: 12 },
  dep: { flex: 1, alignItems: 'center' },
  logo: { width: '100%', height: 64 },
  depNome: { marginTop: 4, fontSize: 11, fontFamily: typography.semiBold, color: colors.trilhaChipTexto, textAlign: 'center' },
  instituicao: { marginTop: 8, fontSize: 11, color: colors.placeholder, textAlign: 'center' },
  divisor: { height: 1, alignSelf: 'stretch', backgroundColor: colors.trilhaBalaoBorda, marginVertical: 12 },
  titulo: { fontSize: 13, fontFamily: typography.bold, color: colors.primaryDark, marginBottom: 6 },
  pessoa: { fontSize: 12, fontFamily: typography.semiBold, color: colors.primaryDark, textAlign: 'center', marginVertical: 1 },
  papel: { fontSize: 12, color: colors.placeholder },
});
