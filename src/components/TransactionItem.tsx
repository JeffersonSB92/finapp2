import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import { TransactionListItemModel } from '../hooks/useTransactionList';
import { theme } from '../theme/theme';

interface TransactionItemProps {
  item: TransactionListItemModel;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  onPress?: (item: TransactionListItemModel) => void;
}

function getValueColor(type: TransactionListItemModel['type']): string {
  if (type === 'income') {
    return theme.colors.status.success;
  }

  if (type === 'expense') {
    return theme.colors.status.error;
  }

  return theme.colors.text.primary;
}

function getStatusStyles(status: TransactionListItemModel['status']) {
  if (status === 'paid') {
    return {
      backgroundColor: theme.colors.status.successSoft,
      color: theme.colors.status.success,
    };
  }

  return {
    backgroundColor: theme.colors.brand.primarySoft,
    color: theme.colors.brand.primary,
  };
}

function getIndicator(type: TransactionListItemModel['type']): {
  color: string;
  label: string;
} {
  if (type === 'income') {
    return {
      color: theme.colors.status.success,
      label: 'R',
    };
  }

  if (type === 'expense') {
    return {
      color: theme.colors.brand.primary,
      label: 'D',
    };
  }

  return {
    color: theme.colors.text.muted,
    label: 'T',
  };
}

export function TransactionItem({
  item,
  onDelete,
  onEdit,
  onPress,
}: TransactionItemProps): React.JSX.Element {
  const statusStyles = getStatusStyles(item.status);
  const indicator = getIndicator(item.type);

  const renderRightActions = () => (
    <View style={styles.actions}>
      <RectButton
        onPress={() => onEdit?.(item.id)}
        style={[styles.actionButton, styles.editAction]}
      >
        <Text style={styles.actionText}>Editar</Text>
      </RectButton>
      <RectButton
        onPress={() => onDelete?.(item.id)}
        style={[styles.actionButton, styles.deleteAction]}
      >
        <Text style={styles.actionText}>Excluir</Text>
      </RectButton>
    </View>
  );

  return (
    <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
      <Pressable onPress={() => onPress?.(item)} style={styles.container}>
        <View style={styles.content}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: indicator.color },
            ]}
          >
            <Text style={styles.indicatorText}>{indicator.label}</Text>
          </View>

          <View style={styles.leading}>
            <Text numberOfLines={1} style={styles.title}>
              {item.title}
            </Text>
            {item.installmentLabel ? (
              <Text style={styles.installmentText}>
                Parcela {item.installmentLabel}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text numberOfLines={1} style={styles.metaText}>
                {item.category}
              </Text>
              {item.person ? (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text numberOfLines={1} style={styles.metaText}>
                    {item.person}
                  </Text>
                </>
              ) : null}
              {item.account ? (
                <>
                  <Text style={styles.separator}>•</Text>
                  <Text numberOfLines={1} style={styles.metaText}>
                    {item.account}
                  </Text>
                </>
              ) : null}
              <Text style={styles.separator}>•</Text>
              <Text style={styles.metaText}>{item.dateLabel}</Text>
            </View>
          </View>

          <View style={styles.trailing}>
            <Text style={[styles.value, { color: getValueColor(item.type) }]}>
              {item.type === 'expense' ? '-' : item.type === 'income' ? '+' : ''}
              {item.value}
            </Text>

            <View style={[styles.statusBadge, { backgroundColor: statusStyles.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusStyles.color }]}>
                {item.statusLabel}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.surface,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    minHeight: 82,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  indicator: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  indicatorText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  leading: {
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  installmentText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  metaText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  separator: {
    color: theme.colors.text.muted,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  value: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  statusBadge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  editAction: {
    backgroundColor: theme.colors.gray[700],
  },
  deleteAction: {
    backgroundColor: theme.colors.status.error,
  },
  actionText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
