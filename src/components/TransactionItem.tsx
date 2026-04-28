import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import { TransactionListItemModel } from '../hooks/useTransactionList';
import { theme } from '../theme/theme';

interface TransactionItemProps {
  item: TransactionListItemModel;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
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
      backgroundColor: 'rgba(46, 139, 87, 0.14)',
      color: theme.colors.status.success,
    };
  }

  return {
    backgroundColor: 'rgba(217, 80, 50, 0.16)',
    color: theme.colors.brand.primary,
  };
}

export function TransactionItem({
  item,
  onDelete,
  onEdit,
}: TransactionItemProps): React.JSX.Element {
  const statusStyles = getStatusStyles(item.status);

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
      <Pressable style={styles.container}>
        <View style={styles.content}>
          <View style={styles.leading}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.date}>{item.dateLabel}</Text>
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
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 88,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  leading: {
    flex: 1,
    gap: theme.spacing.xs,
    paddingRight: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  category: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  separator: {
    color: theme.colors.text.muted,
  },
  date: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
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

