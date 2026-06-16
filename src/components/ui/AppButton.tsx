import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { theme } from '../../theme/theme';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost';
type AppButtonSize = 'sm' | 'md' | 'fab';

interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  disabled,
  iconLeft,
  iconRight,
  label,
  loading = false,
  size = 'md',
  style,
  variant = 'primary',
  ...props
}: AppButtonProps): React.JSX.Element {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sizeSm : null,
        size === 'md' ? styles.sizeMd : null,
        size === 'fab' ? styles.sizeFab : null,
        variant === 'primary' ? styles.primary : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.brand.white : theme.colors.text.primary} />
      ) : (
        <View style={styles.content}>
          {iconLeft}
          <Text
            style={[
              styles.label,
              variant === 'primary' ? styles.labelPrimary : null,
              variant !== 'primary' ? styles.labelSecondary : null,
              size === 'sm' ? styles.labelSm : null,
            ]}
          >
            {label}
          </Text>
          {iconRight}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: theme.borders.width.thin,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primary: {
    ...theme.shadows.cardSoft,
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  secondary: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  sizeSm: {
    minHeight: 40,
    paddingHorizontal: theme.spacing.md,
  },
  sizeMd: {
    minHeight: 52,
    paddingHorizontal: theme.spacing.lg,
  },
  sizeFab: {
    minHeight: 56,
    paddingHorizontal: theme.spacing.xl,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  labelPrimary: {
    color: theme.colors.brand.white,
  },
  labelSecondary: {
    color: theme.colors.text.secondary,
  },
  labelSm: {
    fontSize: theme.fonts.size.sm,
  },
});
