import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  AccountManager,
  CategoryManager,
  Dashboard,
  GraphScreen,
  PlanningSettings,
  TransactionForm,
  TransactionList,
} from './src/components';
import {
  AccountFormScreen,
  AuthScreen,
  CategoryFormScreen,
} from './src/screens';
import { useAuthStore } from './src/store/authStore';
import { theme } from './src/theme/theme';

type AppRoute =
  | 'dashboard'
  | 'analytics'
  | 'transactions'
  | 'transaction-form'
  | 'accounts'
  | 'account-form'
  | 'categories'
  | 'category-form'
  | 'planning';

interface TabOption {
  label: string;
  route: Extract<
    AppRoute,
    'dashboard' | 'analytics' | 'transactions' | 'accounts' | 'categories' | 'planning'
  >;
}

const tabOptions: TabOption[] = [
  { label: 'Inicio', route: 'dashboard' },
  { label: 'Analise', route: 'analytics' },
  { label: 'Transacoes', route: 'transactions' },
  { label: 'Contas', route: 'accounts' },
  { label: 'Categorias', route: 'categories' },
  { label: 'Plano', route: 'planning' },
];

function HeaderAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={onPress} style={styles.headerAction}>
      <Text style={styles.headerActionText}>{label}</Text>
    </Pressable>
  );
}

export default function App(): React.JSX.Element {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const authSession = useAuthStore((state) => state.session);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const signOut = useAuthStore((state) => state.signOut);
  const [route, setRoute] = useState<AppRoute>('dashboard');
  const [editingTransactionId, setEditingTransactionId] = useState<number | undefined>();

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  function renderContent(): React.JSX.Element {
    if (route === 'dashboard') {
      return <Dashboard />;
    }

    if (route === 'analytics') {
      return <GraphScreen />;
    }

    if (route === 'transactions') {
      return (
        <TransactionList
          onAddTransaction={() => {
            setEditingTransactionId(undefined);
            setRoute('transaction-form');
          }}
          onEditTransaction={(id) => {
            setEditingTransactionId(id);
            setRoute('transaction-form');
          }}
        />
      );
    }

    if (route === 'transaction-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction label="Voltar" onPress={() => setRoute('transactions')} />
          </View>
          <TransactionForm
            onSuccess={() => {
              setEditingTransactionId(undefined);
              setRoute('transactions');
            }}
            transactionId={editingTransactionId}
          />
        </View>
      );
    }

    if (route === 'accounts') {
      return <AccountManager onAddAccount={() => setRoute('account-form')} />;
    }

    if (route === 'account-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction label="Voltar" onPress={() => setRoute('accounts')} />
          </View>
          <AccountFormScreen />
        </View>
      );
    }

    if (route === 'categories') {
      return <CategoryManager onAddCategory={() => setRoute('category-form')} />;
    }

    if (route === 'category-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction label="Voltar" onPress={() => setRoute('categories')} />
          </View>
          <CategoryFormScreen />
        </View>
      );
    }

    return <PlanningSettings />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {isAuthLoading ? (
            <View style={styles.centeredState}>
              <ActivityIndicator color={theme.colors.brand.primary} />
              <Text style={styles.centeredStateText}>Preparando sessao...</Text>
            </View>
          ) : null}

          {!isAuthLoading && !authSession ? <AuthScreen /> : null}

          {!isAuthLoading && authSession ? (
          <View style={styles.container}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionEmail}>{authSession.user.email ?? 'Conta ativa'}</Text>
              <HeaderAction
                label="Sair"
                onPress={() => {
                  void signOut();
                }}
              />
            </View>

            <View style={styles.content}>{renderContent()}</View>

            <SafeAreaView edges={['bottom']} style={styles.tabBarSafeArea}>
              <View style={styles.tabBar}>
                {tabOptions.map((tab) => {
                  const isActive = route === tab.route;

                  return (
                    <Pressable
                      key={tab.route}
                      onPress={() => setRoute(tab.route)}
                      style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
                    >
                      <Text
                        style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}
                      >
                        {tab.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </SafeAreaView>
          </View>
          ) : null}
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  centeredState: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    flex: 1,
    gap: theme.spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  centeredStateText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.md,
    lineHeight: theme.fonts.lineHeight.md,
  },
  content: {
    flex: 1,
  },
  sessionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  sessionEmail: {
    color: theme.colors.text.muted,
    flex: 1,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    paddingRight: theme.spacing.md,
  },
  formWrapper: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  formHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  headerAction: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderColor: theme.colors.border.default,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerActionText: {
    color: theme.colors.text.secondary,
    fontFamily: theme.fonts.family.semibold,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  tabBarSafeArea: {
    backgroundColor: theme.colors.background.secondary,
  },
  tabBar: {
    backgroundColor: theme.colors.background.secondary,
    borderTopColor: theme.colors.border.default,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: theme.radii.pill,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.xs,
  },
  tabItemActive: {
    backgroundColor: 'rgba(217, 80, 50, 0.14)',
  },
  tabLabel: {
    color: theme.colors.text.muted,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.xs,
    lineHeight: theme.fonts.lineHeight.xs,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.fonts.family.bold,
  },
});
