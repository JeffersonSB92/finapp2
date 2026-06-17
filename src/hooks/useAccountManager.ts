import { useEffect, useMemo } from 'react';

import { Account, AccountType, Person } from '../database';
import { useFinanceStore } from '../store';

export interface AccountManagerItem {
  id: number;
  name: string;
  typeLabel: string;
  icon: string | null;
  iconLabel: string;
  ownerName: string | null;
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

function mapAccount(
  account: Account,
  peopleById: Map<number, Person>,
): AccountManagerItem {
  const presentation = getPresentationType(account);

  return {
    id: account.id,
    name: account.name,
    icon: account.icon,
    typeLabel: presentation.typeLabel,
    iconLabel: presentation.iconLabel,
    ownerName: account.owner_person_id
      ? peopleById.get(account.owner_person_id)?.name ?? null
      : null,
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
  const people = useFinanceStore((state) => state.people);
  const isLoading = useFinanceStore((state) => state.isLoading);
  const error = useFinanceStore((state) => state.error);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const mappedAccounts = useMemo(() => {
    const peopleById = new Map(people.map((person) => [person.id, person]));
    return accounts.map((account) => mapAccount(account, peopleById));
  }, [accounts, people]);

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
