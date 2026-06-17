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

import { useForecastScreen } from '../hooks/useForecastScreen';
import { theme } from '../theme/theme';
import { MonthSelector } from './MonthSelector';
import { AppButton, AppCard, EmptyState } from './ui';

interface ForecastScreenProps {
  onAddRecurringEntry: () => void;
  onEditRecurringEntry: (id: number) => void;
}

function getToneColor(tone: 'positive' | 'negative' | 'neutral'): string {
  if (tone === 'positive') {
    return theme.colors.status.success;
  }

  if (tone === 'negative') {
    return theme.colors.status.error;
  }

  return theme.colors.text.primary;
}

export function ForecastScreen({
  onAddRecurringEntry,
  onEditRecurringEntry,
}: ForecastScreenProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const {
    error,
    events,
    isLoading,
    monthLabel,
    personSummaries,
    recurringItems,
    referenceDate,
    selectMonth,
    summaryMetrics,
  } = useForecastScreen();

  const isCompactLayout = width < 420;
  const isSingleColumn = width < 760;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={[styles.header, isCompactLayout ? styles.headerCompact : null]}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Previsão</Text>
          <Text style={styles.title}>Saldo projetado do mês</Text>
          <Text style={styles.subtitle}>
            Combine lançamentos e recorrências para enxergar como o mês tende a fechar.
          </Text>
          <MonthSelector onSelectMonth={selectMonth} selectedDate={referenceDate} />
        </View>

        <AppButton
          label="+ Recorrência"
          onPress={onAddRecurringEntry}
          size="sm"
          style={styles.headerAction}
        />
      </View>

      {isLoading ? (
        <AppCard style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Montando a previsão mensal...</Text>
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
            <View style={[styles.heroHeader, isCompactLayout ? styles.heroHeaderCompact : null]}>
              <View style={styles.heroHeading}>
                <Text style={styles.heroEyebrow}>Fechamento estimado</Text>
                <Text style={styles.heroMonth}>{monthLabel}</Text>
              </View>

              <View style={styles.heroPill}>
                <Text style={styles.heroPillLabel}>Saldo projetado</Text>
                <Text
                  style={[
                    styles.heroPillValue,
                    { color: getToneColor(summaryMetrics[3]?.tone ?? 'neutral') },
                  ]}
                >
                  {summaryMetrics[3]?.value ?? 'R$ 0,00'}
                </Text>
              </View>
            </View>

            <View style={[styles.metricsGrid, isSingleColumn ? styles.metricsColumn : null]}>
              {summaryMetrics.map((metric) => (
                <View key={metric.id} style={styles.metricCard}>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getToneColor(metric.tone) },
                    ]}
                  >
                    {metric.value}
                  </Text>
                  <Text style={styles.metricHelper}>{metric.helperText}</Text>
                </View>
              ))}
            </View>
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <View style={[styles.sectionHeader, isCompactLayout ? styles.sectionHeaderCompact : null]}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionEyebrow}>Por pessoa</Text>
                <Text style={styles.sectionTitle}>Quem impacta o mês</Text>
              </View>
            </View>

            {personSummaries.length === 0 ? (
              <Text style={styles.emptyText}>
                Nenhuma pessoa vinculada aos lançamentos ou recorrências deste mês.
              </Text>
            ) : (
              <View style={styles.personGrid}>
                {personSummaries.map((person) => (
                  <View key={person.id} style={styles.personCard}>
                    <Text style={styles.personName}>{person.label}</Text>
                    <Text style={styles.personMeta}>Entradas {person.income}</Text>
                    <Text style={styles.personMeta}>Saídas {person.expense}</Text>
                    <Text style={styles.personBalance}>{person.balance}</Text>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionEyebrow}>Cronograma do mês</Text>
              <Text style={styles.sectionTitle}>Compromissos e lançamentos</Text>
            </View>

            {events.length === 0 ? (
              <EmptyState
                actionLabel="Nova recorrência"
                description="Cadastre salários, contas fixas e previsões variáveis para começar a montar o fluxo do mês."
                eyebrow="Sem eventos"
                icon="calendar"
                onActionPress={onAddRecurringEntry}
                title="Nada previsto ainda"
              />
            ) : (
              <View style={styles.eventList}>
                {events.map((event) => (
                  <View key={event.id} style={styles.eventRow}>
                    <View style={styles.eventDateBadge}>
                      <Text style={styles.eventDateText}>{event.dateLabel}</Text>
                    </View>

                    <View style={styles.eventContent}>
                      <Text numberOfLines={1} style={styles.eventTitle}>
                        {event.title}
                      </Text>
                      <Text numberOfLines={2} style={styles.eventSubtitle}>
                        {event.subtitle}
                      </Text>
                      <Text style={styles.eventSource}>{event.sourceLabel}</Text>
                    </View>

                    <Text
                      style={[
                        styles.eventAmount,
                        {
                          color:
                            event.type === 'income'
                              ? theme.colors.status.success
                              : theme.colors.brand.primary,
                        },
                      ]}
                    >
                      {event.type === 'income' ? '+' : '-'}
                      {event.amountLabel}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <View style={[styles.sectionHeader, isCompactLayout ? styles.sectionHeaderCompact : null]}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionEyebrow}>Recorrências</Text>
                <Text style={styles.sectionTitle}>Base da previsão</Text>
              </View>

              <AppButton
                label="+ Adicionar"
                onPress={onAddRecurringEntry}
                size="sm"
                variant="secondary"
              />
            </View>

            {recurringItems.length === 0 ? (
              <Text style={styles.emptyText}>
                Cadastre aqui salários, contas fixas e saídas variáveis esperadas.
              </Text>
            ) : (
              <View style={styles.recurringList}>
                {recurringItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => onEditRecurringEntry(item.id)}
                    style={styles.recurringCard}
                  >
                    <View style={styles.recurringMain}>
                      <View style={styles.recurringTopRow}>
                        <Text numberOfLines={1} style={styles.recurringName}>
                          {item.name}
                        </Text>
                        {!item.isActive ? (
                          <View style={styles.inactivePill}>
                            <Text style={styles.inactivePillText}>Inativa</Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.recurringMeta}>
                        {item.dayLabel} • {item.groupLabel}
                      </Text>
                      <Text style={styles.recurringMeta}>
                        {[item.personLabel, item.accountLabel, item.categoryLabel]
                          .filter(Boolean)
                          .join(' • ') || 'Sem vinculações extras'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.recurringAmount,
                        {
                          color:
                            item.type === 'income'
                              ? theme.colors.status.success
                              : theme.colors.brand.primary,
                        },
                      ]}
                    >
                      {item.type === 'income' ? '+' : '-'}
                      {item.amountLabel}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </AppCard>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  content: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.bottomSafe + theme.spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  headerCompact: {
    flexDirection: 'column',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  eyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
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
  headerAction: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xxs,
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
  heroEyebrow: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  heroMonth: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    textTransform: 'capitalize',
  },
  heroPill: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: 2,
    minWidth: 140,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  heroPillLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  heroPillValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexBasis: '48%',
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.lg,
    lineHeight: theme.fonts.lineHeight.lg,
  },
  metricHelper: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  sectionCard: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionHeaderCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  sectionHeading: {
    gap: 2,
  },
  sectionEyebrow: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  personGrid: {
    gap: theme.spacing.sm,
  },
  personCard: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    gap: 4,
    padding: theme.spacing.md,
  },
  personName: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  personMeta: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  personBalance: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    marginTop: theme.spacing.xxs,
  },
  eventList: {
    gap: theme.spacing.sm,
  },
  eventRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  eventDateBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 58,
    paddingHorizontal: theme.spacing.sm,
  },
  eventDateText: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  eventContent: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  eventTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  eventSubtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  eventSource: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  eventAmount: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  recurringList: {
    gap: theme.spacing.sm,
  },
  recurringCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  recurringMain: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  recurringTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  recurringName: {
    color: theme.colors.text.primary,
    flex: 1,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  recurringMeta: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  recurringAmount: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  inactivePill: {
    backgroundColor: theme.colors.background.elevated,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  inactivePillText: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
