import React, { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
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
  AppButton,
  BottomTabBar,
  CategoryManager,
  Dashboard,
  ForecastScreen,
  FloatingActionMenu,
  GraphScreen,
  TransactionForm,
  TransactionList,
} from './src/components';
import {
  AccountFormScreen,
  AuthScreen,
  CategoryFormScreen,
  PeopleScreen,
  RecurringEntryFormScreen,
  SettingsScreen,
  SubcategoryFormScreen,
} from './src/screens';
import { useAuthStore } from './src/store/authStore';
import { useFinanceStore } from './src/store';
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
  | 'subcategory-form'
  | 'planning'
  | 'recurring-entry-form'
  | 'people'
  | 'settings';

interface TabOption {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: Extract<AppRoute, 'dashboard' | 'analytics' | 'planning' | 'accounts' | 'settings'>;
}

const tabOptions: TabOption[] = [
  { label: 'Início', icon: 'home', route: 'dashboard' },
  { label: 'Análise', icon: 'bar-chart-2', route: 'analytics' },
  { label: 'Plano', icon: 'sliders', route: 'planning' },
  { label: 'Contas', icon: 'credit-card', route: 'accounts' },
  { label: 'Mais', icon: 'more-horizontal', route: 'settings' },
];

const fabOptions: Array<{
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  route: Extract<AppRoute, 'transactions' | 'accounts' | 'categories'>;
}> = [
  { label: 'Transações', icon: 'repeat', route: 'transactions' },
  { label: 'Contas', icon: 'credit-card', route: 'accounts' },
  { label: 'Categorias', icon: 'grid', route: 'categories' },
];

function HeaderAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <AppButton
      iconLeft={<Feather color={theme.colors.text.secondary} name={icon} size={14} />}
      label={label}
      onPress={onPress}
      size="sm"
      variant="secondary"
    />
  );
}

