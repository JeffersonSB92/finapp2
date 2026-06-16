import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme/theme';

interface AppPillProps extends Omit<PressableProps, 'style'> {
  label: string;
  selected?: boolean;
  dotColor?: string;
}

export function AppPill({
  dotColor,
  label,
  selected = false,
  ...props
}: AppPillProps): React.JSX.Element {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
      {...props}
    >
      {dotColor ? (
        <View
          style={[
            styles.dot,
            { backgroundColor: selected ? theme.colors.brand.white : dotColor },
          ]}
        />
      ) : null}
      <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  selected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  pressed: {
    opacity: 0.92,
  },
  dot: {
    borderRadius: theme.radii.pill,
    height: 8,
    width: 8,
  },
  label: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  labelSelected: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.semibold,
  },
});
