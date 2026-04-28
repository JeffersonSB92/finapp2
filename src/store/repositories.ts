import {
  AccountRepository,
  CategoryRepository,
  PlanningRepository,
  PlanningSettingsRepository,
  SubcategoryRepository,
  TransactionRepository,
} from '../database';

export interface StoreRepositories {
  accountRepository: AccountRepository;
  categoryRepository: CategoryRepository;
  planningRepository: PlanningRepository;
  planningSettingsRepository: PlanningSettingsRepository;
  subcategoryRepository: SubcategoryRepository;
  transactionRepository: TransactionRepository;
}

export const storeRepositories: StoreRepositories = {
  accountRepository: new AccountRepository(),
  categoryRepository: new CategoryRepository(),
  planningRepository: new PlanningRepository(),
  planningSettingsRepository: new PlanningSettingsRepository(),
  subcategoryRepository: new SubcategoryRepository(),
  transactionRepository: new TransactionRepository(),
};
