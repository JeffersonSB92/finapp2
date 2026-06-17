import {
  AccountRepository,
  CategoryRepository,
  PlanningRepository,
  PlanningSettingsRepository,
  PersonRepository,
  RecurringEntryRepository,
  SubcategoryRepository,
  TransactionRepository,
} from '../database';

export interface StoreRepositories {
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
  planningRepository: PlanningRepository;
  planningSettingsRepository: PlanningSettingsRepository;
  personRepository: PersonRepository;
  recurringEntryRepository: RecurringEntryRepository;
  subcategoryRepository: SubcategoryRepository;
  transactionRepository: TransactionRepository;
}

export const storeRepositories: StoreRepositories = {
  accountRepository: new AccountRepository(),
  categoryRepository: new CategoryRepository(),
  planningRepository: new PlanningRepository(),
  planningSettingsRepository: new PlanningSettingsRepository(),
  personRepository: new PersonRepository(),
  recurringEntryRepository: new RecurringEntryRepository(),
  subcategoryRepository: new SubcategoryRepository(),
  transactionRepository: new TransactionRepository(),
};
