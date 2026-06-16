import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useCategoryBreakdown } from '../hooks/useCategoryBreakdown';
import { useMonthlySummary } from '../hooks/useMonthlySummary';
import { theme } from '../theme/theme';
import { createMonthDate, getCurrentMonthDate } from '../utils/date';
import { MonthSelector } from './MonthSelector';
import { AppCard, EmptyState } from './ui';

const CHART_SIZE = 196;
const STROKE_WIDTH = 24;
const INNER_RING_SIZE = 106;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatShortMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
  })
    .format(date)
    .replace('.', '')
    .toUpperCase();
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
  const [referenceDate, setReferenceDate] = useState<Date>(getCurrentMonthDate());
  const { width } = useWindowDimensions();

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
  const isCompactLayout = width < 420;
  const isSingleColumnLayout = width < 760;
  const hasMonthlyData = bars.some((bar) => bar.receitas > 0 || bar.despesas > 0);
  const hasCategoryData = slices.length > 0;
  const hasAnalysisData = hasMonthlyData || hasCategoryData;
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
      <View style={[styles.header, isCompactLayout ? styles.headerCompact : null]}>
        <View style={styles.headerContent}>
          <View style={styles.monthChip}>
            <Text style={styles.monthChipText}>{monthShortLabel}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Análise</Text>
            <Text style={styles.title}>Dashboard financeiro</Text>
            <Text style={styles.subtitle}>
              Compare entradas, saídas e distribuição por categoria.
            </Text>
            <MonthSelector
              onSelectMonth={(date) =>
                setReferenceDate(createMonthDate(date.getFullYear(), date.getMonth()))
              }
              selectedDate={referenceDate}
            />
          </View>
        </View>
      </View>

      {error && !isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      {isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.feedbackText}>Carregando análise financeira...</Text>
        </AppCard>
      ) : null}

      {!isLoading && !hasAnalysisData ? (
        <EmptyState
          description="Cadastre transações no mês selecionado para preencher o resumo, os gráficos e a distribuição por categoria."
          eyebrow="Sem dados de análise"
          icon="bar-chart-2"
          title="Ainda não há dados suficientes"
        />
      ) : null}

      {!isLoading && hasAnalysisData ? (
        <AppCard style={styles.summaryCard}>
          <View style={[styles.cardHeader, isCompactLayout ? styles.cardHeaderCompact : null]}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardEyebrow}>Resumo mensal</Text>
              <Text style={styles.cardTitle}>Receita vs despesa</Text>
            </View>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillLabel}>Saldo do mês</Text>
              <Text style={styles.totalPillValue}>{saldo}</Text>
            </View>
          </View>

          <View
            style={[
              styles.metricsRow,
              isSingleColumnLayout ? styles.metricsColumn : null,
            ]}
          >
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View
                  style={[
                    styles.metricDot,
                    { backgroundColor: theme.colors.status.success },
                  ]}
                />
                <Text style={styles.metricLabel}>Receitas</Text>
              </View>
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

            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <View
                  style={[
                    styles.metricDot,
                    { backgroundColor: theme.colors.brand.primary },
                  ]}
                />
                <Text style={styles.metricLabel}>Despesas</Text>
              </View>
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

          <View style={styles.chartCard}>
            <View style={styles.chartTitleRow}>
              <View style={styles.cardHeading}>
                <Text style={styles.cardEyebrow}>Gráfico mensal</Text>
                <Text style={styles.chartTitle}>Panorama dos últimos meses</Text>
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
                        styles.incomeBar,
                        {
                          height: Math.max(bar.receitasHeight, 6),
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.expenseBar,
                        {
                          height: Math.max(bar.despesasHeight, 6),
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
          </View>
        </AppCard>
      ) : null}

      {!isLoading && hasAnalysisData ? (
        <AppCard style={styles.categoryCard}>
          <View style={[styles.cardHeader, isCompactLayout ? styles.cardHeaderCompact : null]}>
            <View style={styles.cardHeading}>
              <Text style={styles.cardEyebrow}>Gastos por categoria</Text>
              <Text style={styles.cardTitle}>Distribuição das despesas</Text>
            </View>
            <View style={styles.totalPill}>
              <Text style={styles.totalPillLabel}>Total</Text>
              <Text style={styles.totalPillValue}>{totalAmount}</Text>
            </View>
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

          <View
            style={[
              styles.pieSection,
              isSingleColumnLayout ? styles.pieSectionCompact : null,
            ]}
          >
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
                  stroke={theme.colors.background.surfaceSoft}
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
                      strokeLinecap="round"
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
                <View style={styles.chartCenterInner}>
                  <Text style={styles.centerLabel}>Categorias</Text>
                  <Text style={styles.centerValue}>{totalCategories}</Text>
                  <Text numberOfLines={1} style={styles.centerHelper}>
                    {totalAmount}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.breakdownLegend}>
              {slices.length === 0 ? (
                <EmptyState
                  description="Assim que houver despesas categorizadas, a distribuição aparecerá aqui."
                  eyebrow="Sem categorias"
                  icon="pie-chart"
                  style={styles.emptyState}
                  title="Nenhum gasto por categoria neste mês"
                />
              ) : (
                slices.map((slice) => (
                  <View key={slice.id} style={styles.breakdownItem}>
                    <View style={styles.breakdownLeading}>
                      <View
                        style={[styles.legendDot, { backgroundColor: slice.color }]}
                      />
                      <View style={styles.breakdownText}>
                        <Text numberOfLines={1} style={styles.breakdownTitle}>
                          {slice.label}
                        </Text>
                        <Text style={styles.breakdownPercentage}>
                          {slice.percentage.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    <Text numberOfLines={1} style={styles.breakdownAmount}>
                      {slice.formattedAmount}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </AppCard>
      ) : null}
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
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  headerCompact: {
    alignItems: 'flex-start',
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
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  summaryCard: {
    gap: theme.spacing.lg,
  },
  categoryCard: {
    gap: theme.spacing.lg,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardHeaderCompact: {
    flexDirection: 'column',
  },
  cardHeading: {
    flex: 1,
    gap: theme.spacing.xxs,
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
  },
  totalPill: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: 2,
    minWidth: 116,
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
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  metricsRow: {
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
    padding: theme.spacing.md,
  },
  metricHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  metricDot: {
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  metricLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  metricValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
  },
  metricTrend: {
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  chartCard: {
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  chartTitleRow: {
    gap: theme.spacing.xs,
  },
  chartTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  chartArea: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 196,
  },
  barGroup: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: 46,
  },
  barTrack: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: 6,
    height: 172,
    justifyContent: 'center',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    width: '100%',
  },
  barTrackActive: {
    borderColor: theme.colors.border.strong,
    backgroundColor: theme.colors.background.surfaceMuted,
  },
  bar: {
    borderTopLeftRadius: theme.radii.pill,
    borderTopRightRadius: theme.radii.pill,
    width: 14,
  },
  incomeBar: {
    backgroundColor: theme.colors.status.success,
  },
  expenseBar: {
    backgroundColor: theme.colors.brand.primary,
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
    flexWrap: 'wrap',
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  pieSectionCompact: {
    alignItems: 'stretch',
    flexDirection: 'column',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: CHART_SIZE,
  },
  chartCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  chartCenterInner: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: INNER_RING_SIZE,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    width: INNER_RING_SIZE,
  },
  centerLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  centerValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    marginTop: 2,
  },
  centerHelper: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    marginTop: 2,
  },
  breakdownLegend: {
    flex: 1,
    gap: theme.spacing.sm,
    width: '100%',
  },
  breakdownItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  breakdownLeading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  breakdownText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  breakdownTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  breakdownPercentage: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  breakdownAmount: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    marginLeft: theme.spacing.sm,
    maxWidth: '38%',
    textAlign: 'right',
  },
  emptyState: {
    paddingHorizontal: 0,
    paddingVertical: theme.spacing.sm,
  },
});
