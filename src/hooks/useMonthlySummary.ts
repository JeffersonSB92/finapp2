import { useEffect, useMemo } from 'react';

import { calculateMonthlyComparison } from '../domain';
import { useFinanceStore } from '../store';

type TrendDirection = 'up' | 'down' | 'stable';

export interface MonthlySummaryBar {
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
  receitasHeight: number;
  despesasHeight: number;
  isCurrentMonth: boolean;
}

export interface MonthlyTrendIndicator {
  direction: TrendDirection;
  label: string;
  value: string;
}

export interface UseMonthlySummaryResult {
  bars: MonthlySummaryBar[];
  totalReceitas: string;
  totalDespesas: string;
  saldo: string;
  revenueTrend: MonthlyTrendIndicator;
  expenseTrend: MonthlyTrendIndicator;
  isLoading: boolean;
  error: string | null;
}

interface UseMonthlySummaryParams {
  referenceDate: Date;
}

const compactCurrencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

function getTrendIndicator(current: number, previous: number): MonthlyTrendIndicator {
  if (previous === 0 && current === 0) {
    return {
      direction: 'stable',
      label: 'Sem variação',
      value: '0%',
    };
  }

  if (previous === 0) {
    return {
      direction: 'up',
      label: 'Primeiro registro',
      value: '+100%',
    };
  }

  const difference = ((current - previous) / previous) * 100;

  if (Math.abs(difference) < 0.5) {
    return {
      direction: 'stable',
      label: 'Estável',
      value: `${difference.toFixed(0)}%`,
    };
  }

  return {
    direction: difference > 0 ? 'up' : 'down',
    label: difference > 0 ? 'Crescimento' : 'Queda',
    value: `${difference > 0 ? '+' : ''}${difference.toFixed(0)}%`,
  };
}

export function useMonthlySummary({
  referenceDate,
}: UseMonthlySummaryParams): UseMonthlySummaryResult {
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
      comparison.map((item, index) => ({
        ...item,
        receitasHeight: peakValue === 0 ? 10 : Math.max((item.receitas / peakValue) * 152, 10),
        despesasHeight: peakValue === 0 ? 10 : Math.max((item.despesas / peakValue) * 152, 10),
        isCurrentMonth: index === comparison.length - 1,
      })),
    [comparison, peakValue],
  );

  const currentMonth = comparison[comparison.length - 1];
  const previousMonth = comparison[comparison.length - 2];

  const totalReceitas = currentMonth?.receitas ?? 0;
  const totalDespesas = currentMonth?.despesas ?? 0;

  return {
    bars,
    totalReceitas: formatCurrency(totalReceitas),
    totalDespesas: formatCurrency(totalDespesas),
    saldo: formatCurrency(totalReceitas - totalDespesas),
    revenueTrend: getTrendIndicator(
      totalReceitas,
      previousMonth?.receitas ?? 0,
    ),
    expenseTrend: getTrendIndicator(
      totalDespesas,
      previousMonth?.despesas ?? 0,
    ),
    isLoading,
    error,
  };
}
