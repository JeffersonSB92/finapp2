import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useCategorySpendingPieChart } from '../hooks/useCategorySpendingPieChart';
import { theme } from '../theme/theme';

const CHART_SIZE = 188;
const STROKE_WIDTH = 26;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function buildStrokeOffset(percentageBefore: number): number {
  return CIRCUMFERENCE - (percentageBefore / 100) * CIRCUMFERENCE;
}

export function CategorySpendingPieChart(): React.JSX.Element {
  const {
    slices,
    currentMonthLabel,
    totalAmount,
    isLoading,
    error,
    goToNextMonth,
    goToPreviousMonth,
  } = useCategorySpendingPieChart();

  let percentageBefore = 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Distribuição</Text>
          <Text style={styles.title}>Gastos por categoria</Text>
        </View>

        <View style={styles.navigation}>
          <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'<'}</Text>
          </Pressable>
          <Text style={styles.currentMonth}>{currentMonthLabel}</Text>
          <Pressable onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        {isLoading ? <Text style={styles.feedbackText}>Carregando gráfico...</Text> : null}
        {error && !isLoading ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error ? (
          <View style={styles.content}>
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
                      strokeDasharray={`${(slice.percentage / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                      strokeDashoffset={buildStrokeOffset(percentageBefore)}
                      strokeLinecap="butt"
                      rotation={-90}
                      origin={`${CHART_SIZE / 2}, ${CHART_SIZE / 2}`}
                    />
                  );

                  percentageBefore += slice.percentage;
                  return segment;
                })}
              </Svg>

              <View style={styles.chartCenter}>
                <Text style={styles.centerLabel}>Total</Text>
                <Text style={styles.centerValue}>{totalAmount}</Text>
              </View>
            </View>

            <View style={styles.legend}>
              {slices.length === 0 ? (
                <Text style={styles.emptyText}>Nenhum gasto encontrado neste mês.</Text>
              ) : (
                slices.map((slice) => (
                  <View key={slice.id} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                    <View style={styles.legendTextGroup}>
                      <Text style={styles.legendTitle}>{slice.label}</Text>
                      <Text style={styles.legendSubtitle}>
                        {slice.percentage.toFixed(1)}% • {currencyFormatter.format(slice.amount)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    letterSpacing: 1.2,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    marginTop: theme.spacing.xs,
  },
  navigation: {
    alignItems: 'center',
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
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  navButtonText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  currentMonth: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'capitalize',
  },
  card: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    minHeight: 320,
    padding: theme.spacing.lg,
  },
  feedbackText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  errorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  content: {
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
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
    marginTop: theme.spacing.xs,
  },
  legend: {
    gap: theme.spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  legendDot: {
    borderRadius: theme.radii.pill,
    height: 12,
    width: 12,
  },
  legendTextGroup: {
    flex: 1,
  },
  legendTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  legendSubtitle: {
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
