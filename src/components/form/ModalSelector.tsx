import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppModalSheet } from '../ui';
import { theme } from '../../theme/theme';

export interface ModalSelectorOption<T extends string | number> {
  label: string;
  value: T;
}

interface ModalSelectorProps<T extends string | number> {
  label: string;
  placeholder: string;
  options: ModalSelectorOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T) => void;
  error?: string;
}

export function ModalSelector<T extends string | number>({
  error,
  label,
  onSelect,
  options,
  placeholder,
  selectedValue,
}: ModalSelectorProps<T>): React.JSX.Element {
  const [visible, setVisible] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((option) => option.value === selectedValue)?.label ?? placeholder,
    [options, placeholder, selectedValue],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <Text
          style={[
            styles.triggerText,
            selectedValue === null ? styles.placeholderText : null,
          ]}
        >
          {selectedLabel}
        </Text>
        <Feather
          color={theme.colors.text.muted}
          name="chevron-down"
          size={18}
        />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <AppModalSheet
        onClose={() => setVisible(false)}
        title={label}
        visible={visible}
      >
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <Pressable
              key={String(option.value)}
              onPress={() => {
                onSelect(option.value);
                setVisible(false);
              }}
              style={[
                styles.modalOption,
                isSelected ? styles.modalOptionSelected : null,
              ]}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  isSelected ? styles.modalOptionTextSelected : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </AppModalSheet>
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
  trigger: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  triggerError: {
    borderColor: theme.colors.status.error,
  },
  triggerText: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  placeholderText: {
    color: theme.colors.text.muted,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  modalOption: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  modalOptionText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  modalOptionTextSelected: {
    color: theme.colors.brand.primary,
  },
});
