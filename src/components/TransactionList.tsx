import React, { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  Pressable,
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
import { MonthSelector } from './MonthSelector';
import { TransactionItem } from './TransactionItem';
import { AppButton, AppCard, AppModalSheet, AppPill, EmptyState } from './ui';
import type { TransactionListItemModel } from '../hooks/useTransactionList';

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
    referenceDate,
    typeFilter,
    categoryFilter,
    personFilter,
    categoryOptions,
    personOptions,
    selectMonth,
    setTypeFilter,
    setCategoryFilter,
    setPersonFilter,
    deleteTransaction,
  } = useTransactionList();
  const [areFiltersExpanded, setAreFiltersExpanded] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionListItemModel | null>(null);

  async function handleDeleteSelectedTransaction(): Promise<void> {
    if (!selectedTransaction) {
      return;
    }

    const transactionId = selectedTransaction.id;
    setSelectedTransaction(null);
    await deleteTransaction(transactionId);
  }

  function confirmDeleteSelectedTransaction(): void {
    if (!selectedTransaction) {
      return;
    }

    Alert.alert(
      'Excluir transação',
      `Deseja excluir "${selectedTransaction.title}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void handleDeleteSelectedTransaction();
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Movimentações</Text>
          <Text style={styles.title}>Todas as transações</Text>
          <Text style={styles.subtitle}>
            Filtre por tipo e categoria para localizar suas movimentações com rapidez.
          </Text>
          <MonthSelector onSelectMonth={selectMonth} selectedDate={referenceDate} />
        </View>

        <AppButton
          label="+ Nova"
          onPress={onAddTransaction}
          size="sm"
          style={styles.addButton}
        />
      </View>

      <AppCard style={styles.filtersCard}>
        <Pressable
          onPress={() => setAreFiltersExpanded((current) => !current)}
          style={styles.filtersHeader}
        >
          <View>
            <Text style={styles.filterLabel}>Filtros</Text>
            <Text style={styles.filtersSummary}>
              {areFiltersExpanded ? 'Toque para recolher' : 'Toque para expandir'}
            </Text>
          </View>
          <Feather
            color={theme.colors.text.secondary}
            name={areFiltersExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
          />
        </Pressable>

        {areFiltersExpanded ? (
          <>
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

            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Pessoa</Text>
              <CategoryFilters
                categoryFilter={personFilter}
                categoryOptions={personOptions}
                setCategoryFilter={setPersonFilter}
              />
            </View>
          </>
        ) : null}
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
              onPress={setSelectedTransaction}
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

      <AppModalSheet
        onClose={() => setSelectedTransaction(null)}
        title="Detalhes da transação"
        visible={selectedTransaction !== null}
      >
        {selectedTransaction ? (
          <View style={styles.detailContent}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Título</Text>
              <Text style={styles.detailValue}>{selectedTransaction.title}</Text>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>Valor</Text>
              <Text style={styles.detailValue}>{selectedTransaction.value}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Tipo</Text>
                <Text style={styles.detailValue}>{selectedTransaction.type}</Text>
              </View>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>{selectedTransaction.statusLabel}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Categoria</Text>
                <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
              </View>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Conta</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.account ?? 'Não informada'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Pessoa</Text>
                <Text style={styles.detailValue}>
                  {selectedTransaction.person ?? 'Não informada'}
                </Text>
              </View>
              <View style={styles.detailBlockCompact}>
                <Text style={styles.detailLabel}>Horário</Text>
                <Text style={styles.detailValue}>{selectedTransaction.dateLabel}</Text>
              </View>
            </View>

            {selectedTransaction.installmentLabel ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Parcelamento</Text>
                <Text style={styles.detailValue}>
                  Parcela {selectedTransaction.installmentLabel}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailActions}>
              <AppButton
                label="Editar"
                onPress={() => {
                  const transactionId = selectedTransaction.id;
                  setSelectedTransaction(null);
                  onEditTransaction?.(transactionId);
                }}
                variant="secondary"
              />
              <AppButton
                label="Excluir"
                onPress={confirmDeleteSelectedTransaction}
              />
            </View>
          </View>
        ) : null}
      </AppModalSheet>
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
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
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
  filtersHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filtersSummary: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
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
  addButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xxs,
  },
  detailContent: {
    gap: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  detailBlock: {
    gap: theme.spacing.xxs,
  },
  detailBlockCompact: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  detailLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  detailActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
});
