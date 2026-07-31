import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';

interface LabeledInputProps extends TextInputProps {
  label: string;
  placeholder?: string;
  hasError?: boolean;
}

const ERROR_COLOR = colors.error ?? '#C0392B';

// Esse componente é um input com um label acima dele. Ele recebe as props do TextInput, 
// além de uma prop "label" que é obrigatória e uma prop "placeholder" que é opcional
export function LabeledInput({ label, placeholder, style, hasError, ...inputProps }: LabeledInputProps) {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        style={[styles.input, hasError && styles.inputError, style]}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder ?? '#9AA5A0'}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
  },
  label: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    padding: 14,
    fontFamily: typography.regular,
    color: colors.primaryDark,
  },
  inputError: {
    borderColor: ERROR_COLOR,
  },
});