import { useEffect, useMemo } from 'react';

import { calculateCategorySpending } from '../domain';
import { useFinanceStore } from '../store';
import { theme } from '../theme/theme';
import { shiftMonth } from '../utils/date';

type TrendDirection = 'up' | 'down' | 'stable';

export interface CategoryBreakdownSlice {
  id: string;
  label: string;
  amount: number;
  formattedAmount: string;
  percentage: number;
  color: string;
}

export interface CategoryBreakdownTrend {
  direction: TrendDirection;
  label: string;
  value: string;
}

export interface UseCategoryBreakdownResult {
  slices: CategoryBreakdownSlice[];
  totalAmount: string;
  totalCategories: number;
  highlightLabel: string;
  trend: CategoryBreakdownTrend;
  isLoading: boolean;
  error: string | null;
}

interface UseCategoryBreakdownParams {
  referenceDate: Date;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const palette = [
  theme.colors.brand.primary,
  '#E26B50',
  '#F08C72',
  '#B7422B',
  '#8B3322',
  theme.colors.gray[500],
  theme.colors.gray[300],
];

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function getTrend(current: number, previous: number): CategoryBreakdownTrend {
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
    label: difference > 0 ? 'Alta de gastos' : 'Redução',
    value: `${difference > 0 ? '+' : ''}${difference.toFixed(0)}%`,
  };
}

export function useCategoryBreakdown({
  referenceDate,
}: UseCategoryBreakdownParams): UseCategoryBreakdownResult {
  const categories = useFinanceStore((state) => state.categories);
  const transactions = useFinanceStore((state) => state.transactions);
  const initialize = useFinanceStore((state) => state.initialize);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const currentBreakdown = useMemo(
    () =>
      calculateCategorySpending({
        categories,
        transactions,
        referenceDate,
      }),
    [categories, referenceDate, transactions],
  );

  const previousBreakdown = useMemo(
    () =>
      calculateCategorySpending({
        categories,
        transactions,
        referenceDate: shiftMonth(referenceDate, -1),
      }),
    [categories, referenceDate, transactions],
  );

  const slices = useMemo(
    () =>
      currentBreakdown.map((item, index) => ({
        id: `${item.categoryId ?? 'uncategorized'}-${index}`,
        label: item.categoryName,
        amount: item.amount,
        formattedAmount: formatCurrency(item.amount),
        percentage: item.percentage,
        color: palette[index % palette.length],
      })),
    [currentBreakdown],
  );

  const totalAmountNumber = currentBreakdown.reduce(
    (total, item) => total + item.amount,
    0,
  );
  const previousTotalAmount = previousBreakdown.reduce(
    (total, item) => total + item.amount,
    0,
  );
  const mainCategory = currentBreakdown[0];

  return {
    slices,
    totalAmount: formatCurrency(totalAmountNumber),
    totalCategories: currentBreakdown.length,
    highlightLabel: mainCategory
      ? `${mainCategory.categoryName} lidera com ${mainCategory.percentage.toFixed(0)}%`
      : 'Nenhuma categoria com gasto neste mês',
    trend: getTrend(totalAmountNumber, previousTotalAmount),
    isLoading,
    error,
  };
}
