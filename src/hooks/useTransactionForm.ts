import { useEffect, useMemo, useState } from 'react';

import { TransactionType } from '../database';
import { useFinanceStore } from '../store';

export type TransactionStatusValue = 'paid' | 'pending';

export interface TransactionFormProps {
  transactionId?: number;
  onSuccess?: () => void;
}

interface TransactionFormValues {
  title: string;
  amount: string;
  type: TransactionType;
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

function formatInputDate(dateIso: string): string {
  return dateIso.slice(0, 10);
}

function getTodayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
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

function validate(values: TransactionFormValues): TransactionFormErrors {
  const errors: TransactionFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Informe um titulo para a transacao.';
  }

  if (parseCurrencyInput(values.amount) <= 0) {
    errors.amount = 'Informe um valor maior que zero.';
  }

  if (!values.type) {
    errors.type = 'Selecione o tipo.';
  }

  if (values.categoryId === null) {
    errors.categoryId = 'Selecione uma categoria.';
  }

  if (values.accountId === null) {
    errors.accountId = 'Selecione uma conta.';
  }

  if (!isValidDateInput(values.date)) {
    errors.date = 'Informe uma data valida no formato AAAA-MM-DD.';
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
  const categories = useFinanceStore((state) => state.categories);
  const subcategories = useFinanceStore((state) => state.subcategories);
  const transactions = useFinanceStore((state) => state.transactions);
  const addTransaction = useFinanceStore((state) => state.addTransaction);
  const updateTransaction = useFinanceStore((state) => state.updateTransaction);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<TransactionFormValues>({
    title: '',
    amount: '',
    type: TransactionType.EXPENSE,
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
      categoryId: transaction.category_id,
      subcategoryId: transaction.subcategory_id,
      accountId: transaction.account_id,
      date: formatInputDate(transaction.transaction_date),
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
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        account_id: values.accountId as number,
        category_id: values.categoryId,
        subcategory_id: values.subcategoryId,
        type: values.type,
        amount: parseCurrencyInput(values.amount),
        description: values.title.trim(),
        notes: null,
        is_paid: values.status === 'paid',
        transaction_date: new Date(`${values.date}T12:00:00.000Z`).toISOString(),
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
    categoryOptions,
    subcategoryOptions,
    statusOptions,
    typeOptions,
    setField,
    submit,
  };
}
