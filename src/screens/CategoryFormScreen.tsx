import React, { useEffect, useState } from 'react';

import { TransactionType } from '../database';
import { FormField, FormScreen, OptionItem, OptionSelector } from '../components/form';
import { useFinanceStore } from '../store';

interface CategoryFormValues {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

interface CategoryFormErrors {
  name?: string;
  type?: string;
}

const categoryTypeOptions: OptionItem<TransactionType>[] = [
  { label: 'Receita', value: TransactionType.INCOME },
  { label: 'Despesa', value: TransactionType.EXPENSE },
  { label: 'Transferencia', value: TransactionType.TRANSFER },
];

function validateCategory(values: CategoryFormValues): CategoryFormErrors {
  const errors: CategoryFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da categoria.';
  }

  if (!values.type) {
    errors.type = 'Selecione um tipo.';
  }

  return errors;
}

export function CategoryFormScreen(): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const addCategory = useFinanceStore((state) => state.addCategory);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<CategoryFormValues>({
    name: '',
    type: TransactionType.EXPENSE,
    color: '',
    icon: '',
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function handleSubmit(): Promise<void> {
    const nextErrors = validateCategory(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await addCategory({
        name: values.name.trim(),
        type: values.type,
        color: values.color.trim() || null,
        icon: values.icon.trim() || null,
        is_system: false,
      });

      setValues({
        name: '',
        type: TransactionType.EXPENSE,
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
      submitLabel="Salvar categoria"
      subtitle="Organize receitas, despesas e transferencias com categorias reutilizaveis."
      title="Nova categoria"
    >
      <FormField
        error={errors.name}
        label="Nome"
        onChangeText={(name) => setValues((current) => ({ ...current, name }))}
        placeholder="Ex.: Alimentacao"
        value={values.name}
      />

      <OptionSelector
        error={errors.type}
        label="Tipo"
        onChange={(type) => setValues((current) => ({ ...current, type }))}
        options={categoryTypeOptions}
        selectedValue={values.type}
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
        label="Icone"
        onChangeText={(icon) => setValues((current) => ({ ...current, icon }))}
        placeholder="shopping-bag"
        value={values.icon}
      />
    </FormScreen>
  );
}

