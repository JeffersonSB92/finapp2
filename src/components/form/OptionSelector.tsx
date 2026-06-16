import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppPill } from '../ui';
import { theme } from '../../theme/theme';

export interface OptionItem<T extends string | number> {
  label: string;
  value: T;
}

interface OptionSelectorProps<T extends string | number> {
  label: string;
  options: OptionItem<T>[];
  selectedValue: T | null;
  onChange: (value: T) => void;
  error?: string;
}

export function OptionSelector<T extends string | number>({
  error,
  label,
  onChange,
  options,
  selectedValue,
}: OptionSelectorProps<T>): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.optionsRow}>
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <AppPill
                key={String(option.value)}
                label={option.label}
                onPress={() => onChange(option.value)}
                selected={isSelected}
              />
            );
          })}
        </View>
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xs,
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
