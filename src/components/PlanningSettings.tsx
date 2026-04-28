import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { usePlanningSettings } from '../hooks/usePlanningSettings';
import { theme } from '../theme/theme';
import { FormField, FormScreen } from './form';

function getTotalColor(
  isBalanced: boolean,
  isOverLimit: boolean,
): string {
  if (isBalanced) {
    return theme.colors.status.success;
  }

  if (isOverLimit) {
    return theme.colors.status.error;
  }

  return theme.colors.brand.primary;
}

export function PlanningSettings(): React.JSX.Element {
  const {
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
  } = usePlanningSettings();

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void submit()}
      submitLabel="Salvar planejamento"
      subtitle="Ajuste sua distribuicao ideal e acompanhe o equilibrio financeiro em tempo real."
      title="Planejamento financeiro"
    >
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Equilibrio atual</Text>
          <Text
            style={[
              styles.heroValue,
              { color: getTotalColor(isBalanced, isOverLimit) },
            ]}
          >
            {totalPercentage}%
          </Text>
        </View>

        <View style={styles.progressBase}>
          {metrics.map((metric) => (
            <View
              key={metric.id}
              style={[
                styles.progressSegment,
                {
                  width: `${Math.max(metric.value, 0)}%`,
                  backgroundColor: metric.color,
                },
              ]}
            />
          ))}
        </View>

        {totalPercentage > 100 ? (
          <View
            style={[
              styles.progressOverflow,
              { width: `${Math.min(totalPercentage - 100, 100)}%` },
            ]}
          />
        ) : null}

        <View style={styles.metricsGrid}>
          {metrics.map((metric) => (
            <View key={metric.id} style={styles.metricCard}>
              <View
                style={[styles.metricDot, { backgroundColor: metric.color }]}
              />
              <Text style={styles.metricTitle}>{metric.label}</Text>
              <Text style={styles.metricValue}>{metric.value}%</Text>
            </View>
          ))}
        </View>

        <Text
          style={[
            styles.balanceText,
            { color: getTotalColor(isBalanced, isOverLimit) },
          ]}
        >
          {isBalanced
            ? 'Distribuicao equilibrada em 100%.'
            : isOverLimit
              ? `Voce ultrapassou o limite em ${Math.abs(remainingPercentage)}%.`
              : `Faltam ${remainingPercentage}% para completar seu plano.`}
        </Text>

        {errors.total ? <Text style={styles.errorText}>{errors.total}</Text> : null}
      </View>

      <FormField
        error={errors.essential}
        keyboardType="numeric"
        label="Essencial (%)"
        onChangeText={(value) => setField('essential', value)}
        placeholder="50"
        value={values.essential}
      />

      <FormField
        error={errors.nonEssential}
        keyboardType="numeric"
        label="Nao essencial (%)"
        onChangeText={(value) => setField('nonEssential', value)}
        placeholder="30"
        value={values.nonEssential}
      />

      <FormField
        error={errors.savings}
        keyboardType="numeric"
        label="Reserva (%)"
        onChangeText={(value) => setField('savings', value)}
        placeholder="20"
        value={values.savings}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  heroValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  progressBase: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radii.pill,
    flexDirection: 'row',
    height: 16,
    overflow: 'hidden',
    width: '100%',
  },
  progressSegment: {
    height: '100%',
  },
  progressOverflow: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.radii.pill,
    height: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.radii.lg,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  metricDot: {
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  metricTitle: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  balanceText: {
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  errorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});

