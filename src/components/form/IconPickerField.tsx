import React, { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { theme } from '../../theme/theme';
import {
  FEATHER_ICON_OPTIONS,
  getIconFallbackLabel,
  isFeatherIconName,
} from '../../utils/icons';
import { AppButton, AppModalSheet } from '../ui';

interface IconPickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
}

export function IconPickerField({
  error,
  hint,
  label,
  onChange,
  value,
}: IconPickerFieldProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return FEATHER_ICON_OPTIONS;
    }

    return FEATHER_ICON_OPTIONS.filter((iconName) =>
      iconName.toLowerCase().includes(normalizedSearch),
    );
  }, [search]);

  const fallbackLabel = getIconFallbackLabel(value, 'IC');

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <View style={styles.triggerContent}>
          <View style={styles.previewBadge}>
            {isFeatherIconName(value) ? (
              <Feather color={theme.colors.brand.white} name={value} size={18} />
            ) : (
              <Text style={styles.previewBadgeLabel}>{fallbackLabel}</Text>
            )}
          </View>

          <View style={styles.triggerTextWrap}>
            <Text style={styles.triggerText}>
              {value.trim() || 'Selecionar ícone'}
            </Text>
            <Text style={styles.triggerHint}>
              {value.trim()
                ? 'Toque para trocar o ícone'
                : 'Escolha entre vários ícones do app'}
            </Text>
          </View>
        </View>
        <Feather color={theme.colors.text.muted} name="chevron-down" size={18} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <AppModalSheet
        onClose={() => setVisible(false)}
        title={label}
        visible={visible}
      >
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setSearch}
          placeholder="Buscar ícone"
          placeholderTextColor={theme.colors.text.muted}
          style={styles.searchInput}
          value={search}
        />

        <View style={styles.selectedRow}>
          <Text style={styles.selectedLabel}>Atual</Text>
          <Text style={styles.selectedValue}>{value.trim() || 'Nenhum ícone selecionado'}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.grid}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {filteredIcons.map((iconName) => {
            const isSelected = value.trim() === iconName;

            return (
              <Pressable
                key={iconName}
                onPress={() => {
                  onChange(iconName);
                  setVisible(false);
                }}
                style={[styles.iconOption, isSelected ? styles.iconOptionSelected : null]}
              >
                <Feather
                  color={isSelected ? theme.colors.brand.primary : theme.colors.text.secondary}
                  name={iconName}
                  size={20}
                />
                <Text
                  numberOfLines={2}
                  style={[styles.iconOptionText, isSelected ? styles.iconOptionTextSelected : null]}
                >
                  {iconName}
                </Text>
              </Pressable>
            );
          })}

          {filteredIcons.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum ícone encontrado para essa busca.</Text>
          ) : null}
        </ScrollView>

        <View style={styles.actionsRow}>
          <AppButton
            label="Limpar"
            onPress={() => {
              onChange('');
              setVisible(false);
            }}
            variant="secondary"
          />
        </View>
      </AppModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
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
    minHeight: 58,
    paddingHorizontal: theme.spacing.md,
  },
  triggerError: {
    borderColor: theme.colors.status.error,
  },
  triggerContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  previewBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.lg,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  previewBadgeLabel: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  triggerTextWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  triggerText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  triggerHint: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  error: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  hint: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  searchInput: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    minHeight: 50,
    paddingHorizontal: theme.spacing.md,
  },
  selectedRow: {
    gap: 2,
  },
  selectedLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  selectedValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  iconOption: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    minHeight: 86,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    width: '30%',
  },
  iconOptionSelected: {
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
  },
  iconOptionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textAlign: 'center',
  },
  iconOptionTextSelected: {
    color: theme.colors.brand.primary,
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    paddingVertical: theme.spacing.lg,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.xs,
  },
});
