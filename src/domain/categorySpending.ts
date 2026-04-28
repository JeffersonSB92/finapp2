import { Category, Transaction, TransactionType } from '../database';

export interface CategorySpendingItem {
  categoryId: number | null;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface CalculateCategorySpendingInput {
  categories: Category[];
  transactions: Transaction[];
  referenceDate?: Date;
}

function isSameMonth(dateIso: string, referenceDate: Date): boolean {
  const date = new Date(dateIso);

  return (
    date.getUTCFullYear() === referenceDate.getUTCFullYear() &&
    date.getUTCMonth() === referenceDate.getUTCMonth()
  );
}

export function calculateCategorySpending(
  input: CalculateCategorySpendingInput,
): CategorySpendingItem[] {
  const referenceDate = input.referenceDate ?? new Date();
  const monthExpenses = input.transactions.filter(
    (transaction) =>
      transaction.type === TransactionType.EXPENSE &&
      isSameMonth(transaction.transaction_date, referenceDate),
  );

  const categoryTotals = monthExpenses.reduce<Map<number | null, number>>(
    (accumulator, transaction) => {
      const currentTotal = accumulator.get(transaction.category_id) ?? 0;
      accumulator.set(transaction.category_id, currentTotal + transaction.amount);
      return accumulator;
    },
    new Map(),
  );

  const totalAmount = Array.from(categoryTotals.values()).reduce(
    (total, amount) => total + amount,
    0,
  );

  return Array.from(categoryTotals.entries())
    .map(([categoryId, amount]) => {
      const category = input.categories.find((item) => item.id === categoryId);

      return {
        categoryId,
        categoryName: category?.name ?? 'Sem categoria',
        amount,
        percentage: totalAmount === 0 ? 0 : (amount / totalAmount) * 100,
      };
    })
    .sort((left, right) => right.amount - left.amount);
}

