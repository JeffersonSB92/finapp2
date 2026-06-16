import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { TransactionType } from '../database';
import {
  TransactionCategoryFilter,
  TransactionFilterType,
  useTransactionList,
} from '../hooks/useTransactionList';
import { theme } from '../theme/theme';
import { TransactionItem } from './TransactionItem';
import { AppButton, AppCard, AppPill, EmptyState } from './ui';

interface TransactionListProps {
  onAddTransaction?: () => void;
  onEditTransaction?: (id: number) => void;
}

const typeOptions: Array<{ label: string; value: TransactionFilterType }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Receitas', value: TransactionType.INCOME },
  { label: 'Despesas', value: TransactionType.EXPENSE },
];

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
          <AppPill
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
        <Text style={styles.eyebrow}>Movimentações</Text>
        <Text style={styles.title}>Todas as transações</Text>
        <Text style={styles.subtitle}>
          Filtre por tipo e categoria para localizar suas movimentações com rapidez.
        </Text>
      </View>

      <AppCard style={styles.filtersCard}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Tipo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {typeOptions.map((option) => (
                <AppPill
                  key={option.value}
                  label={option.label}
                  onPress={() => setTypeFilter(option.value)}
                  selected={typeFilter === option.value}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Categoria</Text>
          <CategoryFilters
            categoryFilter={categoryFilter}
            categoryOptions={categoryOptions}
            setCategoryFilter={setCategoryFilter}
          />
        </View>
      </AppCard>

      {isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Carregando transações...</Text>
        </AppCard>
      ) : null}

      {error && !isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
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
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              actionLabel="Nova movimentação"
              description="Ajuste os filtros ou adicione uma nova movimentação para começar."
              eyebrow="Sem transações"
              icon="repeat"
              onActionPress={onAddTransaction}
              style={styles.emptyCard}
              title="Nenhuma transação encontrada"
            />
          }
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      <AppButton
        label="+ Nova"
        onPress={onAddTransaction}
        size="fab"
        style={styles.fab}
      />
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
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  filtersCard: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filterGroup: {
    gap: theme.spacing.xs,
  },
  filterLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
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
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['2xl'],
  },
  sectionHeader: {
    paddingBottom: theme.spacing.xs,
    paddingTop: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'capitalize',
  },
  emptyCard: {
    marginTop: theme.spacing.sm,
  },
  fab: {
    bottom: theme.spacing.bottomSafe + theme.spacing.md,
    position: 'absolute',
    right: theme.spacing.lg,
  },
});
