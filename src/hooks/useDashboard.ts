import { useEffect, useMemo, useState } from 'react';

import { Category, TransactionType } from '../database';
import { useFinanceStore } from '../store';
import {
  createMonthDate,
  getCurrentMonthDate,
  isSameLocalMonth,
} from '../utils/date';

type DashboardTone = 'positive' | 'negative' | 'neutral';
type PlanningStatus = 'acima' | 'dentro' | 'abaixo';

export interface DashboardMetricCard {
  id: 'receitas' | 'despesas' | 'contasAtivas';
  title: string;
  value: string;
  helperText: string;
  tone: DashboardTone;
}

export interface DashboardPlanningSummary {
  value: string;
  helperText: string;
  plannedPercentage: number;
  currentPercentage: number;
  differenceLabel: string;
  progress: number;
  badgeLabel: PlanningStatus;
  tone: DashboardTone;
}

export interface DashboardRecentTransaction {
  id: number;
  title: string;
  category: string;
  dateLabel: string;
  value: string;
  type: TransactionType;
  indicatorLabel: string;
  indicatorColor: string;
}

export interface UseDashboardResult {
  activeAccountsCount: number;
  currentMonthLabel: string;
  currentMonthShortLabel: string;
  error: string | null;
  isLoading: boolean;
  latestTransactions: DashboardRecentTransaction[];
  metrics: DashboardMetricCard[];
  planning: DashboardPlanningSummary;
  referenceDate: Date;
  saldoAtual: string;
  saldoEmConta: string;
  selectMonth: (date: Date) => void;
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

function formatShortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
}

function formatRecentDateLabel(dateIso: string): string {
  const date = new Date(dateIso);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}

function getPlanningStatus(
  currentPercentage: number,
  plannedPercentage: number,
): PlanningStatus {
  const difference = currentPercentage - plannedPercentage;

  if (Math.abs(difference) < 0.5) {
    return 'dentro';
  }

  if (difference > 0) {
    return 'acima';
  }

  return 'abaixo';
}

function getToneFromStatus(status: PlanningStatus): DashboardTone {
  if (status === 'acima') {
    return 'negative';
  }

  if (status === 'abaixo') {
    return 'positive';
  }

  return 'neutral';
}

function buildCategoryMap(categories: Category[]): Map<number, Category> {
  return new Map(categories.map((category) => [category.id, category]));
}

function getTransactionIndicator(
  category: Category | undefined,
  type: TransactionType,
): { color: string; label: string } {
  if (category?.color?.trim()) {
    return {
      color: category.color,
      label: category.name.trim().charAt(0).toUpperCase(),
    };
  }

  if (type === TransactionType.INCOME) {
    return {
      color: '#2E8B57',
      label: 'R',
    };
  }

  if (type === TransactionType.EXPENSE) {
    return {
      color: '#D95032',
      label: 'D',
    };
  }

  return {
    color: '#7A7A7A',
    label: 'T',
  };
}

