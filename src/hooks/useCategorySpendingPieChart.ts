import { useEffect, useMemo, useState } from 'react';

import { calculateCategorySpending } from '../domain';
import { useFinanceStore } from '../store';
import { theme } from '../theme/theme';
import { getCurrentMonthDate, shiftMonth } from '../utils/date';

export interface CategorySpendingSlice {
  id: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface UseCategorySpendingPieChartResult {
  slices: CategorySpendingSlice[];
  currentMonthLabel: string;
  totalAmount: string;
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

const palette = [
  theme.colors.brand.primary,
  '#E26B50',
  '#F08C72',
  '#B7422B',
  '#7A7A7A',
  '#5C5C5C',
  '#D9D9D9',
];

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function useCategorySpendingPieChart(): UseCategorySpendingPieChartResult {
  const [referenceDate, setReferenceDate] = useState<Date>(
    getCurrentMonthDate(),
  );

  const categories = useFinanceStore((state) => state.categories);
  const transactions = useFinanceStore((state) => state.transactions);
  const initialize = useFinanceStore((state) => state.initialize);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const spending = useMemo(
    () =>
      calculateCategorySpending({
        categories,
        transactions,
        referenceDate,
      }),
    [categories, referenceDate, transactions],
  );

  const slices = useMemo(
    () =>
      spending.map((item, index) => ({
        id: `${item.categoryId ?? 'uncategorized'}-${index}`,
        label: item.categoryName,
        amount: item.amount,
        percentage: item.percentage,
        color: palette[index % palette.length],
      })),
    [spending],
  );

  const totalAmount = spending.reduce((total, item) => total + item.amount, 0);

  return {
    slices,
    currentMonthLabel: formatMonthLabel(referenceDate),
    totalAmount: formatCurrency(totalAmount),
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
