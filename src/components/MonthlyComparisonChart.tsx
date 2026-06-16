import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useMonthlyComparisonChart } from '../hooks/useMonthlyComparisonChart';
import { theme } from '../theme/theme';

export function MonthlyComparisonChart(): React.JSX.Element {
  const {
    bars,
    currentMonthLabel,
    totalReceitas,
    totalDespesas,
    isLoading,
    error,
    goToNextMonth,
    goToPreviousMonth,
  } = useMonthlyComparisonChart();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Fluxo mensal</Text>
          <Text style={styles.title}>Receitas x despesas</Text>
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

      <View style={styles.summaryRow}>
        <View style={styles.summaryPill}>
          <View
            style={[styles.summaryDot, { backgroundColor: theme.colors.status.success }]}
          />
          <Text style={styles.summaryLabel}>Receitas</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.status.success }]}>
            {totalReceitas}
          </Text>
        </View>

        <View style={styles.summaryPill}>
          <View
            style={[styles.summaryDot, { backgroundColor: theme.colors.brand.primary }]}
          />
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.brand.primary }]}>
            {totalDespesas}
          </Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        {isLoading ? <Text style={styles.feedbackText}>Carregando gráfico...</Text> : null}
        {error && !isLoading ? <Text style={styles.errorText}>{error}</Text> : null}

        {!isLoading && !error ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartContent}
          >
            {bars.map((bar) => (
              <View key={bar.monthKey} style={styles.barGroup}>
                <View style={styles.barArea}>
                  <View
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      { height: bar.receitasHeight },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { height: bar.despesasHeight },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{bar.monthLabel}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    letterSpacing: 1.2,
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
  summaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryPill: {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  summaryDot: {
    borderRadius: theme.radii.pill,
    height: 10,
    width: 10,
  },
  summaryLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  summaryValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  chartCard: {
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    minHeight: 252,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    ...theme.shadows.card,
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
  chartContent: {
    alignItems: 'flex-end',
    columnGap: theme.spacing.lg,
    minWidth: '100%',
    paddingTop: theme.spacing.xl,
  },
  barGroup: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: 52,
  },
  barArea: {
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.lg,
    flexDirection: 'row',
    gap: 6,
    height: 144,
    justifyContent: 'center',
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    width: '100%',
  },
  bar: {
    borderRadius: theme.radii.pill,
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
});
