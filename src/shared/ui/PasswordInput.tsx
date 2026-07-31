import React, { useState } from 'react';
import { View, TextInput, TextInputProps, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';

interface PasswordInputProps extends TextInputProps {
  label: string;
  hasError?: boolean;
}

const ERROR_COLOR = colors.error ?? '#C0392B';

export function PasswordInput({ label, style, hasError, ...inputProps }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, hasError && styles.inputError, style]}
          secureTextEntry={!showPassword}
          {...inputProps}
        />
        <Pressable style={styles.eyeIcon} onPress={() => setShowPassword((prev) => !prev)}>
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={20}
            color={hasError ? ERROR_COLOR : colors.primaryDark}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  label: {
    fontFamily: typography.regular,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    padding: 14,
    paddingRight: 44,
    fontFamily: typography.regular,
    color: colors.primaryDark,
  },
  inputError: {
    borderColor: ERROR_COLOR,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
});