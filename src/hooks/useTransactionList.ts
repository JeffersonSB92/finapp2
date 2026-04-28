import { useEffect, useMemo, useState } from 'react';

import { Category, Transaction, TransactionType } from '../database';
import { useFinanceStore } from '../store';

export type TransactionPaymentStatus = 'paid' | 'pending';
export type TransactionFilterType = 'all' | TransactionType;

export interface TransactionListItemModel {
  id: number;
  title: string;
  value: string;
  rawValue: number;
  category: string;
  type: TransactionType;
  status: TransactionPaymentStatus;
  statusLabel: string;
  dateLabel: string;
  transaction: Transaction;
}

export interface TransactionListSection {
  title: string;
  dateKey: string;
  data: TransactionListItemModel[];
}

export interface TransactionCategoryFilter {
  label: string;
  value: string;
}

export interface UseTransactionListResult {
  sections: TransactionListSection[];
  isLoading: boolean;
  error: string | null;
  typeFilter: TransactionFilterType;
  categoryFilter: string;
  categoryOptions: TransactionCategoryFilter[];
  setTypeFilter: (value: TransactionFilterType) => void;
  setCategoryFilter: (value: string) => void;
  deleteTransaction: (id: number) => Promise<void>;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatSectionTitle(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(date);
}

function formatItemDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function buildCategoryMap(categories: Category[]): Map<number, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}

function deriveStatus(transaction: Transaction): TransactionPaymentStatus {
  return transaction.is_paid ? 'paid' : 'pending';
}

function buildItemModel(
  transaction: Transaction,
  categoriesById: Map<number, Category>,
): TransactionListItemModel {
  const category = transaction.category_id
    ? categoriesById.get(transaction.category_id)
    : null;
  const status = deriveStatus(transaction);
  const transactionDate = new Date(transaction.transaction_date);

  return {
    id: transaction.id,
    title: transaction.description?.trim() || 'Transacao sem titulo',
    value: formatCurrency(transaction.amount),
    rawValue: transaction.amount,
    category:
      category?.name ??
      (transaction.type === TransactionType.TRANSFER ? 'Transferencia' : 'Sem categoria'),
    type: transaction.type,
    status,
    statusLabel: status === 'paid' ? 'Pago' : 'Pendente',
    dateLabel: formatItemDate(transactionDate),
    transaction,
  };
}

export function useTransactionList(): UseTransactionListResult {
  const [typeFilter, setTypeFilter] = useState<TransactionFilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const transactions = useFinanceStore((state) => state.transactions);
  const categories = useFinanceStore((state) => state.categories);
  const initialize = useFinanceStore((state) => state.initialize);
  const removeTransaction = useFinanceStore((state) => state.removeTransaction);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const categoryOptions = useMemo<TransactionCategoryFilter[]>(
    () => [
      { label: 'Todas', value: 'all' },
      ...categories
        .filter((category) => category.type !== TransactionType.TRANSFER)
        .map((category) => ({
          label: category.name,
          value: String(category.id),
        })),
    ],
    [categories],
  );

  const sections = useMemo<TransactionListSection[]>(() => {
    const categoriesById = buildCategoryMap(categories);

    const filteredTransactions = transactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        String(transaction.category_id ?? '') !== categoryFilter
      ) {
        return false;
      }

      return true;
    });

    const grouped = filteredTransactions.reduce<Map<string, TransactionListItemModel[]>>(
      (accumulator, transaction) => {
        const date = new Date(transaction.transaction_date);
        const dateKey = date.toISOString().slice(0, 10);
        const currentItems = accumulator.get(dateKey) ?? [];
        currentItems.push(buildItemModel(transaction, categoriesById));
        accumulator.set(dateKey, currentItems);
        return accumulator;
      },
      new Map(),
    );

    return Array.from(grouped.entries())
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateKey, data]) => ({
        title: formatSectionTitle(new Date(`${dateKey}T00:00:00.000Z`)),
        dateKey,
        data,
      }));
  }, [categories, categoryFilter, transactions, typeFilter]);

  return {
    sections,
    isLoading,
    error,
    typeFilter,
    categoryFilter,
    categoryOptions,
    setTypeFilter,
    setCategoryFilter,
    deleteTransaction: removeTransaction,
  };
}
