import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';

import {
  ColorPickerField,
  FormField,
  FormScreen,
  IconPickerField,
  ModalSelector,
} from '../components/form';
import { AppButton } from '../components/ui';
import { useFinanceStore } from '../store';

interface SubcategoryFormValues {
  categoryId: number | null;
  name: string;
  color: string;
  icon: string;
}

interface SubcategoryFormErrors {
  categoryId?: string;
  name?: string;
}

interface SubcategoryFormScreenProps {
  initialCategoryId?: number;
  subcategoryId?: number;
  onSuccess?: () => void;
}

function validate(values: SubcategoryFormValues): SubcategoryFormErrors {
  const errors: SubcategoryFormErrors = {};

  if (values.categoryId === null) {
    errors.categoryId = 'Selecione a categoria pai.';
  }

  if (!values.name.trim()) {
    errors.name = 'Informe o nome da subcategoria.';
  }

  return errors;
}

export function SubcategoryFormScreen({
  initialCategoryId,
  onSuccess,
  subcategoryId,
}: SubcategoryFormScreenProps): React.JSX.Element {
  const initialize = useFinanceStore((state) => state.initialize);
  const categories = useFinanceStore((state) => state.categories);
  const subcategories = useFinanceStore((state) => state.subcategories);
  const addSubcategory = useFinanceStore((state) => state.addSubcategory);
  const updateSubcategory = useFinanceStore((state) => state.updateSubcategory);
  const removeSubcategory = useFinanceStore((state) => state.removeSubcategory);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<SubcategoryFormValues>({
    categoryId: initialCategoryId ?? null,
    name: '',
    color: '',
    icon: '',
  });
  const [errors, setErrors] = useState<SubcategoryFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const subcategory = subcategoryId
    ? subcategories.find((item) => item.id === subcategoryId) ?? null
    : null;
  const isEditing = Boolean(subcategory);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (subcategory) {
      setValues({
        categoryId: subcategory.category_id,
        name: subcategory.name,
        color: subcategory.color ?? '',
        icon: subcategory.icon ?? '',
      });
      return;
    }

    if (initialCategoryId !== undefined) {
      setValues((current) => ({
        ...current,
        categoryId: current.categoryId ?? initialCategoryId,
      }));
      return;
    }

    if (categories.length > 0) {
      setValues((current) => ({
        ...current,
        categoryId: current.categoryId ?? categories[0].id,
      }));
    }
  }, [categories, initialCategoryId, subcategory]);

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    [categories],
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
      if (subcategory) {
        await updateSubcategory(subcategory.id, {
          category_id: values.categoryId as number,
          name: values.name.trim(),
          color: values.color.trim() || null,
          icon: values.icon.trim() || null,
        });
      } else {
        await addSubcategory({
          category_id: values.categoryId as number,
          name: values.name.trim(),
          color: values.color.trim() || null,
          icon: values.icon.trim() || null,
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
    if (!subcategory) {
      return;
    }

    setIsRemoving(true);
    setSubmitError(null);

    try {
      await removeSubcategory(subcategory.id);
      onSuccess?.();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsRemoving(false);
    }
  }

  if (categories.length === 0) {
    return (
      <FormScreen
        error={submitError}
        onSubmit={() => onSuccess?.()}
        submitLabel="Voltar"
        subtitle="Crie uma categoria antes de adicionar subcategorias."
        title="Nova subcategoria"
      >
        <Text>Você ainda não tem categorias disponíveis para vincular.</Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void handleSubmit()}
      submitLabel={isEditing ? 'Salvar alterações' : 'Salvar subcategoria'}
      subtitle="Crie agrupamentos mais específicos para manter seus lançamentos organizados."
      title={isEditing ? 'Editar subcategoria' : 'Nova subcategoria'}
    >
      <ModalSelector
        error={errors.categoryId}
        label="Categoria pai"
        onSelect={(categoryId) => setValues((current) => ({ ...current, categoryId }))}
        options={categoryOptions}
        placeholder="Selecione uma categoria"
        selectedValue={values.categoryId}
      />

      <FormField
        error={errors.name}
        label="Nome"
        onChangeText={(name) => setValues((current) => ({ ...current, name }))}
        placeholder="Ex.: Supermercado"
        value={values.name}
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
          label={isRemoving ? 'Removendo...' : 'Remover subcategoria'}
          onPress={() => {
            Alert.alert(
              'Remover subcategoria',
              `Deseja remover "${subcategory?.name}"?`,
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
