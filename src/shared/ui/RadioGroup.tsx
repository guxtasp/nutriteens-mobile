import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AppText } from './AppText';

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
}

export function RadioGroup({ label, options, value, onChange }: RadioGroupProps) {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={styles.optionRow}
              onPress={() => onChange(option.value)}
            >
              <View style={[styles.circle, selected && styles.circleSelected]}>
                {selected && <View style={styles.circleInner} />}
              </View>
              <AppText style={styles.optionText}>{option.label}</AppText>
            </Pressable>
          );
        })}
      </View>
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
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'flex-start',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  circleSelected: {
    borderColor: colors.primaryDark,
  },
  circleInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryDark,
  },
  optionText: {
    fontFamily: typography.regular,
    fontSize: 15,
    color: colors.primaryDark,
  },
});