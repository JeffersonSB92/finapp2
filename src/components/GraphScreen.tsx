import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useCategoryBreakdown } from '../hooks/useCategoryBreakdown';
import { useMonthlySummary } from '../hooks/useMonthlySummary';
import { theme } from '../theme/theme';

const CHART_SIZE = 188;
const STROKE_WIDTH = 26;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatShortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
}

function shiftMonth(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function getTrendColor(direction: 'up' | 'down' | 'stable', positiveUp = true): string {
  if (direction === 'stable') {
    return theme.colors.text.secondary;
  }

  if (direction === 'up') {
    return positiveUp ? theme.colors.status.success : theme.colors.status.error;
  }

  return positiveUp ? theme.colors.status.error : theme.colors.status.success;
}

function getTrendArrow(direction: 'up' | 'down' | 'stable'): string {
  if (direction === 'up') {
    return '+';
  }

  if (direction === 'down') {
    return '-';
  }

  return '=';
}

function buildStrokeOffset(percentageBefore: number): number {
  return CIRCUMFERENCE - (percentageBefore / 100) * CIRCUMFERENCE;
}

export function GraphScreen(): React.JSX.Element {
  const [referenceDate, setReferenceDate] = useState<Date>(
    new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)),
  );

  const {
    bars,
    totalDespesas,
    totalReceitas,
    saldo,
    revenueTrend,
    expenseTrend,
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useMonthlySummary({ referenceDate });

  const {
    slices,
    totalAmount,
    totalCategories,
    highlightLabel,
    trend: categoryTrend,
    isLoading: categoryLoading,
    error: categoryError,
  } = useCategoryBreakdown({ referenceDate });

  const isLoading = monthlyLoading || categoryLoading;
  const error = monthlyError ?? categoryError;

  const monthLabel = useMemo(() => formatMonthLabel(referenceDate), [referenceDate]);
  const monthShortLabel = useMemo(
    () => formatShortMonthLabel(referenceDate),
    [referenceDate],
  );

  let percentageBefore = 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.monthChip}>
            <Text style={styles.monthChipText}>{monthShortLabel}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Analise Financeira</Text>
            <Text style={styles.title}>Leitura visual do mes</Text>
            <Text style={styles.subtitle}>{monthLabel}</Text>
          </View>
        </View>

        <View style={styles.navigation}>
          <Pressable
            onPress={() => setReferenceDate((current) => shiftMonth(current, -1))}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>{'<'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setReferenceDate((current) => shiftMonth(current, 1))}
            style={styles.navButton}
          >
            <Text style={styles.navButtonText}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      {error && !isLoading ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>Carregando analise financeira...</Text>
        </View>
      ) : null}

      {!isLoading ? <View style={styles.graphCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardEyebrow}>Resumo mensal</Text>
            <Text style={styles.cardTitle}>Receita vs despesa</Text>
          </View>
          <Text style={styles.cardValue}>{saldo}</Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricPill}>
            <View
              style={[styles.metricDot, { backgroundColor: theme.colors.status.success }]}
            />
            <Text style={styles.metricLabel}>Receitas</Text>
            <Text style={[styles.metricValue, { color: theme.colors.status.success }]}>
              {totalReceitas}
            </Text>
            <Text
              style={[
                styles.metricTrend,
                { color: getTrendColor(revenueTrend.direction, true) },
              ]}
            >
              {getTrendArrow(revenueTrend.direction)} {revenueTrend.label} {revenueTrend.value}
            </Text>
          </View>

          <View style={styles.metricPill}>
            <View
              style={[styles.metricDot, { backgroundColor: theme.colors.brand.primary }]}
            />
            <Text style={styles.metricLabel}>Despesas</Text>
            <Text style={[styles.metricValue, { color: theme.colors.brand.primary }]}>
              {totalDespesas}
            </Text>
            <Text
              style={[
                styles.metricTrend,
                { color: getTrendColor(expenseTrend.direction, false) },
              ]}
            >
              {getTrendArrow(expenseTrend.direction)} {expenseTrend.label} {expenseTrend.value}
            </Text>
          </View>
        </View>

        <View style={styles.chartArea}>
          {bars.map((bar) => (
            <View key={bar.monthKey} style={styles.barGroup}>
              <View
                style={[
                  styles.barTrack,
                  bar.isCurrentMonth ? styles.barTrackActive : null,
                ]}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: bar.receitasHeight,
                      backgroundColor: theme.colors.status.success,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: bar.despesasHeight,
                      backgroundColor: theme.colors.brand.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[styles.barLabel, bar.isCurrentMonth ? styles.barLabelActive : null]}
              >
                {bar.monthLabel}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.colors.status.success }]}
            />
            <Text style={styles.legendText}>Receitas</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: theme.colors.brand.primary }]}
            />
            <Text style={styles.legendText}>Despesas</Text>
          </View>
        </View>
      </View> : null}

      {!isLoading ? <View style={styles.graphCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardEyebrow}>Distribuicao</Text>
            <Text style={styles.cardTitle}>Gastos por categoria</Text>
          </View>
          <Text style={styles.cardValue}>{totalAmount}</Text>
        </View>

        <View style={styles.breakdownMeta}>
          <Text style={styles.breakdownHighlight}>{highlightLabel}</Text>
          <Text
            style={[
              styles.metricTrend,
              { color: getTrendColor(categoryTrend.direction, false) },
            ]}
          >
            {getTrendArrow(categoryTrend.direction)} {categoryTrend.label} {categoryTrend.value}
          </Text>
        </View>

        <View style={styles.pieSection}>
          <View style={styles.chartWrapper}>
            <Svg
              width={CHART_SIZE}
              height={CHART_SIZE}
              viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
            >
              <Circle
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                stroke={theme.colors.background.primary}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />

              {slices.map((slice) => {
                const segment = (
                  <Circle
                    key={slice.id}
                    cx={CHART_SIZE / 2}
                    cy={CHART_SIZE / 2}
                    r={RADIUS}
                    stroke={slice.color}
                    strokeWidth={STROKE_WIDTH}
                    fill="transparent"
                    strokeDasharray={`${
                      (slice.percentage / 100) * CIRCUMFERENCE
                    } ${CIRCUMFERENCE}`}
                    strokeDashoffset={buildStrokeOffset(percentageBefore)}
                    rotation={-90}
                    origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}
                  />
                );

                percentageBefore += slice.percentage;
                return segment;
              })}
            </Svg>

            <View style={styles.chartCenter}>
              <Text style={styles.centerLabel}>Categorias</Text>
              <Text style={styles.centerValue}>{totalCategories}</Text>
            </View>
          </View>

          <View style={styles.breakdownLegend}>
            {slices.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum gasto por categoria neste mes.</Text>
            ) : (
              slices.map((slice) => (
                <View key={slice.id} style={styles.breakdownItem}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <View style={styles.breakdownText}>
                    <Text style={styles.breakdownTitle}>{slice.label}</Text>
                    <Text style={styles.breakdownSubtitle}>
                      {slice.percentage.toFixed(1)}% • {slice.formattedAmount}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </View> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  monthChip: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  monthChipText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    letterSpacing: 1.2,
    lineHeight: theme.fonts.lineHeight.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    letterSpacing: 1.1,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    textTransform: 'capitalize',
  },
  navigation: {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.xs,
  },
  navButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.radii.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  feedbackCard: {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
  },
  errorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  feedbackText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  graphCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  cardEyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    marginTop: theme.spacing.xs,
  },
  cardValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  metricPill: {
    backgroundColor: theme.colors.background.primary,
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
  metricLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  metricValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  metricTrend: {
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  chartArea: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 180,
  },
  barGroup: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: 48,
  },
  barTrack: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: 6,
    height: 164,
    justifyContent: 'center',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    width: '100%',
  },
  barTrackActive: {
    borderColor: theme.colors.border.strong,
    borderWidth: 1,
  },
  bar: {
    borderRadius: theme.radii.pill,
    width: 14,
  },
  barLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'capitalize',
  },
  barLabelActive: {
    color: theme.colors.text.primary,
  },
  legendRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  legendDot: {
    borderRadius: theme.radii.pill,
    height: 12,
    width: 12,
  },
  legendText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  breakdownMeta: {
    gap: theme.spacing.xs,
  },
  breakdownHighlight: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  pieSection: {
    gap: theme.spacing.xl,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenter: {
    alignItems: 'center',
    position: 'absolute',
  },
  centerLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  centerValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    marginTop: theme.spacing.xs,
  },
  breakdownLegend: {
    gap: theme.spacing.sm,
  },
  breakdownItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  breakdownText: {
    flex: 1,
  },
  breakdownTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  breakdownSubtitle: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    marginTop: 2,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
});
