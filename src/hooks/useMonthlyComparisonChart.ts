import { useEffect, useMemo, useState } from 'react';

import { calculateMonthlyComparison } from '../domain';
import { useFinanceStore } from '../store';

export interface MonthlyComparisonBar {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  receitasHeight: number;
  despesasHeight: number;
}

export interface UseMonthlyComparisonChartResult {
  bars: MonthlyComparisonBar[];
  currentMonthLabel: string;
  totalReceitas: string;
  totalDespesas: string;
  isLoading: boolean;
  error: string | null;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
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

function shiftMonth(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

export function useMonthlyComparisonChart(): UseMonthlyComparisonChartResult {
  const [referenceDate, setReferenceDate] = useState<Date>(
    new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)),
  );

  const transactions = useFinanceStore((state) => state.transactions);
  const initialize = useFinanceStore((state) => state.initialize);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const comparison = useMemo(
    () =>
      calculateMonthlyComparison({
        transactions,
        referenceDate,
        monthsCount: 6,
      }),
    [referenceDate, transactions],
  );

  const peakValue = useMemo(() => {
    const values = comparison.flatMap((item) => [item.receitas, item.despesas]);
    return Math.max(...values, 0);
  }, [comparison]);

  const bars = useMemo(
    () =>
      comparison.map((item) => ({
        ...item,
        receitasHeight: peakValue === 0 ? 8 : Math.max((item.receitas / peakValue) * 132, 8),
        despesasHeight: peakValue === 0 ? 8 : Math.max((item.despesas / peakValue) * 132, 8),
      })),
    [comparison, peakValue],
  );

  const currentMonthData = comparison[comparison.length - 1];

  return {
    bars,
    currentMonthLabel: formatMonthLabel(referenceDate),
    totalReceitas: formatCurrency(currentMonthData?.receitas ?? 0),
    totalDespesas: formatCurrency(currentMonthData?.despesas ?? 0),
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

