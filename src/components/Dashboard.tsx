import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  DashboardMetricCard,
  DashboardRecentTransaction,
  useDashboard,
} from '../hooks/useDashboard';
import { theme } from '../theme/theme';
import { MonthSelector } from './MonthSelector';
import { AppButton, AppCard, EmptyState } from './ui';

interface DashboardProps {
  onAddTransaction: () => void;
  onOpenTransactions: () => void;
}

function getValueColor(tone: 'positive' | 'negative' | 'neutral'): string {
  if (tone === 'positive') {
    return theme.colors.status.success;
  }

  if (tone === 'negative') {
    return theme.colors.status.error;
  }

  return theme.colors.text.primary;
}

function getBadgeStyles(badgeLabel: 'acima' | 'dentro' | 'abaixo') {
  if (badgeLabel === 'acima') {
    return {
      backgroundColor: theme.colors.status.errorSoft,
      color: theme.colors.status.error,
      label: 'Acima da meta',
    };
  }

  if (badgeLabel === 'abaixo') {
    return {
      backgroundColor: theme.colors.status.successSoft,
      color: theme.colors.status.success,
      label: 'Dentro da folga',
    };
  }

  return {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: theme.colors.text.secondary,
    label: 'Dentro da meta',
  };
}

function renderMetricCard(card: DashboardMetricCard): React.JSX.Element {
  return (
    <AppCard key={card.id} style={styles.metricCard} variant="soft">
      <Text style={styles.metricTitle}>{card.title}</Text>
      <Text style={[styles.metricValue, { color: getValueColor(card.tone) }]}>
        {card.value}
      </Text>
      <Text style={styles.metricHelper}>{card.helperText}</Text>
    </AppCard>
  );
}

function renderRecentTransaction(
  transaction: DashboardRecentTransaction,
): React.JSX.Element {
  const prefix =
    transaction.type === 'expense'
      ? '-'
      : transaction.type === 'income'
        ? '+'
        : '';
  const valueColor = getValueColor(
    transaction.type === 'expense'
      ? 'negative'
      : transaction.type === 'income'
        ? 'positive'
        : 'neutral',
  );

  return (
    <View key={transaction.id} style={styles.transactionRow}>
      <View
        style={[
          styles.transactionIndicator,
          { backgroundColor: transaction.indicatorColor },
        ]}
      >
        <Text style={styles.transactionIndicatorText}>
          {transaction.indicatorLabel}
        </Text>
      </View>

      <View style={styles.transactionContent}>
        <Text numberOfLines={1} style={styles.transactionTitle}>
          {transaction.title}
        </Text>
        <View style={styles.transactionMetaRow}>
          <Text numberOfLines={1} style={styles.transactionMetaText}>
            {transaction.category}
          </Text>
          <Text style={styles.transactionMetaSeparator}>•</Text>
          <Text style={styles.transactionMetaText}>{transaction.dateLabel}</Text>
        </View>
      </View>

      <Text style={[styles.transactionValue, { color: valueColor }]}>
        {prefix}
        {transaction.value}
      </Text>
    </View>
  );
}

