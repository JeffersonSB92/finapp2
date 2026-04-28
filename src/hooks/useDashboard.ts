import { useEffect, useMemo, useState } from 'react';

import { TransactionType } from '../database';
import { useFinanceStore } from '../store';

type DashboardTone = 'positive' | 'negative' | 'neutral';
type PlanningStatus = 'acima' | 'dentro' | 'abaixo';

interface DashboardBaseCard {
  id: 'saldoAtual' | 'saldoEmConta' | 'totalDespesas' | 'planejamentoFinanceiro';
  title: string;
  tone: DashboardTone;
}

export interface DashboardValueCard extends DashboardBaseCard {
  kind: 'value';
  value: string;
  helperText: string;
}

export interface DashboardPlanningCard extends DashboardBaseCard {
  kind: 'planning';
  value: string;
  helperText: string;
  plannedPercentage: number;
  currentPercentage: number;
  differenceLabel: string;
  progress: number;
  badgeLabel: PlanningStatus;
}

export type DashboardCardData = DashboardValueCard | DashboardPlanningCard;

export interface UseDashboardResult {
  cards: DashboardCardData[];
  currentMonthLabel: string;
  currentMonthShortLabel: string;
  isLoading: boolean;
  error: string | null;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
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

function createMonthDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1));
}

function shiftMonth(date: Date, amount: number): Date {
  return createMonthDate(date.getUTCFullYear(), date.getUTCMonth() + amount);
}

function isSameMonth(dateIso: string, referenceDate: Date): boolean {
  const date = new Date(dateIso);

  return (
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth()
  );
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

export function useDashboard(): UseDashboardResult {
  const [referenceDate, setReferenceDate] = useState<Date>(
    createMonthDate(new Date().getFullYear(), new Date().getMonth()),
  );

  const accounts = useFinanceStore((state) => state.accounts);
  const transactions = useFinanceStore((state) => state.transactions);
  const planning = useFinanceStore((state) => state.planning);
  const planningSettings = useFinanceStore((state) => state.planningSettings);
  const initialize = useFinanceStore((state) => state.initialize);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const monthTransactions = useMemo(
    () =>
      transactions.filter((transaction) =>
        isSameMonth(transaction.transaction_date, referenceDate),
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

  const saldoAtual = totalReceitas - totalDespesas;

  const monthlyPlanningTotal = useMemo(
    () =>
      planning
        .filter(
          (item) =>
            item.year === referenceDate.getUTCFullYear() &&
            item.month === referenceDate.getUTCMonth() + 1,
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

  const cards: DashboardCardData[] = [
    {
      id: 'saldoAtual',
      kind: 'value',
      title: 'Saldo Atual',
      value: formatCurrency(saldoAtual),
      tone: saldoAtual >= 0 ? 'positive' : 'negative',
      helperText: `Receitas ${formatCurrency(totalReceitas)}`,
    },
    {
      id: 'saldoEmConta',
      kind: 'value',
      title: 'Saldo em Conta',
      value: formatCurrency(saldoEmConta),
      tone: saldoEmConta >= 0 ? 'positive' : 'negative',
      helperText: `${accounts.filter((item) => item.is_active).length} contas ativas`,
    },
    {
      id: 'totalDespesas',
      kind: 'value',
      title: 'Total de Despesas',
      value: formatCurrency(totalDespesas),
      tone: totalDespesas > 0 ? 'negative' : 'neutral',
      helperText: `No mes de ${formatMonthLabel(referenceDate)}`,
    },
    {
      id: 'planejamentoFinanceiro',
      kind: 'planning',
      title: 'Planejamento Financeiro',
      value: `${currentPercentage.toFixed(0)}%`,
      tone: planningTone,
      helperText:
        plannedPercentage > 0
          ? `Planejado ${plannedPercentage.toFixed(0)}%`
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
    },
  ];

  return {
    cards,
    currentMonthLabel: formatMonthLabel(referenceDate),
    currentMonthShortLabel: formatShortMonthLabel(referenceDate),
    isLoading,
    error,
    goToPreviousMonth: () => {
      setReferenceDate((current) => shiftMonth(current, -1));
    },
    goToNextMonth: () => {
      setReferenceDate((current) => shiftMonth(current, 1));
    },
  };
}
