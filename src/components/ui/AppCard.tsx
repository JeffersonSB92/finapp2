import React from 'react';
import { StyleProp, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';

import { theme } from '../../theme/theme';

type AppCardVariant = 'default' | 'soft';

interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: AppCardVariant;
  contentStyle?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  contentStyle,
  style,
  variant = 'default',
  ...props
}: AppCardProps): React.JSX.Element {
  return (
    <View
      style={[
        styles.base,
        variant === 'soft' ? styles.soft : null,
        style,
        contentStyle,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...theme.shadows.cardSoft,
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.layout.card.borderRadius,
    borderWidth: theme.borders.width.thin,
    gap: theme.layout.card.gap,
    padding: theme.layout.card.padding,
  },
  soft: {
    backgroundColor: theme.colors.background.surfaceSoft,
  },
});
