import { getDatabase } from './connection';
import {
  CREATE_INDEXES_STATEMENTS,
  CREATE_TABLES_STATEMENTS,
  PRAGMA_STATEMENTS,
} from './schema';
import { generateSyncId } from './repositories/shared';

const SYNC_TABLES = [
  'people',
  'accounts',
  'categories',
  'subcategories',
  'transactions',
  'recurring_entries',
  'planning',
  'planning_settings',
] as const;

let databaseInitializationPromise: Promise<void> | null = null;

async function ensureColumn(
  tableName: string,
  columnName: string,
  definition: string,
): Promise<void> {
  const db = await getDatabase();
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info('${tableName}')`,
  );
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    await db.execAsync(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`,
    );
  }
}

async function ensureTransactionMigrations(): Promise<void> {
  await ensureColumn('transactions', 'is_paid', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('transactions', 'person_id', 'INTEGER');
  await ensureColumn('transactions', 'installment_group_id', 'TEXT');
  await ensureColumn('transactions', 'installment_index', 'INTEGER');
  await ensureColumn('transactions', 'installment_count', 'INTEGER');
}

async function ensureAccountMigrations(): Promise<void> {
  await ensureColumn('accounts', 'owner_person_id', 'INTEGER');
}

async function ensurePeopleMigrations(): Promise<void> {
  await ensureColumn('people', 'auth_user_id', 'TEXT');
}

async function ensureSyncColumns(): Promise<void> {
  for (const tableName of SYNC_TABLES) {
    await ensureColumn(tableName, 'sync_id', 'TEXT');
    await ensureColumn(tableName, 'user_id', 'TEXT');
    await ensureColumn(tableName, 'last_synced_at', 'TEXT');
  }
}

async function ensureSyncQueueColumns(): Promise<void> {
  await ensureColumn('sync_queue', 'user_id', 'TEXT');
}

async function backfillSyncIds(): Promise<void> {
  const db = await getDatabase();

  for (const tableName of SYNC_TABLES) {
    const rows = await db.getAllAsync<{ id: number }>(
      `SELECT id FROM ${tableName} WHERE sync_id IS NULL OR TRIM(sync_id) = ''`,
    );

    for (const row of rows) {
      await db.runAsync(
        `UPDATE ${tableName} SET sync_id = ? WHERE id = ?`,
        [generateSyncId(), row.id],
      );
    }
  }
}

async function runDatabaseInitialization(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(PRAGMA_STATEMENTS);

  await db.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.execAsync(CREATE_TABLES_STATEMENTS);
  });

  await ensureTransactionMigrations();
  await ensureAccountMigrations();
  await ensurePeopleMigrations();
  await ensureSyncColumns();
  await ensureSyncQueueColumns();
  await backfillSyncIds();
  await db.execAsync(CREATE_INDEXES_STATEMENTS);
}

export async function initDatabase(): Promise<void> {
  if (!databaseInitializationPromise) {
    databaseInitializationPromise = runDatabaseInitialization().finally(() => {
      databaseInitializationPromise = null;
    });
  }

  await databaseInitializationPromise;
}
