import { useEffect, useMemo, useState } from 'react';

import { RecurringEntry, TransactionType } from '../database';
import { useFinanceStore } from '../store';
import { createMonthDate, getCurrentMonthDate, isSameLocalMonth } from '../utils/date';

type ForecastTone = 'positive' | 'negative' | 'neutral';

export interface ForecastSummaryMetric {
  id: 'base' | 'launched' | 'recurring' | 'projected';
  label: string;
  value: string;
  helperText: string;
  tone: ForecastTone;
}

export interface ForecastEventItem {
  id: string;
  dateLabel: string;
  title: string;
  subtitle: string;
  amountLabel: string;
  type: TransactionType;
  sourceLabel: string;
}

export interface ForecastPersonSummaryItem {
  id: string;
  label: string;
  income: string;
  expense: string;
  balance: string;
}

export interface ForecastRecurringItem {
  id: number;
  name: string;
  amountLabel: string;
  dayLabel: string;
  groupLabel: string;
  personLabel: string | null;
  accountLabel: string | null;
  categoryLabel: string | null;
  type: TransactionType;
  isActive: boolean;
}

export interface UseForecastScreenResult {
  error: string | null;
  events: ForecastEventItem[];
  isLoading: boolean;
  monthLabel: string;
  personSummaries: ForecastPersonSummaryItem[];
  recurringItems: ForecastRecurringItem[];
  referenceDate: Date;
  selectMonth: (date: Date) => void;
  summaryMetrics: ForecastSummaryMetric[];
}

interface ForecastSourceItem {
  amount: number;
  day: number;
  id: string;
  personId: number | null;
  sourceLabel: string;
  subtitle: string;
  title: string;
  type: TransactionType;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getTone(value: number): ForecastTone {
  if (value > 0) {
    return 'positive';
  }

  if (value < 0) {
    return 'negative';
  }

  return 'neutral';
}

function getDayLabel(referenceDate: Date, day: number): string {
  return `${String(day).padStart(2, '0')}/${String(referenceDate.getMonth() + 1).padStart(2, '0')}`;
}

function clampDay(referenceDate: Date, day: number): number {
  const lastDay = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  ).getDate();

  return Math.min(Math.max(day, 1), lastDay);
}

function getRecurringGroupLabel(groupType: RecurringEntry['group_type']): string {
  return groupType === 'fixed' ? 'Fixa' : 'Variável';
}

