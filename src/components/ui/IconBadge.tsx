import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme/theme';
import { getIconFallbackLabel, isFeatherIconName } from '../../utils/icons';

interface IconBadgeProps {
  iconName?: string | null;
  fallbackLabel: string;
  backgroundColor?: string | null;
  size?: number;
}

export function IconBadge({
  backgroundColor,
  fallbackLabel,
  iconName,
  size = 48,
}: IconBadgeProps): React.JSX.Element {
  const label = getIconFallbackLabel(iconName, fallbackLabel);

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: backgroundColor ?? theme.colors.background.surfaceSoft,
          borderRadius: Math.max(theme.radii.md, size / 3),
          height: size,
          width: size,
        },
      ]}
    >
      {isFeatherIconName(iconName) ? (
        <Feather color={theme.colors.brand.white} name={iconName} size={Math.round(size * 0.42)} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
