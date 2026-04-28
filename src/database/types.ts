export type ISODateString = string;

export interface SyncMetadata {
  sync_id: string;
  last_synced_at: ISODateString | null;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

export enum AccountType {
  CASH = 'cash',
  CHECKING = 'checking',
  SAVINGS = 'savings',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

export interface Account extends SyncMetadata {
  id: number;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Category extends SyncMetadata {
  id: number;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Subcategory extends SyncMetadata {
  id: number;
  user_id: string;
  category_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Transaction extends SyncMetadata {
  id: number;
  user_id: string;
  account_id: number;
  destination_account_id: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  notes: string | null;
  is_paid: boolean;
  transaction_date: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Planning extends SyncMetadata {
  id: number;
  user_id: string;
  year: number;
  month: number;
  category_id: number;
  subcategory_id: number | null;
  planned_amount: number;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PlanningSettings extends SyncMetadata {
  id: number;
  user_id: string;
  essential_percentage: number;
  non_essential_percentage: number;
  savings_percentage: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}