export function useForecastScreen(): UseForecastScreenResult {
  const [referenceDate, setReferenceDate] = useState<Date>(getCurrentMonthDate());

  const initialize = useFinanceStore((state) => state.initialize);
  const accounts = useFinanceStore((state) => state.accounts);
  const people = useFinanceStore((state) => state.people);
  const categories = useFinanceStore((state) => state.categories);
  const recurringEntries = useFinanceStore((state) => state.recurringEntries);
  const transactions = useFinanceStore((state) => state.transactions);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const peopleById = useMemo(
    () => new Map(people.map((person) => [person.id, person])),
    [people],
  );
  const accountsById = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const monthTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        isSameLocalMonth(transaction.transaction_date, referenceDate),
      ),
    [referenceDate, transactions],
  );

  const recurringOccurrences = useMemo<ForecastSourceItem[]>(
    () =>
      recurringEntries
        .filter((entry) => entry.is_active)
        .map((entry) => {
          const personLabel =
            entry.person_id !== null
              ? peopleById.get(entry.person_id)?.name ?? 'Pessoa não encontrada'
              : 'Sem responsável';
          const categoryLabel =
            entry.category_id !== null
              ? categoriesById.get(entry.category_id)?.name ?? 'Sem categoria'
              : 'Sem categoria';

          return {
            amount: entry.amount,
            day: clampDay(referenceDate, entry.day_of_month),
            id: `recurring-${entry.id}`,
            personId: entry.person_id,
            sourceLabel: `Recorrência ${getRecurringGroupLabel(entry.group_type).toLowerCase()}`,
            subtitle: `${personLabel} • ${categoryLabel}`,
            title: entry.name,
            type: entry.type,
          };
        }),
    [categoriesById, peopleById, recurringEntries, referenceDate],
  );

  const launchedItems = useMemo<ForecastSourceItem[]>(
    () =>
      monthTransactions.map((transaction) => {
        const date = new Date(transaction.transaction_date);
        const categoryLabel =
          transaction.category_id !== null
            ? categoriesById.get(transaction.category_id)?.name ?? 'Sem categoria'
            : 'Sem categoria';
        const personLabel =
          transaction.person_id !== null
            ? peopleById.get(transaction.person_id)?.name ?? 'Pessoa não encontrada'
            : 'Sem responsável';

        return {
          amount: transaction.amount,
          day: date.getDate(),
          id: `transaction-${transaction.id}`,
          personId: transaction.person_id,
          sourceLabel: transaction.is_paid ? 'Lançado e pago' : 'Lançado pendente',
          subtitle: `${personLabel} • ${categoryLabel}`,
          title: transaction.description ?? 'Transação sem descrição',
          type: transaction.type,
        };
      }),
    [categoriesById, monthTransactions, peopleById],
  );

  const combinedEvents = useMemo(
    () =>
      [...recurringOccurrences, ...launchedItems].sort((left, right) =>
        left.day === right.day
          ? left.title.localeCompare(right.title)
          : left.day - right.day,
      ),
    [launchedItems, recurringOccurrences],
  );

  const baseBalance = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if (!account.is_active) {
          return total;
        }

        return total + account.balance;
      }, 0),
    [accounts],
  );

  const launchedNet = useMemo(
    () =>
      launchedItems.reduce((total, item) => {
        if (item.type === TransactionType.INCOME) {
          return total + item.amount;
        }

        return total - item.amount;
      }, 0),
    [launchedItems],
  );

  const recurringNet = useMemo(
    () =>
      recurringOccurrences.reduce((total, item) => {
        if (item.type === TransactionType.INCOME) {
          return total + item.amount;
        }

        return total - item.amount;
      }, 0),
    [recurringOccurrences],
  );

  const projectedBalance = baseBalance + launchedNet + recurringNet;

  const summaryMetrics = useMemo<ForecastSummaryMetric[]>(
    () => [
      {
        id: 'base',
        label: 'Saldo base',
        value: formatCurrency(baseBalance),
        helperText: 'Saldo atual somado das contas ativas.',
        tone: getTone(baseBalance),
      },
      {
        id: 'launched',
        label: 'Lançamentos do mês',
        value: formatCurrency(launchedNet),
        helperText: `${launchedItems.length} lançamento${launchedItems.length === 1 ? '' : 's'} contabilizado${launchedItems.length === 1 ? '' : 's'}.`,
        tone: getTone(launchedNet),
      },
      {
        id: 'recurring',
        label: 'Recorrências previstas',
        value: formatCurrency(recurringNet),
        helperText: `${recurringOccurrences.length} compromisso${recurringOccurrences.length === 1 ? '' : 's'} projetado${recurringOccurrences.length === 1 ? '' : 's'} para o mês.`,
        tone: getTone(recurringNet),
      },
      {
        id: 'projected',
        label: 'Saldo projetado',
        value: formatCurrency(projectedBalance),
        helperText: 'Estimativa final considerando base atual, lançamentos e recorrências.',
        tone: getTone(projectedBalance),
      },
    ],
    [baseBalance, launchedItems.length, launchedNet, projectedBalance, recurringNet, recurringOccurrences.length],
  );

  const events = useMemo<ForecastEventItem[]>(
    () =>
      combinedEvents.map((item) => ({
        id: item.id,
        amountLabel: formatCurrency(item.amount),
        dateLabel: getDayLabel(referenceDate, item.day),
        sourceLabel: item.sourceLabel,
        subtitle: item.subtitle,
        title: item.title,
        type: item.type,
      })),
    [combinedEvents, referenceDate],
  );

  const personSummaries = useMemo<ForecastPersonSummaryItem[]>(
    () => {
      const accumulator = new Map<
        string,
        { income: number; expense: number; label: string }
      >();

      for (const item of [...recurringOccurrences, ...launchedItems]) {
        const key = String(item.personId ?? 'none');
        const current = accumulator.get(key) ?? {
          income: 0,
          expense: 0,
          label:
            item.personId !== null
              ? peopleById.get(item.personId)?.name ?? 'Pessoa'
              : 'Sem responsável',
        };

        if (item.type === TransactionType.INCOME) {
          current.income += item.amount;
        } else {
          current.expense += item.amount;
        }

        accumulator.set(key, current);
      }

      return [...accumulator.entries()].map(([id, item]) => ({
        id,
        label: item.label,
        income: formatCurrency(item.income),
        expense: formatCurrency(item.expense),
        balance: formatCurrency(item.income - item.expense),
      }));
    },
    [launchedItems, peopleById, recurringOccurrences],
  );

  const recurringItems = useMemo<ForecastRecurringItem[]>(
    () =>
      recurringEntries.map((entry) => ({
        id: entry.id,
        accountLabel:
          entry.account_id !== null
            ? accountsById.get(entry.account_id)?.name ?? null
            : null,
        amountLabel: formatCurrency(entry.amount),
        categoryLabel:
          entry.category_id !== null
            ? categoriesById.get(entry.category_id)?.name ?? null
            : null,
        dayLabel: `Todo dia ${String(entry.day_of_month).padStart(2, '0')}`,
        groupLabel: getRecurringGroupLabel(entry.group_type),
        isActive: entry.is_active,
        name: entry.name,
        personLabel:
          entry.person_id !== null
            ? peopleById.get(entry.person_id)?.name ?? null
            : null,
        type: entry.type,
      })),
    [accountsById, categoriesById, peopleById, recurringEntries],
  );

  function selectMonth(date: Date): void {
    setReferenceDate(createMonthDate(date.getFullYear(), date.getMonth()));
  }

  return {
    error,
    events,
    isLoading,
    monthLabel: formatMonthLabel(referenceDate),
    personSummaries,
    recurringItems,
    referenceDate,
    selectMonth,
    summaryMetrics,
  };
}
