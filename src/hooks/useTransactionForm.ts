import { useEffect, useMemo, useState } from 'react';

import { TransactionType } from '../database';
import { useFinanceStore } from '../store';
import { useAuthStore } from '../store/authStore';
import {
  formatDateInput,
  formatIsoDateInput,
  parseDateInputToIso,
} from '../utils/date';

export type TransactionStatusValue = 'paid' | 'pending';

export interface TransactionFormProps {
  transactionId?: number;
  onSuccess?: () => void;
}

interface TransactionFormValues {
  title: string;
  amount: string;
  type: TransactionType;
  personId: number | null;
  installmentCount: string;
  categoryId: number | null;
  subcategoryId: number | null;
  accountId: number | null;
  date: string;
  status: TransactionStatusValue;
}

interface TransactionFormErrors {
  title?: string;
  amount?: string;
  type?: string;
  personId?: string;
  installmentCount?: string;
  categoryId?: string;
  subcategoryId?: string;
  accountId?: string;
  date?: string;
  status?: string;
}

export interface TransactionFormOption {
  label: string;
  value: number;
}

export interface TransactionStatusOption {
  label: string;
  value: TransactionStatusValue;
}

export interface UseTransactionFormResult {
  values: TransactionFormValues;
  errors: TransactionFormErrors;
  isSubmitting: boolean;
  submitError: string | null;
  isEditing: boolean;
  accountOptions: TransactionFormOption[];
  personOptions: TransactionFormOption[];
  categoryOptions: TransactionFormOption[];
  subcategoryOptions: TransactionFormOption[];
  statusOptions: TransactionStatusOption[];
  typeOptions: Array<{ label: string; value: TransactionType }>;
  setField: <K extends keyof TransactionFormValues>(
    field: K,
    value: TransactionFormValues[K],
  ) => void;
  submit: () => Promise<void>;
}

const statusOptions: TransactionStatusOption[] = [
  { label: 'Pago', value: 'paid' },
  { label: 'Pendente', value: 'pending' },
];

const typeOptions: Array<{ label: string; value: TransactionType }> = [
  { label: 'Receita', value: TransactionType.INCOME },
  { label: 'Despesa', value: TransactionType.EXPENSE },
];

function getTodayDateInput(): string {
  return formatDateInput(new Date());
}

function parseCurrencyInput(value: string): number {
  const normalized = value.replace(/\D/g, '');

  if (!normalized) {
    return 0;
  }

  return Number(normalized) / 100;
}

function formatCurrencyInput(value: string): string {
  const numericValue = parseCurrencyInput(value);

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime());
}

function validate(
  values: TransactionFormValues,
  requiresPerson: boolean,
): TransactionFormErrors {
  const errors: TransactionFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Informe um título para a transação.';
  }

  if (parseCurrencyInput(values.amount) <= 0) {
    errors.amount = 'Informe um valor maior que zero.';
  }

  if (!values.type) {
    errors.type = 'Selecione o tipo.';
  }

  if (requiresPerson && values.personId === null) {
    errors.personId = 'Selecione a pessoa responsável.';
  }

  if (values.type === TransactionType.EXPENSE) {
    const installmentCount = Number(values.installmentCount);

    if (
      !Number.isInteger(installmentCount) ||
      installmentCount < 1 ||
      installmentCount > 36
    ) {
      errors.installmentCount = 'Informe de 1 a 36 parcelas.';
    }
  }

  if (values.categoryId === null) {
    errors.categoryId = 'Selecione uma categoria.';
  }

  if (values.accountId === null) {
    errors.accountId = 'Selecione uma conta.';
  }

  if (!isValidDateInput(values.date)) {
    errors.date = 'Informe uma data válida no formato AAAA-MM-DD.';
  }

  if (!values.status) {
    errors.status = 'Selecione o status.';
  }

  return errors;
}

