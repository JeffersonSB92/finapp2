import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { TransactionType } from '../database';
import {
  ColorPickerField,
  FormField,
  FormScreen,
  IconPickerField,
  OptionItem,
  OptionSelector,
} from '../components/form';
import { AppButton } from '../components/ui';
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
  { label: 'Transferência', value: TransactionType.TRANSFER },
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

interface CategoryFormScreenProps {
  categoryId?: number;
  onSuccess?: () => void;
}

export function CategoryFormScreen({
  categoryId,
  onSuccess,
}: CategoryFormScreenProps): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const categories = useFinanceStore((state) => state.categories);
  const addCategory = useFinanceStore((state) => state.addCategory);
  const removeCategory = useFinanceStore((state) => state.removeCategory);
  const updateCategory = useFinanceStore((state) => state.updateCategory);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<CategoryFormValues>({
    name: '',
    type: TransactionType.EXPENSE,
    color: '',
    icon: '',
  });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const category = categoryId
    ? categories.find((item) => item.id === categoryId) ?? null
    : null;
  const isEditing = Boolean(category);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!category) {
      return;
    }

    setValues({
      name: category.name,
      type: category.type,
      color: category.color ?? '',
      icon: category.icon ?? '',
    });
  }, [category]);

  async function handleSubmit(): Promise<void> {
    const nextErrors = validateCategory(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (category) {
        await updateCategory(category.id, {
          name: values.name.trim(),
          type: values.type,
          color: values.color.trim() || null,
          icon: values.icon.trim() || null,
        });
      } else {
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
      }

      setErrors({});
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(): Promise<void> {
    if (!category) {
      return;
    }

    setIsRemoving(true);
    setSubmitError(null);

    try {
      await removeCategory(category.id);
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
      submitLabel={isEditing ? 'Salvar alterações' : 'Salvar categoria'}
      subtitle="Organize receitas, despesas e transferências com categorias reutilizáveis."
      title={isEditing ? 'Editar categoria' : 'Nova categoria'}
    >
      <FormField
        error={errors.name}
        label="Nome"
        onChangeText={(name) => setValues((current) => ({ ...current, name }))}
        placeholder="Ex.: Alimentação"
        value={values.name}
      />

      <OptionSelector
        error={errors.type}
        label="Tipo"
        onChange={(type) => setValues((current) => ({ ...current, type }))}
        options={categoryTypeOptions}
        selectedValue={values.type}
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

      {isEditing ? (
        <AppButton
          disabled={isRemoving}
          label={isRemoving ? 'Removendo...' : 'Remover categoria'}
          onPress={() => {
            Alert.alert(
              'Remover categoria',
              `Deseja remover "${category?.name}"?`,
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
