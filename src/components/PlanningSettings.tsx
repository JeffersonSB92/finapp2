import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { usePlanningSettings } from '../hooks/usePlanningSettings';
import { theme } from '../theme/theme';
import { FormField, FormScreen } from './form';
import { AppCard } from './ui';

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

function getBalanceMessage(
  isBalanced: boolean,
  isOverLimit: boolean,
  remainingPercentage: number,
): string {
  if (isBalanced) {
    return 'Distribuição equilibrada em 100%.';
  }

  if (isOverLimit) {
    return `A distribuição excede 100% em ${Math.abs(remainingPercentage)}%.`;
  }

  return `Faltam ${remainingPercentage}% para fechar sua distribuição em 100%.`;
}

export function PlanningSettings(): React.JSX.Element {
  const { width } = useWindowDimensions();
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

  const isCompactLayout = width < 420;

  return (
    <FormScreen
      error={submitError}
      isSubmitting={isSubmitting}
      onSubmit={() => void submit()}
      submitLabel="Salvar planejamento"
      subtitle="Defina sua distribuição ideal e acompanhe o equilíbrio do plano em tempo real."
      title="Planejamento financeiro"
    >
      <AppCard style={styles.heroCard}>
        <View style={[styles.heroHeader, isCompactLayout ? styles.heroHeaderCompact : null]}>
          <View style={styles.heroHeading}>
            <Text style={styles.heroLabel}>Equilíbrio atual</Text>
            <Text style={styles.heroDescription}>
              Distribuição percentual do seu planejamento
            </Text>
          </View>

          <View style={styles.totalPill}>
            <Text style={styles.totalPillLabel}>Total</Text>
            <Text
              style={[
                styles.totalPillValue,
                { color: getTotalColor(isBalanced, isOverLimit) },
              ]}
            >
              {totalPercentage}%
            </Text>
          </View>
        </View>

        <View style={styles.progressWrapper}>
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
        </View>

        <View style={[styles.metricsGrid, isCompactLayout ? styles.metricsColumn : null]}>
          {metrics.map((metric) => (
            <View
              key={metric.id}
              style={[styles.metricCard, isCompactLayout ? styles.metricCardCompact : null]}
            >
              <View
                style={[styles.metricDot, { backgroundColor: metric.color }]}
              />
              <Text numberOfLines={2} style={styles.metricTitle}>
                {metric.label}
              </Text>
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
          {getBalanceMessage(isBalanced, isOverLimit, remainingPercentage)}
        </Text>

        {errors.total ? <Text style={styles.errorText}>{errors.total}</Text> : null}
      </AppCard>

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
        label="Não essencial (%)"
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
    gap: theme.spacing.lg,
  },
  heroHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  heroHeaderCompact: {
    flexDirection: 'column',
  },
  heroHeading: {
    flex: 1,
    gap: 2,
  },
  heroLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  heroDescription: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  totalPill: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: 2,
    minWidth: 104,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  totalPillLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  totalPillValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
  },
  progressWrapper: {
    gap: theme.spacing.xs,
  },
  progressBase: {
    backgroundColor: theme.colors.background.surfaceSoft,
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
  metricsColumn: {
    flexDirection: 'column',
  },
  metricCard: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    minHeight: 112,
    padding: theme.spacing.md,
  },
  metricCardCompact: {
    minHeight: 0,
  },
  metricDot: {
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  metricTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
    marginTop: 'auto',
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
