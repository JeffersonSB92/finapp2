import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  TransactionCategoryFilter,
  TransactionFilterType,
  useTransactionList,
} from '../hooks/useTransactionList';
import { theme } from '../theme/theme';
import { TransactionItem } from './TransactionItem';

interface TransactionListProps {
  onAddTransaction?: () => void;
  onEditTransaction?: (id: number) => void;
}

const typeOptions: Array<{ label: string; value: TransactionFilterType }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Receitas', value: 'income' },
  { label: 'Despesas', value: 'expense' },
];

function FilterChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
    >
      <Text
        style={[
          styles.filterChipText,
          selected ? styles.filterChipTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CategoryFilters({
  categoryFilter,
  categoryOptions,
  setCategoryFilter,
}: {
  categoryFilter: string;
  categoryOptions: TransactionCategoryFilter[];
  setCategoryFilter: (value: string) => void;
}): React.JSX.Element {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.filterRow}>
        {categoryOptions.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            onPress={() => setCategoryFilter(option.value)}
            selected={categoryFilter === option.value}
          />
        ))}
      </View>
    </ScrollView>
  );
}

export function TransactionList({
  onAddTransaction,
  onEditTransaction,
}: TransactionListProps): React.JSX.Element {
  const {
    sections,
    isLoading,
    error,
    typeFilter,
    categoryFilter,
    categoryOptions,
    setTypeFilter,
    setCategoryFilter,
    deleteTransaction,
  } = useTransactionList();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Transacoes</Text>
        <Text style={styles.title}>Movimentacoes recentes</Text>
      </View>

      <View style={styles.filtersCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {typeOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                onPress={() => setTypeFilter(option.value)}
                selected={typeFilter === option.value}
              />
            ))}
          </View>
        </ScrollView>

        <CategoryFilters
          categoryFilter={categoryFilter}
          categoryOptions={categoryOptions}
          setCategoryFilter={setCategoryFilter}
        />
      </View>

      {isLoading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Carregando transacoes...</Text>
        </View>
      ) : null}

      {error && !isLoading ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <SectionList
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TransactionItem
              item={item}
              onDelete={(id) => void deleteTransaction(id)}
              onEdit={onEditTransaction}
            />
          )}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Nenhuma transacao encontrada</Text>
              <Text style={styles.emptyText}>
                Ajuste os filtros ou adicione uma nova movimentacao.
              </Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      <Pressable onPress={onAddTransaction} style={styles.fab}>
        <Text style={styles.fabText}>+ Nova</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
    padding: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  filtersCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  filterChip: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  filterChipText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  filterChipTextSelected: {
    color: theme.colors.brand.white,
  },
  feedbackCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  feedbackText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  errorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  listContent: {
    paddingBottom: 104,
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    textTransform: 'capitalize',
  },
  emptyCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  fab: {
    ...theme.shadows.card,
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    bottom: theme.spacing.lg,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: theme.spacing.xl,
    position: 'absolute',
    right: theme.spacing.lg,
  },
  fabText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
});
