import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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
        <Text style={styles.triggerIcon}>v</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal animationType="slide" transparent visible={visible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Text style={styles.closeText}>Fechar</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.optionList}>
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
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
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
  triggerIcon: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  modalOverlay: {
    backgroundColor: 'rgba(13, 13, 13, 0.86)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    maxHeight: '72%',
    padding: theme.spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  closeText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  optionList: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  modalOption: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(217, 80, 50, 0.14)',
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

