import React, { useEffect, useState } from 'react';

import { AccountType } from '../database';
import { FormField, FormScreen, OptionItem, OptionSelector } from '../components/form';
import { useFinanceStore } from '../store';

interface AccountFormValues {
  name: string;
  type: AccountType;
  balance: string;
  currency: string;
  color: string;
  icon: string;
}

interface AccountFormErrors {
  name?: string;
  type?: string;
  balance?: string;
  currency?: string;
}

const accountTypeOptions: OptionItem<AccountType>[] = [
  { label: 'Carteira', value: AccountType.CASH },
  { label: 'Corrente', value: AccountType.CHECKING },
  { label: 'Poupança', value: AccountType.SAVINGS },
  { label: 'Cartão', value: AccountType.CREDIT_CARD },
  { label: 'Investimento', value: AccountType.INVESTMENT },
  { label: 'Outro', value: AccountType.OTHER },
];

function validateAccount(values: AccountFormValues): AccountFormErrors {
  const errors: AccountFormErrors = {};
  const balance = Number(values.balance);

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da conta.';
  }

  if (!values.type) {
    errors.type = 'Selecione um tipo de conta.';
  }

  if (Number.isNaN(balance)) {
    errors.balance = 'Informe um saldo inicial válido.';
  }

  if (!values.currency.trim() || values.currency.trim().length !== 3) {
    errors.currency = 'Use uma moeda com 3 letras, como BRL.';
  }

  return errors;
}

export function AccountFormScreen(): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const addAccount = useFinanceStore((state) => state.addAccount);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<AccountFormValues>({
    name: '',
    type: AccountType.CHECKING,
    balance: '0',
    currency: 'BRL',
    color: '',
    icon: '',
  });
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function handleSubmit(): Promise<void> {
    const nextErrors = validateAccount(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addAccount({
        name: values.name.trim(),
        type: values.type,
        balance: Number(values.balance),
        currency: values.currency.trim().toUpperCase(),
        color: values.color.trim() || null,
        icon: values.icon.trim() || null,
        is_active: true,
      });

      setValues({
        name: '',
        type: AccountType.CHECKING,
        balance: '0',
        currency: 'BRL',
        color: '',
        icon: '',
      });
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void handleSubmit()}
      submitLabel="Salvar conta"
      subtitle="Cadastre uma nova conta para acompanhar seu saldo localmente."
      title="Nova conta"
    >
      <FormField
        error={errors.name}
        label="Nome"
        onChangeText={(name) => setValues((current) => ({ ...current, name }))}
        placeholder="Ex.: Conta principal"
        value={values.name}
      />

      <OptionSelector
        error={errors.type}
        label="Tipo de conta"
        onChange={(type) => setValues((current) => ({ ...current, type }))}
        options={accountTypeOptions}
        selectedValue={values.type}
      />

      <FormField
        error={errors.balance}
        keyboardType="numeric"
        label="Saldo inicial"
        onChangeText={(balance) => setValues((current) => ({ ...current, balance }))}
        placeholder="0.00"
        value={values.balance}
      />

      <FormField
        error={errors.currency}
        label="Moeda"
        maxLength={3}
        onChangeText={(currency) => setValues((current) => ({ ...current, currency }))}
        placeholder="BRL"
        value={values.currency}
      />

      <FormField
        hint="Opcional"
        label="Cor"
        onChangeText={(color) => setValues((current) => ({ ...current, color }))}
        placeholder="#D95032"
        value={values.color}
      />

      <FormField
        hint="Opcional"
        label="Ícone"
        onChangeText={(icon) => setValues((current) => ({ ...current, icon }))}
        placeholder="wallet"
        value={values.icon}
      />
    </FormScreen>
  );
}
