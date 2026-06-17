import React, { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { TransactionType } from '../database';
import {
  FormField,
  FormScreen,
  ModalSelector,
  OptionItem,
  OptionSelector,
} from '../components/form';
import { AppButton } from '../components/ui';
import { useFinanceStore } from '../store';

interface RecurringEntryFormValues {
  accountId: number | null;
  personId: number | null;
  categoryId: number | null;
  subcategoryId: number | null;
  name: string;
  type: TransactionType;
  groupType: 'fixed' | 'variable';
  amount: string;
  dayOfMonth: string;
  notes: string;
  isActive: boolean;
}

interface RecurringEntryFormErrors {
  amount?: string;
  categoryId?: string;
  dayOfMonth?: string;
  name?: string;
}

interface RecurringEntryFormScreenProps {
  recurringEntryId?: number;
  onSuccess?: () => void;
}

const typeOptions: OptionItem<TransactionType>[] = [
  { label: 'Receita', value: TransactionType.INCOME },
  { label: 'Despesa', value: TransactionType.EXPENSE },
];

const groupTypeOptions: OptionItem<'fixed' | 'variable'>[] = [
  { label: 'Fixa', value: 'fixed' },
  { label: 'Variável', value: 'variable' },
];

const statusOptions: OptionItem<'active' | 'inactive'>[] = [
  { label: 'Ativa', value: 'active' },
  { label: 'Inativa', value: 'inactive' },
];

function validate(values: RecurringEntryFormValues): RecurringEntryFormErrors {
  const errors: RecurringEntryFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome do compromisso.';
  }

  if (values.categoryId === null) {
    errors.categoryId = 'Selecione uma categoria.';
  }

  if (Number(values.amount) <= 0 || Number.isNaN(Number(values.amount))) {
    errors.amount = 'Informe um valor maior que zero.';
  }

  const dayOfMonth = Number(values.dayOfMonth);

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    errors.dayOfMonth = 'Use um dia entre 1 e 31.';
  }

  return errors;
}