export default function App(): React.JSX.Element {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const authSession = useAuthStore((state) => state.session);
  const authProfile = useAuthStore((state) => state.profile);
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const initializeFinance = useFinanceStore((state) => state.initialize);
  const financeError = useFinanceStore((state) => state.error);
  const [route, setRoute] = useState<AppRoute>('dashboard');
  const [editingTransactionId, setEditingTransactionId] = useState<number | undefined>();
  const [editingCategoryId, setEditingCategoryId] = useState<number | undefined>();
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<number | undefined>();
  const [editingRecurringEntryId, setEditingRecurringEntryId] = useState<number | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!authSession) {
      setRoute('dashboard');
      setEditingCategoryId(undefined);
      setEditingSubcategoryId(undefined);
      setEditingTransactionId(undefined);
      setEditingRecurringEntryId(undefined);
      setSelectedCategoryId(undefined);
      setIsFabOpen(false);
      return;
    }

    setRoute('dashboard');
    setEditingCategoryId(undefined);
    setEditingSubcategoryId(undefined);
    setEditingTransactionId(undefined);
    setEditingRecurringEntryId(undefined);
    setSelectedCategoryId(undefined);
    setIsFabOpen(false);
    void initializeFinance();
  }, [authSession, initializeFinance]);

  useEffect(() => {
    setIsFabOpen(false);
  }, [route]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const shouldShowFab = route === 'dashboard';
  const activeTabRoute: TabOption['route'] = (() => {
    if (route === 'analytics') {
      return 'analytics';
    }

    if (route === 'planning') {
      return 'planning';
    }

    if (route === 'accounts' || route === 'account-form') {
      return 'accounts';
    }

    if (
      route === 'settings' ||
      route === 'people' ||
      route === 'categories' ||
      route === 'category-form' ||
      route === 'subcategory-form'
    ) {
      return 'settings';
    }

    return 'dashboard';
  })();
  const sessionLabel =
    authProfile?.displayName.trim() ||
    authProfile?.fullName.trim() ||
    authSession?.user.email ||
    'Conta ativa';
  const greetingPrefix = (() => {
    const hour = now.getHours();

    if (hour < 12) {
      return 'Bom dia';
    }

    if (hour < 18) {
      return 'Boa tarde';
    }

    return 'Boa noite';
  })();
  const sessionGreeting = `${greetingPrefix}, ${sessionLabel}`;

  function renderContent(): React.JSX.Element {
    if (route === 'dashboard') {
      return (
        <Dashboard
          onAddTransaction={() => {
            setEditingTransactionId(undefined);
            setRoute('transaction-form');
          }}
          onOpenTransactions={() => setRoute('transactions')}
        />
      );
    }

    if (route === 'analytics') {
      return <GraphScreen />;
    }

    if (route === 'planning') {
      return (
        <ForecastScreen
          onAddRecurringEntry={() => {
            setEditingRecurringEntryId(undefined);
            setRoute('recurring-entry-form');
          }}
          onEditRecurringEntry={(id) => {
            setEditingRecurringEntryId(id);
            setRoute('recurring-entry-form');
          }}
        />
      );
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
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => setRoute('transactions')}
            />
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
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => setRoute('accounts')}
            />
          </View>
          <AccountFormScreen />
        </View>
      );
    }

    if (route === 'categories') {
      return (
        <CategoryManager
          onAddCategory={() => {
            setEditingCategoryId(undefined);
            setRoute('category-form');
          }}
          onAddSubcategory={(categoryId) => {
            setSelectedCategoryId(categoryId);
            setEditingSubcategoryId(undefined);
            setRoute('subcategory-form');
          }}
          onEditCategory={(categoryId) => {
            setEditingCategoryId(categoryId);
            setRoute('category-form');
          }}
          onEditSubcategory={(subcategoryId) => {
            setEditingSubcategoryId(subcategoryId);
            setSelectedCategoryId(undefined);
            setRoute('subcategory-form');
          }}
        />
      );
    }

    if (route === 'category-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => {
                setEditingCategoryId(undefined);
                setRoute('categories');
              }}
            />
          </View>
          <CategoryFormScreen
            categoryId={editingCategoryId}
            onSuccess={
              editingCategoryId
                ? () => {
                    setEditingCategoryId(undefined);
                    setRoute('categories');
                  }
                : undefined
            }
          />
        </View>
      );
    }

    if (route === 'subcategory-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => {
                setEditingSubcategoryId(undefined);
                setSelectedCategoryId(undefined);
                setRoute('categories');
              }}
            />
          </View>
          <SubcategoryFormScreen
            initialCategoryId={selectedCategoryId}
            onSuccess={() => {
              setEditingSubcategoryId(undefined);
              setSelectedCategoryId(undefined);
              setRoute('categories');
            }}
            subcategoryId={editingSubcategoryId}
          />
        </View>
      );
    }

    if (route === 'recurring-entry-form') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => {
                setEditingRecurringEntryId(undefined);
                setRoute('planning');
              }}
            />
          </View>
          <RecurringEntryFormScreen
            onSuccess={() => {
              setEditingRecurringEntryId(undefined);
              setRoute('planning');
            }}
            recurringEntryId={editingRecurringEntryId}
          />
        </View>
      );
    }

    if (route === 'settings') {
      return <SettingsScreen onOpenPeople={() => setRoute('people')} />;
    }

    if (route === 'people') {
      return (
        <View style={styles.formWrapper}>
          <View style={styles.formHeader}>
            <HeaderAction
              icon="chevron-left"
              label="Voltar"
              onPress={() => setRoute('settings')}
            />
          </View>
          <PeopleScreen />
        </View>
      );
    }

    return (
      <ForecastScreen
        onAddRecurringEntry={() => {
          setEditingRecurringEntryId(undefined);
          setRoute('recurring-entry-form');
        }}
        onEditRecurringEntry={(id) => {
          setEditingRecurringEntryId(id);
          setRoute('recurring-entry-form');
        }}
      />
    );
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
              <Text style={styles.centeredStateText}>Preparando sessão...</Text>
            </View>
          ) : null}

          {!isAuthLoading && !authSession ? <AuthScreen /> : null}

          {!isAuthLoading && authSession ? (
            <View style={styles.container}>
              <View style={styles.sessionHeader}>
                <View style={styles.sessionIdentity}>
                  <View style={styles.sessionAvatar}>
                    <Feather
                      color={theme.colors.brand.white}
                      name="user"
                      size={16}
                    />
                  </View>
                  <Text numberOfLines={1} style={styles.sessionEmail}>
                    {sessionGreeting}
                  </Text>
                </View>
                <HeaderAction
                  icon="settings"
                  label="Mais"
                  onPress={() => setRoute('settings')}
                />
              </View>

              {financeError ? (
                <View style={styles.sessionErrorContainer}>
                  <Text style={styles.sessionErrorText}>{financeError}</Text>
                </View>
              ) : null}

              <View style={styles.content}>{renderContent()}</View>

              {shouldShowFab ? (
                <FloatingActionMenu
                  currentRoute={route}
                  isOpen={isFabOpen}
                  onPrimaryPress={() => setIsFabOpen((current) => !current)}
                  options={fabOptions}
                  onSelectRoute={(nextRoute) => setRoute(nextRoute)}
                />
              ) : null}

              <SafeAreaView edges={['bottom']} style={styles.tabBarSafeArea}>
                <BottomTabBar
                  activeRoute={activeTabRoute}
                  items={tabOptions}
                  onSelect={(nextRoute) => setRoute(nextRoute)}
                />
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
    minHeight: 60,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
  },
  sessionIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minWidth: 0,
  },
  sessionAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primarySoft,
    borderColor: theme.colors.brand.primary,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sessionEmail: {
    color: theme.colors.text.secondary,
    flex: 1,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
    paddingRight: theme.spacing.md,
  },
  sessionErrorContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  sessionErrorText: {
    color: theme.colors.status.error,
    fontFamily: theme.fonts.family.medium,
    fontSize: theme.fonts.size.sm,
    lineHeight: theme.fonts.lineHeight.sm,
  },
  formWrapper: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  formHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  tabBarSafeArea: {
    backgroundColor: theme.colors.background.primary,
  },
});