export function useDashboard(): UseDashboardResult {
  const [referenceDate, setReferenceDate] = useState<Date>(getCurrentMonthDate());

  const accounts = useFinanceStore((state) => state.accounts);
  const categories = useFinanceStore((state) => state.categories);
  const planning = useFinanceStore((state) => state.planning);
  const planningSettings = useFinanceStore((state) => state.planningSettings);
  const transactions = useFinanceStore((state) => state.transactions);
  const initialize = useFinanceStore((state) => state.initialize);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const activeAccountsCount = useMemo(
    () => accounts.filter((account) => account.is_active).length,
    [accounts],
  );

  const monthTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        isSameLocalMonth(transaction.transaction_date, referenceDate),
      ),
    [referenceDate, transactions],
  );

  const saldoEmConta = useMemo(
    () =>
      accounts.reduce((total, account) => {
        if (!account.is_active) {
          return total;
        }

        return total + account.balance;
      }, 0),
    [accounts],
  );

  const totalReceitas = useMemo(
    () =>
      monthTransactions.reduce((total, transaction) => {
        if (transaction.type !== TransactionType.INCOME) {
          return total;
        }

        return total + transaction.amount;
      }, 0),
    [monthTransactions],
  );

  const totalDespesas = useMemo(
    () =>
      monthTransactions.reduce((total, transaction) => {
        if (transaction.type !== TransactionType.EXPENSE) {
          return total;
        }

        return total + transaction.amount;
      }, 0),
    [monthTransactions],
  );

  const saldoAtual = saldoEmConta + totalReceitas - totalDespesas;

  const monthlyPlanningTotal = useMemo(
    () =>
      planning
        .filter(
          (item) =>
            item.year === referenceDate.getFullYear() &&
            item.month === referenceDate.getMonth() + 1,
        )
        .reduce((total, item) => total + item.planned_amount, 0),
    [planning, referenceDate],
  );

  const plannedPercentage = useMemo(() => {
    if (totalReceitas <= 0) {
      return planningSettings
        ? planningSettings.essential_percentage +
            planningSettings.non_essential_percentage
        : 0;
    }

    if (monthlyPlanningTotal > 0) {
      return (monthlyPlanningTotal / totalReceitas) * 100;
    }

    if (planningSettings) {
      return (
        planningSettings.essential_percentage +
        planningSettings.non_essential_percentage
      );
    }

    return 0;
  }, [monthlyPlanningTotal, planningSettings, totalReceitas]);

  const currentPercentage =
    totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
  const planningDifference = currentPercentage - plannedPercentage;
  const planningStatus = getPlanningStatus(currentPercentage, plannedPercentage);
  const planningTone = getToneFromStatus(planningStatus);

  const metrics: DashboardMetricCard[] = [
    {
      id: 'receitas',
      title: 'Receitas do mês',
      value: formatCurrency(totalReceitas),
      helperText: `Entradas em ${formatMonthLabel(referenceDate)}`,
      tone: totalReceitas > 0 ? 'positive' : 'neutral',
    },
    {
      id: 'despesas',
      title: 'Despesas do mês',
      value: formatCurrency(totalDespesas),
      helperText: `Saídas em ${formatMonthLabel(referenceDate)}`,
      tone: totalDespesas > 0 ? 'negative' : 'neutral',
    },
    {
      id: 'contasAtivas',
      title: 'Contas ativas',
      value: String(activeAccountsCount),
      helperText: `${formatCurrency(saldoEmConta)} em conta`,
      tone: activeAccountsCount > 0 ? 'neutral' : 'negative',
    },
  ];

  const categoriesById = useMemo(() => buildCategoryMap(categories), [categories]);

  const latestTransactions = useMemo<DashboardRecentTransaction[]>(
    () =>
      [...transactions]
        .sort(
          (left, right) =>
            new Date(right.transaction_date).getTime() -
            new Date(left.transaction_date).getTime(),
        )
        .slice(0, 4)
        .map((transaction) => {
          const category = transaction.category_id
            ? categoriesById.get(transaction.category_id)
            : undefined;
          const indicator = getTransactionIndicator(category, transaction.type);

          return {
            id: transaction.id,
            title: transaction.description?.trim() || 'Transação sem título',
            category:
              category?.name ??
              (transaction.type === TransactionType.TRANSFER
                ? 'Transferência'
                : 'Sem categoria'),
            dateLabel: formatRecentDateLabel(transaction.transaction_date),
            value: formatCurrency(transaction.amount),
            type: transaction.type,
            indicatorColor: indicator.color,
            indicatorLabel: indicator.label,
          };
        }),
    [categoriesById, transactions],
  );

  return {
    activeAccountsCount,
    currentMonthLabel: formatMonthLabel(referenceDate),
    currentMonthShortLabel: formatShortMonthLabel(referenceDate),
    error,
    isLoading,
    latestTransactions,
    metrics,
    planning: {
      value: `${currentPercentage.toFixed(0)}%`,
      helperText:
        plannedPercentage > 0
          ? `Meta planejada de ${plannedPercentage.toFixed(0)}%`
          : 'Sem meta definida',
      plannedPercentage,
      currentPercentage,
      differenceLabel: `${
        planningDifference >= 0 ? '+' : ''
      }${planningDifference.toFixed(1)} p.p.`,
      progress:
        plannedPercentage > 0
          ? Math.min((currentPercentage / plannedPercentage) * 100, 100)
          : 0,
      badgeLabel: planningStatus,
      tone: planningTone,
    },
    referenceDate,
    saldoAtual: formatCurrency(saldoAtual),
    saldoEmConta: formatCurrency(saldoEmConta),
    selectMonth: (date: Date) => {
      setReferenceDate(createMonthDate(date.getFullYear(), date.getMonth()));
    },
  };
}
