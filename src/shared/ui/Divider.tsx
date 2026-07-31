import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { AppText } from './AppText';

interface DividerProps {
  label?: string;
}

export function Divider({ label = 'ou' }: DividerProps) {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <AppText style={styles.text}>{label}</AppText>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.primaryDark,
  },
  text: {
    marginHorizontal: 12,
    color: colors.primaryDark,
  },
});