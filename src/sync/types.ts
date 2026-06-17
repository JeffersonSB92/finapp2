import type { ISODateString } from '../database';

export type SyncTableName =
  | 'people'
  | 'accounts'
  | 'categories'
  | 'subcategories'
  | 'transactions'
  | 'recurring_entries'
  | 'planning'
  | 'planning_settings';

export type SyncOperation = 'upsert' | 'delete';

export interface SyncQueueRow {
  id: number;
  user_id: string | null;
  table_name: SyncTableName;
  record_sync_id: string;
  operation: SyncOperation;
  payload: string;
  created_at: ISODateString;
  attempts: number;
  last_error: string | null;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  pending: number;
  lastSyncAt: ISODateString | null;
}