export function useTransactionForm({
  onSuccess,
  transactionId,
}: TransactionFormProps): UseTransactionFormResult {
  const initialize = useFinanceStore((state) => state.initialize);
  const accounts = useFinanceStore((state) => state.accounts);
  const people = useFinanceStore((state) => state.people);
  const categories = useFinanceStore((state) => state.categories);
  const subcategories = useFinanceStore((state) => state.subcategories);
  const transactions = useFinanceStore((state) => state.transactions);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  const storeError = useFinanceStore((state) => state.error);
  const session = useAuthStore((state) => state.session);

  const [values, setValues] = useState<TransactionFormValues>({
    title: '',
    amount: '',
    type: TransactionType.EXPENSE,
    personId: null,
    installmentCount: '1',
    categoryId: null,
    subcategoryId: null,
    accountId: null,
    date: getTodayDateInput(),
    status: 'paid',
  });
  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!transactionId) {
      return;
    }

    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction) {
      return;
    }

    setValues({
      title: transaction.description ?? '',
      amount: formatCurrencyInput(String(Math.round(transaction.amount * 100))),
      type: transaction.type === TransactionType.TRANSFER ? TransactionType.EXPENSE : transaction.type,
      personId: transaction.person_id,
      installmentCount: String(transaction.installment_count ?? 1),
      categoryId: transaction.category_id,
      subcategoryId: transaction.subcategory_id,
      accountId: transaction.account_id,
      date: formatIsoDateInput(transaction.transaction_date),
      status: transaction.is_paid ? 'paid' : 'pending',
    });
  }, [transactionId, transactions]);

  const accountOptions = useMemo(
    () =>
      accounts.map((account) => ({
        label: account.name,
        value: account.id,
      })),
    [accounts],
  );

  const personOptions = useMemo(
    () =>
      people
        .filter((person) => person.is_active)
        .map((person) => ({
          label: person.name,
          value: person.id,
        })),
    [people],
  );

  const currentUserPersonId = useMemo(
    () =>
      people.find((person) => person.auth_user_id === session?.user.id)?.id ?? null,
    [people, session?.user.id],
  );

  useEffect(() => {
    if (transactionId) {
      return;
    }

    if (currentUserPersonId === null) {
      return;
    }

    setValues((current) =>
      current.personId === null
        ? {
            ...current,
            personId: currentUserPersonId,
          }
        : current,
    );
  }, [currentUserPersonId, transactionId]);

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((category) => category.type === values.type)
        .map((category) => ({
          label: category.name,
          value: category.id,
        })),
    [categories, values.type],
  );

  const subcategoryOptions = useMemo(
    () =>
      subcategories
        .filter((subcategory) => subcategory.category_id === values.categoryId)
        .map((subcategory) => ({
          label: subcategory.name,
          value: subcategory.id,
        })),
    [subcategories, values.categoryId],
  );

  async function submit(): Promise<void> {
    const nextErrors = validate(values, personOptions.length > 0);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        account_id: values.accountId as number,
        person_id: values.personId,
        installment_count:
          values.type === TransactionType.EXPENSE
            ? Number(values.installmentCount)
            : 1,
        category_id: values.categoryId,
        subcategory_id: values.subcategoryId,
        type: values.type,
        amount: parseCurrencyInput(values.amount),
        description: values.title.trim(),
        notes: null,
        is_paid: values.status === 'paid',
        transaction_date: parseDateInputToIso(values.date),
      };

      if (transactionId) {
        await updateTransaction(transactionId, payload);
      } else {
        await addTransaction(payload);
      }

      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function setField<K extends keyof TransactionFormValues>(
    field: K,
    value: TransactionFormValues[K],
  ): void {
    setValues((current) => {
      if (field === 'type') {
        return {
          ...current,
          type: value as TransactionType,
          categoryId: null,
          subcategoryId: null,
        };
      }

      if (field === 'categoryId') {
        return {
          ...current,
          categoryId: value as number | null,
          subcategoryId: null,
        };
      }

      if (field === 'amount') {
        return {
          ...current,
          amount: formatCurrencyInput(value as string),
        };
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    isEditing: Boolean(transactionId),
    accountOptions,
    personOptions,
    categoryOptions,
    subcategoryOptions,
    statusOptions,
    typeOptions,
    setField,
    submit,
  };
}
