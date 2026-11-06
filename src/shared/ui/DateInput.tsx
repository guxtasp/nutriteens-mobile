import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';
import { SeletorDataNativo } from './SeletorDataNativo';

interface DateInputProps {
  label: string;
  value: string; // já formatado como DD/MM/AAAA
  onChangeText: (formatted: string) => void;
  onBlur?: () => void;
}

// aplica a máscara DD/MM/AAAA enquanto o usuário digita
function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length <= 2) return day;
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${year}`;
}

export function DateInput({ label, value, onChangeText, onBlur }: DateInputProps) {
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={colors.placeholder ?? '#9AA5A0'}
          keyboardType="number-pad"
          value={value}
          onChangeText={(text) => onChangeText(applyDateMask(text))}
          onBlur={onBlur}
          maxLength={10}
          accessibilityLabel={`${label}, formato dia, mês e ano`}
        />
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setCalendarioAberto(true);
          }}
          style={styles.iconeBotao}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Abrir calendário para escolher a data"
        >
          <Feather name="calendar" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <SeletorDataNativo
        visivel={calendarioAberto}
        valor={value}
        onFechar={() => setCalendarioAberto(false)}
        onEscolher={(data) => {
          onChangeText(data);
          onBlur?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 20,
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
    paddingRight: 40,
    fontFamily: typography.regular,
    color: colors.primaryDark,
  },
  iconeBotao: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});