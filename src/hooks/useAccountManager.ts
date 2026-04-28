import { useEffect, useMemo } from 'react';

import { Account, AccountType } from '../database';
import { useFinanceStore } from '../store';

export interface AccountManagerItem {
  id: number;
  name: string;
  typeLabel: string;
  iconLabel: string;
  initialBalance: string;
  currentBalance: string;
  tone: 'positive' | 'negative' | 'neutral';
  color: string | null;
  isActive: boolean;
}

export interface UseAccountManagerResult {
  accounts: AccountManagerItem[];
  totalBalance: string;
  activeAccountsCount: number;
  isLoading: boolean;
  error: string | null;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function getPresentationType(account: Account): {
  iconLabel: string;
  typeLabel: string;
} {
  if (account.type === AccountType.CASH) {
    return {
      iconLabel: 'CT',
      typeLabel: 'Carteira',
    };
  }

  if (account.type === AccountType.OTHER) {
    return {
      iconLabel: 'VA',
      typeLabel: 'VA/VR',
    };
  }

  return {
    iconLabel: 'BK',
    typeLabel: 'Banco',
  };
}

function mapAccount(account: Account): AccountManagerItem {
  const presentation = getPresentationType(account);

  return {
    id: account.id,
    name: account.name,
    typeLabel: presentation.typeLabel,
    iconLabel: presentation.iconLabel,
    initialBalance: formatCurrency(account.balance),
    currentBalance: formatCurrency(account.balance),
    tone: account.balance > 0 ? 'positive' : account.balance < 0 ? 'negative' : 'neutral',
    color: account.color,
    isActive: account.is_active,
  };
}

export function useAccountManager(): UseAccountManagerResult {
  const initialize = useFinanceStore((state) => state.initialize);
  const accounts = useFinanceStore((state) => state.accounts);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const mappedAccounts = useMemo(() => accounts.map(mapAccount), [accounts]);

  const totalBalance = useMemo(
    () =>
      formatCurrency(
        accounts.reduce((total, account) => {
          if (!account.is_active) {
            return total;
          }

          return total + account.balance;
        }, 0),
      ),
    [accounts],
  );

  const activeAccountsCount = useMemo(
    () => accounts.filter((account) => account.is_active).length,
    [accounts],
  );

  return {
    accounts: mappedAccounts,
    totalBalance,
    activeAccountsCount,
    isLoading,
    error,
  };
}