export function Dashboard({
  onAddTransaction,
  onOpenTransactions,
}: DashboardProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const {
    activeAccountsCount,
    currentMonthLabel,
    currentMonthShortLabel,
    error,
    isLoading,
    latestTransactions,
    metrics,
    planning,
    referenceDate,
    saldoAtual,
    saldoEmConta,
    selectMonth,
  } = useDashboard();

  const isCompactLayout = width < 420;
  const isSingleColumn = width < 760;
  const planningBadge = getBadgeStyles(planning.badgeLabel);
  const receitasMetric = metrics.find((metric) => metric.id === 'receitas');
  const despesasMetric = metrics.find((metric) => metric.id === 'despesas');

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={[styles.header, isCompactLayout ? styles.headerCompact : null]}>
        <View style={styles.headerContent}>
          <View style={styles.monthChip}>
            <Text style={styles.monthChipText}>{currentMonthShortLabel}</Text>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Início</Text>
            <Text style={styles.title}>Seu panorama financeiro</Text>
            <MonthSelector onSelectMonth={selectMonth} selectedDate={referenceDate} />
          </View>
        </View>
      </View>

      {isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Carregando indicadores...</Text>
        </AppCard>
      ) : null}

      {error && !isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </AppCard>
      ) : null}

      {!isLoading && !error ? (
        <>
          <AppCard style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroTextGroup}>
                <Text style={styles.heroEyebrow}>Saldo total</Text>
                <Text style={styles.heroSubtitle}>{currentMonthLabel}</Text>
              </View>
              <View style={styles.accountsBadge}>
                <Text style={styles.accountsBadgeLabel}>
                  {activeAccountsCount} conta{activeAccountsCount === 1 ? '' : 's'} ativa
                  {activeAccountsCount === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <Text style={styles.heroValue}>{saldoAtual}</Text>
            <Text style={styles.heroHelper}>
              Saldo em conta: <Text style={styles.heroHelperStrong}>{saldoEmConta}</Text>
            </Text>

            <View style={[styles.heroSummaryRow, isCompactLayout ? styles.heroSummaryColumn : null]}>
              <View style={styles.heroSummaryPill}>
                <Text style={styles.heroSummaryLabel}>Receitas</Text>
                <Text style={[styles.heroSummaryValue, styles.heroSummaryPositive]}>
                  {receitasMetric?.value ?? 'R$ 0,00'}
                </Text>
              </View>

              <View style={styles.heroSummaryPill}>
                <Text style={styles.heroSummaryLabel}>Despesas</Text>
                <Text style={[styles.heroSummaryValue, styles.heroSummaryNegative]}>
                  {despesasMetric?.value ?? 'R$ 0,00'}
                </Text>
              </View>
            </View>
          </AppCard>

          <View style={[styles.metricsGrid, isSingleColumn ? styles.metricsColumn : null]}>
            {metrics.map((metric) => (
              <View
                key={metric.id}
                style={isSingleColumn ? styles.metricColumnItem : styles.metricGridItem}
              >
                {renderMetricCard(metric)}
              </View>
            ))}
          </View>

          <AppCard style={styles.planningCard}>
            <View style={styles.planningTopRow}>
              <View style={styles.heroTextGroup}>
                <Text style={styles.sectionEyebrow}>Planejamento financeiro</Text>
                <Text style={styles.sectionTitle}>Como o mês está performando</Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: planningBadge.backgroundColor },
                ]}
              >
                <Text style={[styles.badgeText, { color: planningBadge.color }]}>
                  {planningBadge.label}
                </Text>
              </View>
            </View>

            <View style={[styles.planningStatsRow, isCompactLayout ? styles.planningStatsColumn : null]}>
              <View style={styles.planningStat}>
                <Text style={styles.planningStatLabel}>Uso atual</Text>
                <Text style={[styles.planningStatValue, { color: getValueColor(planning.tone) }]}>
                  {planning.value}
                </Text>
              </View>
              <View style={styles.planningStat}>
                <Text style={styles.planningStatLabel}>Diferença</Text>
                <Text style={[styles.planningStatValue, { color: getValueColor(planning.tone) }]}>
                  {planning.differenceLabel}
                </Text>
              </View>
            </View>

            <Text style={styles.planningHelper}>{planning.helperText}</Text>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${planning.progress}%`,
                    backgroundColor: getValueColor(planning.tone),
                  },
                ]}
              />
            </View>

            <View style={styles.planningFooter}>
              <Text style={styles.planningFooterText}>
                Atual {planning.currentPercentage.toFixed(1)}%
              </Text>
              <Text style={styles.planningFooterText}>
                Meta {planning.plannedPercentage.toFixed(1)}%
              </Text>
            </View>
          </AppCard>

          <AppCard style={styles.transactionsCard}>
            <View style={[styles.sectionHeader, isCompactLayout ? styles.sectionHeaderCompact : null]}>
              <View style={styles.heroTextGroup}>
                <Text style={styles.sectionEyebrow}>Últimas transações</Text>
                <Text style={styles.sectionTitle}>Movimentações recentes</Text>
              </View>

              <View style={[styles.sectionActions, isCompactLayout ? styles.sectionActionsCompact : null]}>
                <AppButton
                  label="Ver todas"
                  onPress={onOpenTransactions}
                  size="sm"
                  variant="secondary"
                />
                <AppButton
                  label="Nova movimentação"
                  onPress={onAddTransaction}
                  size="sm"
                />
              </View>
            </View>

            {latestTransactions.length === 0 ? (
              <EmptyState
                description="Assim que você registrar transações, as movimentações recentes aparecerão aqui."
                eyebrow="Sem transações"
                icon="clock"
                onActionPress={onAddTransaction}
                style={styles.emptyStateCard}
                title="Nenhuma movimentação recente"
                actionLabel="Nova movimentação"
              />
            ) : (
              <View style={styles.transactionList}>
                {latestTransactions.map((transaction) => renderRecentTransaction(transaction))}
              </View>
            )}

            {latestTransactions.length > 0 ? (
              <Pressable onPress={onOpenTransactions} style={styles.linkAction}>
                <Text style={styles.linkActionText}>Ver todas as movimentações</Text>
              </Pressable>
            ) : null}
          </AppCard>
        </>
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
    justifyContent: 'space-between',
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
  feedbackCard: {
    alignItems: 'center',
    gap: theme.spacing.sm,
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
  heroCard: {
    gap: theme.spacing.lg,
  },
  heroTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  heroTextGroup: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  heroEyebrow: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  heroSubtitle: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'capitalize',
  },
  accountsBadge: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  accountsBadgeLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  heroValue: {
    color: theme.colors.status.success,
    fontFamily: theme.fonts.family.bold,
    fontSize: 36,
    lineHeight: 42,
  },
  heroHelper: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  heroHelperStrong: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroSummaryColumn: {
    flexDirection: 'column',
  },
  heroSummaryPill: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  heroSummaryLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  heroSummaryValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  heroSummaryPositive: {
    color: theme.colors.status.success,
  },
  heroSummaryNegative: {
    color: theme.colors.status.error,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricsColumn: {
    flexDirection: 'column',
  },
  metricGridItem: {
    width: '30.8%',
  },
  metricColumnItem: {
    width: '100%',
  },
  metricCard: {
    gap: theme.spacing.sm,
    minHeight: 138,
  },
  metricTitle: {
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
  metricHelper: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  planningCard: {
    gap: theme.spacing.md,
  },
  planningTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
  },
  badge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  badgeText: {
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  planningStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  planningStatsColumn: {
    flexDirection: 'column',
  },
  planningStat: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  planningStatLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  planningStatValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
  },
  planningHelper: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  progressTrack: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderRadius: theme.radii.pill,
    height: 10,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: theme.radii.pill,
    height: '100%',
  },
  planningFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  planningFooterText: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  transactionsCard: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  sectionHeaderCompact: {
    flexDirection: 'column',
  },
  sectionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    justifyContent: 'flex-end',
  },
  sectionActionsCompact: {
    width: '100%',
  },
  transactionList: {
    gap: theme.spacing.sm,
  },
  transactionRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  transactionIndicator: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  transactionIndicatorText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  transactionContent: {
    flex: 1,
    gap: theme.spacing.xxs,
    minWidth: 0,
  },
  transactionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  transactionMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  transactionMetaText: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  transactionMetaSeparator: {
    color: theme.colors.text.muted,
  },
  transactionValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    marginLeft: theme.spacing.sm,
  },
  emptyStateCard: {
    paddingHorizontal: 0,
    paddingVertical: theme.spacing.sm,
  },
  linkAction: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
  },
  linkActionText: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