export function RecurringEntryFormScreen({
  onSuccess,
  recurringEntryId,
}: RecurringEntryFormScreenProps): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const accounts = useFinanceStore((state) => state.accounts);
  const people = useFinanceStore((state) => state.people);
  const categories = useFinanceStore((state) => state.categories);
  const subcategories = useFinanceStore((state) => state.subcategories);
  const recurringEntries = useFinanceStore((state) => state.recurringEntries);
  const addRecurringEntry = useFinanceStore((state) => state.addRecurringEntry);
  const updateRecurringEntry = useFinanceStore((state) => state.updateRecurringEntry);
  const removeRecurringEntry = useFinanceStore((state) => state.removeRecurringEntry);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<RecurringEntryFormValues>({
    accountId: null,
    personId: null,
    categoryId: null,
    subcategoryId: null,
    name: '',
    type: TransactionType.EXPENSE,
    groupType: 'fixed',
    amount: '',
    dayOfMonth: '5',
    notes: '',
    isActive: true,
  });
  const [errors, setErrors] = useState<RecurringEntryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recurringEntry = recurringEntryId
    ? recurringEntries.find((item) => item.id === recurringEntryId) ?? null
    : null;
  const isEditing = Boolean(recurringEntry);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!recurringEntry) {
      return;
    }

    setValues({
      accountId: recurringEntry.account_id,
      personId: recurringEntry.person_id,
      categoryId: recurringEntry.category_id,
      subcategoryId: recurringEntry.subcategory_id,
      name: recurringEntry.name,
      type: recurringEntry.type,
      groupType: recurringEntry.group_type,
      amount: String(recurringEntry.amount),
      dayOfMonth: String(recurringEntry.day_of_month),
      notes: recurringEntry.notes ?? '',
      isActive: recurringEntry.is_active,
    });
  }, [recurringEntry]);

  const accountOptions = useMemo(
    () =>
      accounts.filter((account) => account.is_active).map((account) => ({
        label: account.name,
        value: account.id,
      })),
    [accounts],
  );
  const personOptions = useMemo(
    () =>
      people.filter((person) => person.is_active).map((person) => ({
        label: person.name,
        value: person.id,
      })),
    [people],
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

  async function handleSubmit(): Promise<void> {
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        account_id: values.accountId,
        person_id: values.personId,
        category_id: values.categoryId,
        subcategory_id: values.subcategoryId,
        name: values.name.trim(),
        type: values.type,
        group_type: values.groupType,
        amount: Number(values.amount),
        day_of_month: Number(values.dayOfMonth),
        notes: values.notes.trim() || null,
        is_active: values.isActive,
      };

      if (recurringEntry) {
        await updateRecurringEntry(recurringEntry.id, payload);
      } else {
        await addRecurringEntry(payload);
      }

      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(): Promise<void> {
    if (!recurringEntry) {
      return;
    }

    setIsRemoving(true);
    setSubmitError(null);

    try {
      await removeRecurringEntry(recurringEntry.id);
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void handleSubmit()}
      submitLabel={isEditing ? 'Salvar alterações' : 'Salvar recorrência'}
      subtitle="Cadastre salários, contas fixas e previsões variáveis para montar o saldo projetado do mês."
      title={isEditing ? 'Editar recorrência' : 'Nova recorrência'}
    >
      <FormField
        error={errors.name}
        label="Nome"
        onChangeText={(name) => setValues((current) => ({ ...current, name }))}
        placeholder="Ex.: Salário Jefferson"
        value={values.name}
      />

      <OptionSelector
        label="Tipo"
        onChange={(type) =>
          setValues((current) => ({
            ...current,
            type,
            categoryId: null,
            subcategoryId: null,
          }))
        }
        options={typeOptions}
        selectedValue={values.type}
      />

      <OptionSelector
        label="Classificação"
        onChange={(groupType) => setValues((current) => ({ ...current, groupType }))}
        options={groupTypeOptions}
        selectedValue={values.groupType}
      />

      <FormField
        error={errors.amount}
        keyboardType="numeric"
        label="Valor"
        onChangeText={(amount) => setValues((current) => ({ ...current, amount }))}
        placeholder="0.00"
        value={values.amount}
      />

      <FormField
        error={errors.dayOfMonth}
        keyboardType="numeric"
        label="Dia do mês"
        onChangeText={(dayOfMonth) =>
          setValues((current) => ({ ...current, dayOfMonth }))
        }
        placeholder="5"
        value={values.dayOfMonth}
      />

      <ModalSelector
        error={errors.categoryId}
        label="Categoria"
        onSelect={(categoryId) =>
          setValues((current) => ({ ...current, categoryId, subcategoryId: null }))
        }
        options={categoryOptions}
        placeholder="Selecione uma categoria"
        selectedValue={values.categoryId}
      />

      <ModalSelector
        label="Subcategoria"
        onSelect={(subcategoryId) =>
          setValues((current) => ({ ...current, subcategoryId }))
        }
        options={subcategoryOptions}
        placeholder="Selecione uma subcategoria"
        selectedValue={values.subcategoryId}
      />

      <ModalSelector
        label="Pessoa responsável"
        onSelect={(personId) => setValues((current) => ({ ...current, personId }))}
        options={personOptions}
        placeholder="Opcional"
        selectedValue={values.personId}
      />

      <ModalSelector
        label="Conta"
        onSelect={(accountId) => setValues((current) => ({ ...current, accountId }))}
        options={accountOptions}
        placeholder="Opcional"
        selectedValue={values.accountId}
      />

      <FormField
        label="Observações"
        onChangeText={(notes) => setValues((current) => ({ ...current, notes }))}
        placeholder="Opcional"
        value={values.notes}
      />

      <OptionSelector
        label="Status"
        onChange={(status) =>
          setValues((current) => ({
            ...current,
            isActive: status === 'active',
          }))
        }
        options={statusOptions}
        selectedValue={values.isActive ? 'active' : 'inactive'}
      />

      {isEditing ? (
        <AppButton
          disabled={isRemoving}
          label={isRemoving ? 'Removendo...' : 'Remover recorrência'}
          onPress={() => {
            Alert.alert(
              'Remover recorrência',
              `Deseja remover "${recurringEntry?.name}"?`,
              [
                {
                  text: 'Cancelar',
                  style: 'cancel',
                },
                {
                  text: 'Remover',
                  style: 'destructive',
                  onPress: () => {
                    void handleRemove();
                  },
                },
              ],
            );
          }}
          variant="secondary"
        />
      ) : null}
    </FormScreen>
  );
}
