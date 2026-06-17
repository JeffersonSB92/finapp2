import {
  AccountRepository,
  CategoryRepository,
  PlanningRepository,
  PlanningSettingsRepository,
  PersonRepository,
  SubcategoryRepository,
  TransactionRepository,
} from '../database';

export interface StoreRepositories {
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
  planningRepository: PlanningRepository;
  planningSettingsRepository: PlanningSettingsRepository;
  personRepository: PersonRepository;
  subcategoryRepository: SubcategoryRepository;
  transactionRepository: TransactionRepository;
}

export const storeRepositories: StoreRepositories = {
  accountRepository: new AccountRepository(),
  categoryRepository: new CategoryRepository(),
  planningRepository: new PlanningRepository(),
  planningSettingsRepository: new PlanningSettingsRepository(),
  personRepository: new PersonRepository(),
  subcategoryRepository: new SubcategoryRepository(),
  transactionRepository: new TransactionRepository(),
};
