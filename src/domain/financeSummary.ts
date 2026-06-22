import { Account, Transaction, TransactionType } from '../database';
import { isSameLocalMonth } from '../utils/date';

export type PayableTransaction = Omit<Transaction, 'is_paid'> & {
  is_paid?: boolean;
};

export interface FinanceSummary {
  saldoAtual: number;
  saldoEmConta: number;
  totalDespesas: number;
  totalReceitas: number;
}

export interface CalculateFinanceSummaryInput {
  accounts: Account[];
  transactions: PayableTransaction[];
  referenceDate?: Date;
}

function isPaidExpense(transaction: PayableTransaction): boolean {
  if (transaction.type !== TransactionType.EXPENSE) {
    return false;
  }

  return transaction.is_paid === true;
}

function isPaidIncome(transaction: PayableTransaction): boolean {
  if (transaction.type !== TransactionType.INCOME) {
    return false;
  }

  return transaction.is_paid === true;
}

export function calculateFinanceSummary(
  input: CalculateFinanceSummaryInput,
): FinanceSummary {
  const referenceDate = input.referenceDate ?? new Date();
  const monthTransactions = input.transactions.filter((transaction) =>
    isSameLocalMonth(transaction.transaction_date, referenceDate),
  );

  const saldoEmConta = input.accounts.reduce((total, account) => {
    if (!account.is_active) {
      return total;
    }

    return total + account.balance;
  }, 0);

  const totalReceitas = monthTransactions.reduce((total, transaction) => {
    if (transaction.type !== TransactionType.INCOME) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const totalDespesas = monthTransactions.reduce((total, transaction) => {
    if (transaction.type !== TransactionType.EXPENSE) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const despesasPagas = monthTransactions.reduce((total, transaction) => {
    if (!isPaidExpense(transaction)) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const receitasPagas = monthTransactions.reduce((total, transaction) => {
    if (!isPaidIncome(transaction)) {
      return total;
    }

    return total + transaction.amount;
  }, 0);

  const saldoAtual = saldoEmConta + receitasPagas - despesasPagas;

  return {
    saldoAtual,
    saldoEmConta,
    totalDespesas,
    totalReceitas,
  };
}
