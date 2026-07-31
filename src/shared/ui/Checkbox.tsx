import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';

interface CheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: React.ReactNode; // permite passar texto com link clicável dentro
}

export function Checkbox({ checked, onChange, label }: CheckboxProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!checked)}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Feather name="check" size={14} color={colors.white} />}
      </View>
      <View style={styles.labelWrapper}>{label}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primaryDark,
  },
  labelWrapper: {
    flex: 1,
  },
});