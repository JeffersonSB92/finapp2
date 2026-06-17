import { useEffect, useMemo, useState } from 'react';

import {
  Account,
  Category,
  Person,
  Transaction,
  TransactionType,
} from '../database';
import { getCurrentMonthDate, isSameLocalMonth } from '../utils/date';
import { useFinanceStore } from '../store';
import { getLocalDateKey, parseDateKey } from '../utils/date';

export type TransactionPaymentStatus = 'paid' | 'pending';
export type TransactionFilterType = 'all' | TransactionType;

export interface TransactionListItemModel {
  id: number;
  title: string;
  value: string;
  rawValue: number;
  person: string | null;
  account: string | null;
  installmentLabel: string | null;
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
  referenceDate: Date;
  typeFilter: TransactionFilterType;
  categoryFilter: string;
  personFilter: string;
  categoryOptions: TransactionCategoryFilter[];
  personOptions: TransactionCategoryFilter[];
  selectMonth: (value: Date) => void;
  setTypeFilter: (value: TransactionFilterType) => void;
  setCategoryFilter: (value: string) => void;
  setPersonFilter: (value: string) => void;
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
    year: 'numeric',
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

function buildAccountMap(accounts: Account[]): Map<number, Account> {
  return new Map(accounts.map((account) => [account.id, account]));
}

function buildPersonMap(people: Person[]): Map<number, Person> {
  return new Map(people.map((person) => [person.id, person]));
}

function deriveStatus(transaction: Transaction): TransactionPaymentStatus {
  return transaction.is_paid ? 'paid' : 'pending';
}

function buildItemModel(
  transaction: Transaction,
  categoriesById: Map<number, Category>,
  accountsById: Map<number, Account>,
  peopleById: Map<number, Person>,
): TransactionListItemModel {
  const category = transaction.category_id
    ? categoriesById.get(transaction.category_id)
    : null;
  const account = accountsById.get(transaction.account_id);
  const person = transaction.person_id ? peopleById.get(transaction.person_id) : null;
  const status = deriveStatus(transaction);
  const transactionDate = new Date(transaction.transaction_date);

  return {
    id: transaction.id,
    title: transaction.description?.trim() || 'Transação sem título',
    value: formatCurrency(transaction.amount),
    rawValue: transaction.amount,
    person: person?.name ?? null,
    account: account?.name ?? null,
    installmentLabel:
      transaction.installment_count && transaction.installment_count > 1
        ? `${transaction.installment_index ?? 1}/${transaction.installment_count}`
        : null,
    category:
      category?.name ??
      (transaction.type === TransactionType.TRANSFER ? 'Transferência' : 'Sem categoria'),
    type: transaction.type,
    status,
    statusLabel: status === 'paid' ? 'Pago' : 'Pendente',
    dateLabel: formatItemDate(transactionDate),
    transaction,
  };
}

export function useTransactionList(): UseTransactionListResult {
  const [referenceDate, setReferenceDate] = useState<Date>(getCurrentMonthDate());
  const [typeFilter, setTypeFilter] = useState<TransactionFilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [personFilter, setPersonFilter] = useState<string>('all');

  const accounts = useFinanceStore((state) => state.accounts);
  const people = useFinanceStore((state) => state.people);
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

  const personOptions = useMemo<TransactionCategoryFilter[]>(
    () => [
      { label: 'Todas', value: 'all' },
      ...people
        .filter((person) => person.is_active)
        .map((person) => ({
          label: person.name,
          value: String(person.id),
        })),
    ],
    [people],
  );

  const sections = useMemo<TransactionListSection[]>(() => {
    const categoriesById = buildCategoryMap(categories);
    const accountsById = buildAccountMap(accounts);
    const peopleById = buildPersonMap(people);

    const filteredTransactions = transactions.filter((transaction) => {
      if (!isSameLocalMonth(transaction.transaction_date, referenceDate)) {
        return false;
      }

      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }

      if (
        categoryFilter !== 'all' &&
        String(transaction.category_id ?? '') !== categoryFilter
      ) {
        return false;
      }

      if (personFilter !== 'all' && String(transaction.person_id ?? '') !== personFilter) {
        return false;
      }

      return true;
    });

    const grouped = filteredTransactions.reduce<Map<string, TransactionListItemModel[]>>(
      (accumulator, transaction) => {
        const dateKey = getLocalDateKey(transaction.transaction_date);
        const currentItems = accumulator.get(dateKey) ?? [];
        currentItems.push(
          buildItemModel(transaction, categoriesById, accountsById, peopleById),
        );
        accumulator.set(dateKey, currentItems);
        return accumulator;
      },
      new Map(),
    );

    return Array.from(grouped.entries())
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([dateKey, data]) => ({
        title: formatSectionTitle(parseDateKey(dateKey)),
        dateKey,
        data,
      }));
  }, [
    accounts,
    categories,
    categoryFilter,
    people,
    personFilter,
    referenceDate,
    transactions,
    typeFilter,
  ]);

  return {
    sections,
    isLoading,
    error,
    referenceDate,
    typeFilter,
    categoryFilter,
    personFilter,
    categoryOptions,
    personOptions,
    selectMonth: setReferenceDate,
    setTypeFilter,
    setCategoryFilter,
    setPersonFilter,
    deleteTransaction: removeTransaction,
  };
}
