import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { useAccountManager } from '../hooks/useAccountManager';
import { theme } from '../theme/theme';
import { AppButton, AppCard, EmptyState } from './ui';

interface AccountManagerProps {
  onAddAccount?: () => void;
}

function getBalanceColor(tone: 'positive' | 'negative' | 'neutral'): string {
  if (tone === 'positive') {
    return theme.colors.status.success;
  }

  if (tone === 'negative') {
    return theme.colors.status.error;
  }

  return theme.colors.text.primary;
}

export function AccountManager({
  onAddAccount,
}: AccountManagerProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const { accounts, activeAccountsCount, totalBalance, isLoading, error } =
    useAccountManager();

  const isCompactLayout = width < 420;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>Contas</Text>
            <Text style={styles.title}>Gestão das suas contas</Text>
            <Text style={styles.subtitle}>
              Acompanhe saldo total, contas ativas e o detalhamento de cada conta.
            </Text>
          </View>

          <AppButton
            label="+ Nova conta"
            onPress={onAddAccount}
            size="sm"
            style={styles.addButton}
          />
        </View>

        <AppCard style={styles.summaryCard}>
          <View style={[styles.summaryHeader, isCompactLayout ? styles.summaryHeaderCompact : null]}>
            <View style={styles.summaryHeading}>
              <Text style={styles.summaryLabel}>Saldo total</Text>
              <Text style={styles.summaryValue}>{totalBalance}</Text>
            </View>

            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeLabel}>
                {activeAccountsCount} conta{activeAccountsCount === 1 ? '' : 's'} ativa
                {activeAccountsCount === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </AppCard>

        {isLoading ? (
          <AppCard style={styles.feedbackCard}>
            <ActivityIndicator color={theme.colors.brand.primary} />
            <Text style={styles.feedbackText}>Carregando contas...</Text>
          </AppCard>
        ) : null}

        {error && !isLoading ? (
          <AppCard style={styles.feedbackCard}>
            <Text style={styles.errorText}>{error}</Text>
          </AppCard>
        ) : null}

        {!isLoading && !error ? (
          <View style={styles.accountList}>
            {accounts.length === 0 ? (
              <EmptyState
                actionLabel="Nova conta"
                description="Adicione sua primeira conta para acompanhar saldo, transferências e movimentações."
                eyebrow="Sem contas"
                icon="credit-card"
                onActionPress={onAddAccount}
                style={styles.emptyCard}
                title="Nenhuma conta cadastrada"
              />
            ) : (
              accounts.map((account) => (
                <AppCard key={account.id} style={styles.accountCard}>
                  <View style={styles.accountTopRow}>
                    <View style={styles.leading}>
                      <View
                        style={[
                          styles.iconBadge,
                          account.color ? { backgroundColor: account.color } : null,
                        ]}
                      >
                        <Text style={styles.iconBadgeText}>{account.iconLabel}</Text>
                      </View>

                      <View style={styles.accountInfo}>
                        <Text numberOfLines={1} style={styles.accountName}>
                          {account.name}
                        </Text>
                        <Text style={styles.accountType}>{account.typeLabel}</Text>
                      </View>
                    </View>

                    {!account.isActive ? (
                      <View style={styles.inactiveBadge}>
                        <Text style={styles.inactiveBadgeText}>Inativa</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.balanceBlock}>
                    <Text style={styles.balanceLabel}>Saldo atual</Text>
                    <Text
                      style={[
                        styles.balanceValue,
                        { color: getBalanceColor(account.tone) },
                      ]}
                    >
                      {account.currentBalance}
                    </Text>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={styles.footerMeta}>
                      <Text style={styles.footerLabel}>Saldo inicial</Text>
                      <Text style={styles.footerValue}>{account.initialBalance}</Text>
                    </View>
                    <View style={styles.footerMeta}>
                      <Text style={styles.footerLabel}>Tipo</Text>
                      <Text style={styles.footerValue}>{account.typeLabel}</Text>
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </View>
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
    gap: theme.spacing.md,
  },
  headerText: {
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
  addButton: {
    alignSelf: 'flex-start',
  },
  summaryCard: {
    gap: theme.spacing.md,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  summaryHeaderCompact: {
    flexDirection: 'column',
  },
  summaryHeading: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: theme.colors.status.success,
    fontFamily: theme.fonts.family.bold,
    fontSize: 34,
    lineHeight: 40,
  },
  summaryBadge: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  summaryBadgeLabel: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
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
  accountList: {
    gap: theme.spacing.md,
  },
  emptyCard: {
    minHeight: 0,
  },
  accountCard: {
    gap: theme.spacing.md,
  },
  accountTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  leading: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    minWidth: 0,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.surfaceSoft,
    borderRadius: theme.radii.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  iconBadgeText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  accountInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  accountName: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  accountType: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.background.surfaceSoft,
    borderColor: theme.colors.border.soft,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  inactiveBadgeText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textTransform: 'uppercase',
  },
  balanceBlock: {
    gap: theme.spacing.xs,
  },
  balanceLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  balanceValue: {
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size['2xl'],
    lineHeight: theme.fonts.lineHeight['2xl'],
  },
  footerRow: {
    borderTopColor: theme.colors.border.soft,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
  },
  footerMeta: {
    flex: 1,
    gap: 2,
  },
  footerLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  footerValue: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
});
