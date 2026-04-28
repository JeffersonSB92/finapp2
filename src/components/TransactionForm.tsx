import React from 'react';

import { useTransactionForm } from '../hooks/useTransactionForm';
import { FormField, FormScreen, ModalSelector, OptionSelector } from './form';

interface TransactionFormProps {
  transactionId?: number;
  onSuccess?: () => void;
}

export function TransactionForm({
  onSuccess,
  transactionId,
}: TransactionFormProps): React.JSX.Element {
  const {
    values,
    errors,
    isSubmitting,
    submitError,
    isEditing,
    accountOptions,
    categoryOptions,
    subcategoryOptions,
    statusOptions,
    typeOptions,
    setField,
    submit,
  } = useTransactionForm({
    transactionId,
    onSuccess,
  });

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void submit()}
      submitLabel={isEditing ? 'Salvar alteracoes' : 'Salvar transacao'}
      subtitle="Preencha os dados e mantenha seu historico sincronizado no banco local."
      title={isEditing ? 'Editar transacao' : 'Nova transacao'}
    >
      <FormField
        error={errors.title}
        label="Titulo"
        onChangeText={(title) => setField('title', title)}
        placeholder="Ex.: Mercado da semana"
        value={values.title}
      />

      <FormField
        error={errors.amount}
        keyboardType="numeric"
        label="Valor"
        onChangeText={(amount) => setField('amount', amount)}
        placeholder="R$ 0,00"
        value={values.amount}
      />

      <OptionSelector
        error={errors.type}
        label="Tipo"
        onChange={(type) => setField('type', type)}
        options={typeOptions}
        selectedValue={values.type}
      />

      <ModalSelector
        error={errors.categoryId}
        label="Categoria"
        onSelect={(categoryId) => setField('categoryId', categoryId)}
        options={categoryOptions}
        placeholder="Selecione uma categoria"
        selectedValue={values.categoryId}
      />

      <ModalSelector
        label="Subcategoria"
        onSelect={(subcategoryId) => setField('subcategoryId', subcategoryId)}
        options={subcategoryOptions}
        placeholder="Selecione uma subcategoria"
        selectedValue={values.subcategoryId}
      />

      <ModalSelector
        error={errors.accountId}
        label="Conta"
        onSelect={(accountId) => setField('accountId', accountId)}
        options={accountOptions}
        placeholder="Selecione uma conta"
        selectedValue={values.accountId}
      />

      <FormField
        error={errors.date}
        label="Data"
        onChangeText={(date) => setField('date', date)}
        placeholder="2026-04-25"
        value={values.date}
      />

      <ModalSelector
        error={errors.status}
        label="Status"
        onSelect={(status) => setField('status', status)}
        options={statusOptions}
        placeholder="Selecione o status"
        selectedValue={values.status}
      />
    </FormScreen>
  );
}
