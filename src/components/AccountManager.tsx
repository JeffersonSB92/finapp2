import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAccountManager } from '../hooks/useAccountManager';
import { theme } from '../theme/theme';

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
  const { accounts, activeAccountsCount, totalBalance, isLoading, error } =
    useAccountManager();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>Contas</Text>
            <Text style={styles.title}>Gerenciamento de contas</Text>
            <Text style={styles.subtitle}>
              {activeAccountsCount} contas ativas • saldo total {totalBalance}
            </Text>
          </View>

          <Pressable onPress={onAddAccount} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Nova conta</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.feedbackCard}>
            <ActivityIndicator color={theme.colors.brand.primary} />
            <Text style={styles.feedbackText}>Carregando contas...</Text>
          </View>
        ) : null}

        {error && !isLoading ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <View style={styles.accountList}>
            {accounts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Nenhuma conta cadastrada</Text>
                <Text style={styles.emptyText}>
                  Adicione sua primeira conta para acompanhar saldo e movimentacoes.
                </Text>
              </View>
            ) : (
              accounts.map((account) => (
                <View key={account.id} style={styles.accountCard}>
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
                        <Text style={styles.accountName}>{account.name}</Text>
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
                    <Text style={styles.footerLabel}>Saldo inicial</Text>
                    <Text style={styles.footerValue}>{account.initialBalance}</Text>
                  </View>
                </View>
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
    paddingBottom: theme.spacing['3xl'],
  },
  header: {
    gap: theme.spacing.md,
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
    marginTop: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
    marginTop: theme.spacing.xs,
  },
  addButton: {
    ...theme.shadows.card,
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  addButtonText: {
    color: theme.colors.brand.white,
    fontFamily: theme.fonts.family.bold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
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
  accountList: {
    gap: theme.spacing.md,
  },
  emptyCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  emptyText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.regular,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  accountCard: {
    ...theme.shadows.card,
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  accountTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  leading: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.spacing.md,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.radii.lg,
    height: 52,
    justifyContent: 'center',
    width: 52,
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
    backgroundColor: theme.colors.gray[800],
    borderRadius: theme.radii.pill,
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
    alignItems: 'center',
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.md,
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

