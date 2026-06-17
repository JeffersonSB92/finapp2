import React, { useEffect, useState } from 'react';

import { AccountType } from '../database';
import {
  ColorPickerField,
  FormField,
  FormScreen,
  IconPickerField,
  ModalSelector,
  OptionItem,
  OptionSelector,
} from '../components/form';
import { useFinanceStore } from '../store';
import { useAuthStore } from '../store/authStore';

interface AccountFormValues {
  name: string;
  type: AccountType;
  ownerPersonId: number | null;
  balance: string;
  currency: string;
  color: string;
  icon: string;
}

interface AccountFormErrors {
  name?: string;
  type?: string;
  ownerPersonId?: string;
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

function validateAccount(
  values: AccountFormValues,
  requiresOwner: boolean,
): AccountFormErrors {
  const errors: AccountFormErrors = {};
  const balance = Number(values.balance);

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da conta.';
  }

  if (!values.type) {
    errors.type = 'Selecione um tipo de conta.';
  }

  if (requiresOwner && values.ownerPersonId === null) {
    errors.ownerPersonId = 'Selecione a pessoa dona da conta.';
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
  const people = useFinanceStore((state) => state.people);
  const addAccount = useFinanceStore((state) => state.addAccount);
  const storeError = useFinanceStore((state) => state.error);
  const session = useAuthStore((state) => state.session);

  const [values, setValues] = useState<AccountFormValues>({
    name: '',
    type: AccountType.CHECKING,
    ownerPersonId: null,
    balance: '0',
    currency: 'BRL',
    color: '',
    icon: '',
  });
  const [errors, setErrors] = useState<AccountFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const personOptions = people
    .filter((person) => person.is_active)
    .map((person) => ({
      label: person.name,
      value: person.id,
    }));

  const currentUserPersonId =
    people.find((person) => person.auth_user_id === session?.user.id)?.id ?? null;

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (currentUserPersonId === null) {
      return;
    }

    setValues((current) =>
      current.ownerPersonId === null
        ? {
            ...current,
            ownerPersonId: currentUserPersonId,
          }
        : current,
    );
  }, [currentUserPersonId]);

  async function handleSubmit(): Promise<void> {
    const nextErrors = validateAccount(values, personOptions.length > 0);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addAccount({
        owner_person_id: values.ownerPersonId,
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
        ownerPersonId: null,
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

      <ModalSelector
        error={errors.ownerPersonId}
        label="Pessoa dona da conta"
        onSelect={(ownerPersonId) =>
          setValues((current) => ({ ...current, ownerPersonId }))
        }
        options={personOptions}
        placeholder="Selecione uma pessoa"
        selectedValue={values.ownerPersonId}
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

      <ColorPickerField
        hint="Opcional"
        label="Cor"
        onChange={(color) => setValues((current) => ({ ...current, color }))}
        value={values.color}
      />

      <IconPickerField
        hint="Opcional"
        label="Ícone"
        onChange={(icon) => setValues((current) => ({ ...current, icon }))}
        value={values.icon}
      />
    </FormScreen>
  );
}
