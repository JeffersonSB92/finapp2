import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { theme } from '../../theme/theme';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  eyebrow?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  actionLabel,
  description,
  eyebrow,
  icon = 'inbox',
  onActionPress,
  style,
  title,
}: EmptyStateProps): React.JSX.Element {
  return (
    <AppCard style={[styles.card, style]}>
      <View style={styles.iconBadge}>
        <Feather color={theme.colors.brand.primary} name={icon} size={18} />
      </View>

      <View style={styles.content}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {actionLabel && onActionPress ? (
        <AppButton
          label={actionLabel}
          onPress={onActionPress}
          size="sm"
          style={styles.action}
          variant="secondary"
        />
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: theme.borders.width.thin,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: {
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  description: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  action: {
    marginTop: theme.spacing.xs,
  },
});
