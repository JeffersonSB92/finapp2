import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DashboardCardData, useDashboard } from '../hooks/useDashboard';
import { theme } from '../theme/theme';

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
      backgroundColor: 'rgba(192, 57, 43, 0.16)',
      color: theme.colors.status.error,
    };
  }

  if (badgeLabel === 'abaixo') {
    return {
      backgroundColor: 'rgba(46, 139, 87, 0.16)',
      color: theme.colors.status.success,
    };
  }

  return {
    backgroundColor: 'rgba(217, 217, 217, 0.10)',
    color: theme.colors.text.secondary,
  };
}

function renderCard(card: DashboardCardData): React.JSX.Element {
  const isPrimary = card.id === 'saldoAtual';

  if (card.kind === 'planning') {
    const badgeStyles = getBadgeStyles(card.badgeLabel);

    return (
      <View
        key={card.id}
        style={[styles.card, styles.planningCard]}
      >
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <View style={[styles.badge, { backgroundColor: badgeStyles.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badgeStyles.color }]}>
              {card.badgeLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.cardValue, { color: getValueColor(card.tone) }]}>
          {card.value}
        </Text>

        <Text style={styles.cardHelper}>{card.helperText}</Text>

        <View style={styles.planningMetaRow}>
          <Text style={styles.planningMetaLabel}>Diferenca</Text>
          <Text style={[styles.planningMetaValue, { color: getValueColor(card.tone) }]}>
            {card.differenceLabel}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${card.progress}%`,
                backgroundColor: getValueColor(card.tone),
              },
            ]}
          />
        </View>

        <View style={styles.planningFooter}>
          <Text style={styles.planningFooterText}>
            Atual {card.currentPercentage.toFixed(1)}%
          </Text>
          <Text style={styles.planningFooterText}>
            Meta {card.plannedPercentage.toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      key={card.id}
      style={[styles.card, isPrimary ? styles.primaryCard : null]}
    >
      <Text style={styles.cardTitle}>{card.title}</Text>
      <Text
        style={[
          styles.cardValue,
          isPrimary ? styles.primaryCardValue : null,
          { color: getValueColor(card.tone) },
        ]}
      >
        {card.value}
      </Text>
      <Text style={styles.cardHelper}>{card.helperText}</Text>
    </View>
  );
}

export function Dashboard(): React.JSX.Element {
  const {
    cards,
    currentMonthLabel,
    currentMonthShortLabel,
    error,
    goToNextMonth,
    goToPreviousMonth,
    isLoading,
  } = useDashboard();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.monthChip}>
            <Text style={styles.monthChipText}>{currentMonthShortLabel}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Dashboard</Text>
            <Text style={styles.title}>Visao financeira</Text>
            <Text style={styles.subtitle}>{currentMonthLabel}</Text>
          </View>
        </View>

        <View style={styles.navigation}>
          <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'<'}</Text>
          </Pressable>
          <Pressable onPress={goToNextMonth} style={styles.navButton}>
            <Text style={styles.navButtonText}>{'>'}</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.feedbackCard}>
          <ActivityIndicator color={theme.colors.brand.primary} />
          <Text style={styles.feedbackText}>Carregando indicadores...</Text>
        </View>
      ) : null}

      {error && !isLoading ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {!isLoading && !error ? <View style={styles.grid}>{cards.map(renderCard)}</View> : null}
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
    justifyContent: 'space-between',
    gap: theme.spacing.md,
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
    lineHeight: theme.fonts.lineHeight.md,
    letterSpacing: 1.2,
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
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  card: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    minHeight: 180,
    padding: theme.spacing.lg,
    width: '47.6%',
  },
  primaryCard: {
    backgroundColor: theme.colors.gray[900],
  },
  planningCard: {
    justifyContent: 'space-between',
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  cardTitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  cardValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.xl,
    lineHeight: theme.fonts.lineHeight.xl,
    marginTop: theme.spacing.lg,
  },
  primaryCardValue: {
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  cardHelper: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    marginTop: theme.spacing.sm,
  },
  badge: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  planningMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  planningMetaLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  planningMetaValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  progressTrack: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.radii.pill,
    height: 10,
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.sm,
  },
  planningFooterText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
  },
});
