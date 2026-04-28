import { useEffect, useMemo, useState } from 'react';

import { useFinanceStore } from '../store';

interface PlanningSettingsFormValues {
  essential: string;
  nonEssential: string;
  savings: string;
}

interface PlanningSettingsFormErrors {
  essential?: string;
  nonEssential?: string;
  savings?: string;
  total?: string;
}

export interface PlanningMetricItem {
  id: 'essential' | 'nonEssential' | 'savings';
  label: string;
  value: number;
  color: string;
}

export interface UsePlanningSettingsResult {
  values: PlanningSettingsFormValues;
  errors: PlanningSettingsFormErrors;
  totalPercentage: number;
  remainingPercentage: number;
  isBalanced: boolean;
  isOverLimit: boolean;
  metrics: PlanningMetricItem[];
  isSubmitting: boolean;
  submitError: string | null;
  setField: (
    field: keyof PlanningSettingsFormValues,
    value: string,
  ) => void;
  submit: () => Promise<void>;
}

function sanitizePercentageInput(value: string): string {
  return value.replace(/[^0-9.,]/g, '').replace(',', '.');
}

function toNumber(value: string): number {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
}

function validatePercentage(value: string): boolean {
  const numericValue = Number(value);
  return !Number.isNaN(numericValue) && numericValue >= 0 && numericValue <= 100;
}

function validatePlanningSettings(
  values: PlanningSettingsFormValues,
): PlanningSettingsFormErrors {
  const errors: PlanningSettingsFormErrors = {};

  if (!validatePercentage(values.essential)) {
    errors.essential = 'Informe um percentual entre 0 e 100.';
  }

  if (!validatePercentage(values.nonEssential)) {
    errors.nonEssential = 'Informe um percentual entre 0 e 100.';
  }

  if (!validatePercentage(values.savings)) {
    errors.savings = 'Informe um percentual entre 0 e 100.';
  }

  if (Object.keys(errors).length > 0) {
    return errors;
  }

  const total =
    Number(values.essential) +
    Number(values.nonEssential) +
    Number(values.savings);

  if (total !== 100) {
    errors.total = 'A soma precisa ser exatamente 100%.';
  }

  return errors;
}

export function usePlanningSettings(): UsePlanningSettingsResult {
  const initialize = useFinanceStore((state) => state.initialize);
  const planningSettings = useFinanceStore((state) => state.planningSettings);
  const savePlanningSettings = useFinanceStore((state) => state.savePlanningSettings);
  const storeError = useFinanceStore((state) => state.error);

  const [values, setValues] = useState<PlanningSettingsFormValues>({
    essential: '50',
    nonEssential: '30',
    savings: '20',
  });
  const [errors, setErrors] = useState<PlanningSettingsFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!planningSettings) {
      return;
    }

    setValues({
      essential: String(planningSettings.essential_percentage),
      nonEssential: String(planningSettings.non_essential_percentage),
      savings: String(planningSettings.savings_percentage),
    });
  }, [planningSettings]);

  const totalPercentage = useMemo(
    () =>
      toNumber(values.essential) +
      toNumber(values.nonEssential) +
      toNumber(values.savings),
    [values.essential, values.nonEssential, values.savings],
  );

  const remainingPercentage = 100 - totalPercentage;
  const isBalanced = totalPercentage === 100;
  const isOverLimit = totalPercentage > 100;

  const metrics = useMemo<PlanningMetricItem[]>(
    () => [
      {
        id: 'essential',
        label: 'Essencial',
        value: toNumber(values.essential),
        color: '#E26B50',
      },
      {
        id: 'nonEssential',
        label: 'Nao essencial',
        value: toNumber(values.nonEssential),
        color: '#B7422B',
      },
      {
        id: 'savings',
        label: 'Reserva',
        value: toNumber(values.savings),
        color: '#2E8B57',
      },
    ],
    [values.essential, values.nonEssential, values.savings],
  );

  async function submit(): Promise<void> {
    const nextErrors = validatePlanningSettings(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await savePlanningSettings({
        essential_percentage: Number(values.essential),
        non_essential_percentage: Number(values.nonEssential),
        savings_percentage: Number(values.savings),
      });
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : storeError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function setField(
    field: keyof PlanningSettingsFormValues,
    value: string,
  ): void {
    setValues((current) => ({
      ...current,
      [field]: sanitizePercentageInput(value),
    }));
  }

  return {
    values,
    errors,
    totalPercentage,
    remainingPercentage,
    isBalanced,
    isOverLimit,
    metrics,
    isSubmitting,
    submitError,
    setField,
    submit,
  };
}

