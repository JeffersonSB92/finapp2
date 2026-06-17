import { create } from 'zustand';

import {
  Account,
  Category,
  Planning,
  PlanningSettings,
  Person,
  RecurringEntry,
  Subcategory,
  Transaction,
  initDatabase,
} from '../database';
import type {
  CreateAccountInput,
  UpdateAccountInput,
} from '../database/repositories/AccountRepository';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../database/repositories/CategoryRepository';
import type {
  CreatePlanningInput,
  UpdatePlanningInput,
} from '../database/repositories/PlanningRepository';
import type { SavePlanningSettingsInput } from '../database/repositories/PlanningSettingsRepository';
import type {
  CreatePersonInput,
  UpdatePersonInput,
} from '../database/repositories/PersonRepository';
import type {
  CreateRecurringEntryInput,
  UpdateRecurringEntryInput,
} from '../database/repositories/RecurringEntryRepository';
import type {
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from '../database/repositories/SubcategoryRepository';
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../database/repositories/TransactionRepository';
import { isSupabaseConfigured, syncService } from '../sync';
import { useConnectivityStore } from './connectivityStore';
import { storeRepositories } from './repositories';

let financeInitializationPromise: Promise<void> | null = null;

interface FinanceState {
  accounts: Account[];
  people: Person[];
  transactions: Transaction[];
  categories: Category[];
  subcategories: Subcategory[];
  recurringEntries: RecurringEntry[];
  planning: Planning[];
  planningSettings: PlanningSettings | null;
  isLoading: boolean;
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingSyncCount: number;
  syncError: string | null;
  error: string | null;
  initialize: () => Promise<void>;
  reloadAll: () => Promise<void>;
  syncNow: () => Promise<void>;
  resetForSession: () => void;
  loadAccounts: () => Promise<void>;
  loadPeople: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadSubcategories: () => Promise<void>;
  loadRecurringEntries: () => Promise<void>;
  loadPlanning: () => Promise<void>;
  loadPlanningSettings: () => Promise<void>;
  addAccount: (input: CreateAccountInput) => Promise<Account>;
  updateAccount: (id: number, input: UpdateAccountInput) => Promise<Account>;
  removeAccount: (id: number) => Promise<void>;
  addPerson: (input: CreatePersonInput) => Promise<Person>;
  updatePerson: (id: number, input: UpdatePersonInput) => Promise<Person>;
  removePerson: (id: number) => Promise<void>;
  addTransaction: (input: CreateTransactionInput) => Promise<Transaction>;
  updateTransaction: (
    id: number,
    input: UpdateTransactionInput,
  ) => Promise<Transaction>;
  removeTransaction: (id: number) => Promise<void>;
  addCategory: (input: CreateCategoryInput) => Promise<Category>;
  updateCategory: (
    id: number,
    input: UpdateCategoryInput,
  ) => Promise<Category>;
  removeCategory: (id: number) => Promise<void>;
  addSubcategory: (input: CreateSubcategoryInput) => Promise<Subcategory>;
  updateSubcategory: (
    id: number,
    input: UpdateSubcategoryInput,
  ) => Promise<Subcategory>;
  removeSubcategory: (id: number) => Promise<void>;
  addRecurringEntry: (input: CreateRecurringEntryInput) => Promise<RecurringEntry>;
  updateRecurringEntry: (
    id: number,
    input: UpdateRecurringEntryInput,
  ) => Promise<RecurringEntry>;
  removeRecurringEntry: (id: number) => Promise<void>;
  addPlanning: (input: CreatePlanningInput) => Promise<Planning>;
  updatePlanning: (
    id: number,
    input: UpdatePlanningInput,
  ) => Promise<Planning>;
  removePlanning: (id: number) => Promise<void>;
  savePlanningSettings: (
    input: SavePlanningSettingsInput,
  ) => Promise<PlanningSettings>;
}

function sortAccounts(items: Account[]): Account[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortPeople(items: Person[]): Person[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortCategories(items: Category[]): Category[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortSubcategories(items: Subcategory[]): Subcategory[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name));
}

function sortRecurringEntries(items: RecurringEntry[]): RecurringEntry[] {
  return [...items].sort((left, right) => {
    if (left.is_active !== right.is_active) {
      return left.is_active ? -1 : 1;
    }

    if (left.day_of_month !== right.day_of_month) {
      return left.day_of_month - right.day_of_month;
    }

    return left.name.localeCompare(right.name);
  });
}

function sortTransactions(items: Transaction[]): Transaction[] {
  return [...items].sort((left, right) => {
    if (left.transaction_date === right.transaction_date) {
      return right.id - left.id;
    }

    return right.transaction_date.localeCompare(left.transaction_date);
  });
}

function sortPlanning(items: Planning[]): Planning[] {
  return [...items].sort((left, right) => {
    if (left.year !== right.year) {
      return right.year - left.year;
    }

    if (left.month !== right.month) {
      return right.month - left.month;
    }

    return right.id - left.id;
  });
}

async function ensureDatabaseInitialized(): Promise<void> {
  await initDatabase();
}

async function refreshPendingSyncCount(
  set: (partial: Partial<FinanceState>) => void,
): Promise<void> {
  const pendingSyncCount = await syncService.getPendingCount();
  set({ pendingSyncCount });
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  accounts: [],
  people: [],
  transactions: [],
  categories: [],
  subcategories: [],
  recurringEntries: [],
  planning: [],
  planningSettings: null,
  isLoading: false,
  isInitialized: false,
  isSyncing: false,
  lastSyncAt: null,
  pendingSyncCount: 0,
  syncError: null,
  error: null,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    if (financeInitializationPromise) {
      await financeInitializationPromise;
      return;
    }

    financeInitializationPromise = (async () => {
      set({ isLoading: true, error: null });

      try {
        await ensureDatabaseInitialized();
        await get().reloadAll();
        await refreshPendingSyncCount(set);
        set({ isInitialized: true, isLoading: false });

        if (isSupabaseConfigured()) {
          void get().syncNow();
        }
      } catch (error) {
        set({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Não foi possível inicializar a loja.',
        });
        throw error;
      } finally {
        financeInitializationPromise = null;
      }
    })();

    await financeInitializationPromise;
  },

  reloadAll: async () => {
    set({ isLoading: true, error: null });

    try {
      await ensureDatabaseInitialized();
      const [
        accounts,
        people,
        transactions,
        categories,
        subcategories,
        recurringEntries,
        planning,
        planningSettings,
      ] = await Promise.all([
        storeRepositories.accountRepository.getAll(),
        storeRepositories.personRepository.getAll(),
        storeRepositories.transactionRepository.getAll(),
        storeRepositories.categoryRepository.getAll(),
        storeRepositories.subcategoryRepository.getAll(),
        storeRepositories.recurringEntryRepository.getAll(),
        storeRepositories.planningRepository.getAll(),
        storeRepositories.planningSettingsRepository.getLatest(),
      ]);

      set({
        accounts: sortAccounts(accounts),
        people: sortPeople(people),
        transactions: sortTransactions(transactions),
        categories: sortCategories(categories),
        subcategories: sortSubcategories(subcategories),
        recurringEntries: sortRecurringEntries(recurringEntries),
        planning: sortPlanning(planning),
        planningSettings,
        isLoading: false,
        error: null,
      });
      await refreshPendingSyncCount(set);
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Não foi possível recarregar os dados.',
      });
      throw error;
    }
  },

  syncNow: async () => {
    if (!isSupabaseConfigured()) {
      await refreshPendingSyncCount(set);
      return;
    }

    if (!useConnectivityStore.getState().isOnline) {
      await refreshPendingSyncCount(set);
      set({
        isSyncing: false,
        syncError: null,
      });
      return;
    }

    set({ isSyncing: true, syncError: null });

    try {
      const result = await syncService.syncNow();
      await get().reloadAll();
      set({
        isSyncing: false,
        lastSyncAt: result.lastSyncAt,
        pendingSyncCount: result.pending,
        syncError: null,
      });
    } catch (error) {
      await refreshPendingSyncCount(set);
      set({
        isSyncing: false,
        syncError:
          error instanceof Error ? error.message : 'Não foi possível sincronizar os dados.',
      });
    }
  },

  resetForSession: () => {
    set({
      accounts: [],
      people: [],
      transactions: [],
      categories: [],
      subcategories: [],
      recurringEntries: [],
      planning: [],
      planningSettings: null,
      isLoading: false,
      isInitialized: false,
      isSyncing: false,
      lastSyncAt: null,
      pendingSyncCount: 0,
      syncError: null,
      error: null,
    });
  },

  loadAccounts: async () => {
    try {
      await ensureDatabaseInitialized();
      const accounts = await storeRepositories.accountRepository.getAll();
      set({ accounts: sortAccounts(accounts), error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível carregar as contas.',
      });
      throw error;
    }
  },

  loadPeople: async () => {
    try {
      await ensureDatabaseInitialized();
      const people = await storeRepositories.personRepository.getAll();
      set({ people: sortPeople(people), error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível carregar as pessoas.',
      });
      throw error;
    }
  },

  loadTransactions: async () => {
    try {
      await ensureDatabaseInitialized();
      const transactions = await storeRepositories.transactionRepository.getAll();
      set({ transactions: sortTransactions(transactions), error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível carregar as transações.',
      });
      throw error;
    }
  },

  loadCategories: async () => {
    try {
      await ensureDatabaseInitialized();
      const categories = await storeRepositories.categoryRepository.getAll();
      set({ categories: sortCategories(categories), error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível carregar as categorias.',
      });
      throw error;
    }
  },

  loadSubcategories: async () => {
    try {
      await ensureDatabaseInitialized();
      const subcategories = await storeRepositories.subcategoryRepository.getAll();
      set({ subcategories: sortSubcategories(subcategories), error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível carregar as subcategorias.',
      });
      throw error;
    }
  },

  loadRecurringEntries: async () => {
    try {
      await ensureDatabaseInitialized();
      const recurringEntries = await storeRepositories.recurringEntryRepository.getAll();
      set({ recurringEntries: sortRecurringEntries(recurringEntries), error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os compromissos recorrentes.',
      });
      throw error;
    }
  },

  loadPlanning: async () => {
    try {
      await ensureDatabaseInitialized();
      const planning = await storeRepositories.planningRepository.getAll();
      set({ planning: sortPlanning(planning), error: null });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível carregar o planejamento.',
      });
      throw error;
    }
  },

  loadPlanningSettings: async () => {
    try {
      await ensureDatabaseInitialized();
      const planningSettings =
        await storeRepositories.planningSettingsRepository.getLatest();
      set({ planningSettings, error: null });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as configurações de planejamento.',
      });
      throw error;
    }
  },

  addAccount: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const account = await storeRepositories.accountRepository.create(input);
      await syncService.queueUpsert('accounts', account.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return account;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível adicionar a conta.',
      });
      throw error;
    }
  },

  updateAccount: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const account = await storeRepositories.accountRepository.update(id, input);
      await syncService.queueUpsert('accounts', account.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return account;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível atualizar a conta.',
      });
      throw error;
    }
  },

  removeAccount: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const account = await storeRepositories.accountRepository.getById(id);
      await syncService.queueDelete('accounts', account);
      await storeRepositories.accountRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível remover a conta.',
      });
      throw error;
    }
  },

  addPerson: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const person = await storeRepositories.personRepository.create(input);
      await syncService.queueUpsert('people', person.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return person;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível adicionar a pessoa.',
      });
      throw error;
    }
  },

  updatePerson: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const person = await storeRepositories.personRepository.update(id, input);
      await syncService.queueUpsert('people', person.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return person;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível atualizar a pessoa.',
      });
      throw error;
    }
  },

  removePerson: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const person = await storeRepositories.personRepository.getById(id);
      await storeRepositories.personRepository.delete(id);
      await syncService.queueDelete('people', person);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível remover a pessoa.',
      });
      throw error;
    }
  },

  addTransaction: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const installmentCount =
        input.type === 'expense'
          ? Math.max(1, input.installment_count ?? 1)
          : 1;
      const createdTransactions =
        installmentCount > 1
          ? await storeRepositories.transactionRepository.createInstallmentSeries(
              input,
              installmentCount,
            )
          : [await storeRepositories.transactionRepository.create(input)];

      for (const transaction of createdTransactions) {
        await syncService.queueUpsert('transactions', transaction.sync_id);
      }

      await get().reloadAll();
      void get().syncNow();
      return createdTransactions[0];
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível adicionar a transação.',
      });
      throw error;
    }
  },

  updateTransaction: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const transaction = await storeRepositories.transactionRepository.update(
        id,
        input,
      );
      await syncService.queueUpsert('transactions', transaction.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return transaction;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível atualizar a transação.',
      });
      throw error;
    }
  },

  removeTransaction: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const transaction = await storeRepositories.transactionRepository.getById(id);
      await syncService.queueDelete('transactions', transaction);
      await storeRepositories.transactionRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível remover a transação.',
      });
      throw error;
    }
  },

  addCategory: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const category = await storeRepositories.categoryRepository.create(input);
      await syncService.queueUpsert('categories', category.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return category;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível adicionar a categoria.',
      });
      throw error;
    }
  },

  updateCategory: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const category = await storeRepositories.categoryRepository.update(id, input);
      await syncService.queueUpsert('categories', category.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return category;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível atualizar a categoria.',
      });
      throw error;
    }
  },

  removeCategory: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const category = await storeRepositories.categoryRepository.getById(id);
      await syncService.queueDelete('categories', category);
      await storeRepositories.categoryRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível remover a categoria.',
      });
      throw error;
    }
  },

  addSubcategory: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const subcategory = await storeRepositories.subcategoryRepository.create(input);
      await syncService.queueUpsert('subcategories', subcategory.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return subcategory;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível adicionar a subcategoria.',
      });
      throw error;
    }
  },

  updateSubcategory: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const subcategory = await storeRepositories.subcategoryRepository.update(id, input);
      await syncService.queueUpsert('subcategories', subcategory.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return subcategory;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível atualizar a subcategoria.',
      });
      throw error;
    }
  },

  removeSubcategory: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const subcategory = await storeRepositories.subcategoryRepository.getById(id);
      await syncService.queueDelete('subcategories', subcategory);
      await storeRepositories.subcategoryRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível remover a subcategoria.',
      });
      throw error;
    }
  },

  addRecurringEntry: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const recurringEntry = await storeRepositories.recurringEntryRepository.create(input);
      await syncService.queueUpsert('recurring_entries', recurringEntry.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return recurringEntry;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível adicionar o compromisso recorrente.',
      });
      throw error;
    }
  },

  updateRecurringEntry: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const recurringEntry = await storeRepositories.recurringEntryRepository.update(
        id,
        input,
      );
      await syncService.queueUpsert('recurring_entries', recurringEntry.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return recurringEntry;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível atualizar o compromisso recorrente.',
      });
      throw error;
    }
  },

  removeRecurringEntry: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const recurringEntry = await storeRepositories.recurringEntryRepository.getById(id);
      await syncService.queueDelete('recurring_entries', recurringEntry);
      await storeRepositories.recurringEntryRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível remover o compromisso recorrente.',
      });
      throw error;
    }
  },

  addPlanning: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const planning = await storeRepositories.planningRepository.create(input);
      await syncService.queueUpsert('planning', planning.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return planning;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Não foi possível adicionar o planejamento.',
      });
      throw error;
    }
  },

  updatePlanning: async (id, input) => {
    try {
      await ensureDatabaseInitialized();
      const planning = await storeRepositories.planningRepository.update(id, input);
      await syncService.queueUpsert('planning', planning.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return planning;
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível atualizar o planejamento.',
      });
      throw error;
    }
  },

  removePlanning: async (id) => {
    try {
      await ensureDatabaseInitialized();
      const planning = await storeRepositories.planningRepository.getById(id);
      await syncService.queueDelete('planning', planning);
      await storeRepositories.planningRepository.delete(id);
      await get().reloadAll();
      void get().syncNow();
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : 'Não foi possível remover o planejamento.',
      });
      throw error;
    }
  },

  savePlanningSettings: async (input) => {
    try {
      await ensureDatabaseInitialized();
      const planningSettings =
        await storeRepositories.planningSettingsRepository.save(input);
      await syncService.queueUpsert('planning_settings', planningSettings.sync_id);
      await get().reloadAll();
      void get().syncNow();
      return planningSettings;
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar as configurações de planejamento.',
      });
      throw error;
    }
  },
}));
