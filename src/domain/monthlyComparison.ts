import { Transaction, TransactionType } from '../database';
import { createMonthDate, getLocalMonthKey } from '../utils/date';

export interface MonthlyComparisonItem {
  monthDate: Date;
  monthKey: string;
  monthLabel: string;
  receitas: number;
  despesas: number;
}

export interface CalculateMonthlyComparisonInput {
  transactions: Transaction[];
  referenceDate?: Date;
  monthsCount?: number;
}

function getMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(date)
    .replace('.', '');
}

function getMonthWindow(referenceDate: Date, monthsCount: number): Date[] {
  const months: Date[] = [];

  for (let index = monthsCount - 1; index >= 0; index -= 1) {
    months.push(
      createMonthDate(
        referenceDate.getFullYear(),
        referenceDate.getMonth() - index,
      ),
    );
  }

  return months;
}

export function calculateMonthlyComparison(
  input: CalculateMonthlyComparisonInput,
): MonthlyComparisonItem[] {
  const referenceDate = input.referenceDate ?? new Date();
  const monthsCount = input.monthsCount ?? 6;
  const months = getMonthWindow(referenceDate, monthsCount);

  return months.map((monthDate) => {
    const monthKey = getLocalMonthKey(monthDate);

    const totals = input.transactions.reduce(
      (accumulator, transaction) => {
        const transactionDate = new Date(transaction.transaction_date);

        if (getLocalMonthKey(transactionDate) !== monthKey) {
          return accumulator;
        }

        if (transaction.type === TransactionType.INCOME) {
          accumulator.receitas += transaction.amount;
        }

        if (transaction.type === TransactionType.EXPENSE) {
          if (!transaction.is_paid) {
            return accumulator;
          }

          accumulator.despesas += transaction.amount;
        }

        return accumulator;
      },
      { receitas: 0, despesas: 0 },
    );

    return {
      monthDate,
      monthKey,
      monthLabel: getMonthLabel(monthDate),
      receitas: totals.receitas,
      despesas: totals.despesas,
    };
  });
}
