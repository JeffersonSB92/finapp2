import {
  getCurrentAuthenticatedUserId,
  getCurrentDatabaseUserId,
  getDatabase,
  ISODateString,
} from '../database';
import { generateSyncId } from '../database/repositories/shared';
import { getSupabaseClient } from './supabaseClient';
import type {
  SyncOperation,
  SyncQueueRow,
  SyncResult,
  SyncTableName,
} from './types';

const SYNC_TABLES: SyncTableName[] = [
  'people',
  'accounts',
  'categories',
  'subcategories',
  'planning_settings',
  'transactions',
  'recurring_entries',
  'planning',
];

type LocalRow = Record<string, boolean | number | string | null>;
type RemoteRow = Record<string, boolean | number | string | null | undefined>;

interface RemoteSyncRow extends RemoteRow {
  sync_id: string;
  updated_at: string;
  household_id?: string;
  is_deleted?: boolean | null;
}

function nowIso(): ISODateString {
  return new Date().toISOString();
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 1;
}

function toStringValue(value: unknown): string {
  return typeof value === 'string' ? value : String(value ?? '');
}

function toNumberValue(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

async function getMetadata(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string | null }>(
    'SELECT value FROM sync_metadata WHERE key = ?',
    [key],
  );

  return row?.value ?? null;
}

async function setMetadata(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO sync_metadata (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `,
    [key, value],
  );
}

async function getDeviceId(): Promise<string> {
  const existing = await getMetadata('device_id');

  if (existing) {
    return existing;
  }

  const deviceId = generateSyncId();
  await setMetadata('device_id', deviceId);

  return deviceId;
}

async function getLastSyncCursor(): Promise<string | null> {
  const scopeId = getCurrentDatabaseUserId();
  return scopeId ? getMetadata(`last_sync_cursor:${scopeId}`) : null;
}

async function setLastSyncCursor(value: string): Promise<void> {
  const scopeId = getCurrentDatabaseUserId();

  if (!scopeId) {
    return;
  }

  await setMetadata(`last_sync_cursor:${scopeId}`, value);
}

async function getPendingCount(): Promise<number> {
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return 0;
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sync_queue WHERE user_id = ?',
    [userId],
  );

  return row?.count ?? 0;
}

async function getRowBySyncId(
  tableName: SyncTableName,
  syncId: string,
): Promise<LocalRow | null> {
  const db = await getDatabase();
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return null;
  }

  return (
    (await db.getFirstAsync<LocalRow>(
      `SELECT * FROM ${tableName} WHERE sync_id = ? AND user_id = ?`,
      [syncId, userId],
    )) ?? null
  );
}

async function getRowById(
  tableName: SyncTableName,
  id: number,
): Promise<LocalRow | null> {
  const db = await getDatabase();
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return null;
  }

  return (
    (await db.getFirstAsync<LocalRow>(
      `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`,
      [id, userId],
    )) ?? null
  );
}

async function getRelatedSyncId(
  tableName: SyncTableName,
  id: number | null | undefined,
): Promise<string | null> {
  if (id === null || id === undefined) {
    return null;
  }

  const row = await getRowById(tableName, id);
  return typeof row?.sync_id === 'string' ? row.sync_id : null;
}

async function markRecordSynced(
  tableName: SyncTableName,
  syncId: string,
  syncedAt: ISODateString,
): Promise<void> {
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return;
  }

  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${tableName} SET last_synced_at = ? WHERE sync_id = ? AND user_id = ?`,
    [syncedAt, syncId, userId],
  );
}

async function replaceQueuedMutation(
  tableName: SyncTableName,
  syncId: string,
  operation: SyncOperation,
  payload: LocalRow,
): Promise<void> {
  const db = await getDatabase();
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return;
  }

  await db.runAsync(
    'DELETE FROM sync_queue WHERE user_id = ? AND table_name = ? AND record_sync_id = ?',
    [userId, tableName, syncId],
  );
  await db.runAsync(
    `
      INSERT INTO sync_queue (user_id, table_name, record_sync_id, operation, payload)
      VALUES (?, ?, ?, ?, ?)
    `,
    [userId, tableName, syncId, operation, JSON.stringify(payload)],
  );
}

async function buildRemoteRecord(
  tableName: SyncTableName,
  payload: LocalRow,
  deviceId: string,
): Promise<RemoteRow> {
  const householdId = toStringValue(payload.user_id);
  const authenticatedUserId = getCurrentAuthenticatedUserId();

  if (!authenticatedUserId) {
    throw new Error('No authenticated Supabase user available for sync.');
  }

  if (tableName === 'accounts') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      owner_person_sync_id: await getRelatedSyncId(
        'people',
        payload.owner_person_id as number | null,
      ),
      name: String(payload.name),
      type: String(payload.type),
      balance: Number(payload.balance),
      currency: String(payload.currency),
      color: (payload.color as string | null) ?? null,
      icon: (payload.icon as string | null) ?? null,
      is_active: toBoolean(payload.is_active),
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'people') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      auth_user_id: (payload.auth_user_id as string | null) ?? null,
      name: String(payload.name),
      color: (payload.color as string | null) ?? null,
      is_active: toBoolean(payload.is_active),
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'categories') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      name: String(payload.name),
      type: String(payload.type),
      color: (payload.color as string | null) ?? null,
      icon: (payload.icon as string | null) ?? null,
      is_system: toBoolean(payload.is_system),
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'subcategories') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      category_sync_id: await getRelatedSyncId(
        'categories',
        payload.category_id as number | null,
      ),
      name: String(payload.name),
      color: (payload.color as string | null) ?? null,
      icon: (payload.icon as string | null) ?? null,
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'transactions') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      account_sync_id: await getRelatedSyncId(
        'accounts',
        payload.account_id as number | null,
      ),
      destination_account_sync_id: await getRelatedSyncId(
        'accounts',
        payload.destination_account_id as number | null,
      ),
      person_sync_id: await getRelatedSyncId(
        'people',
        payload.person_id as number | null,
      ),
      installment_group_id: (payload.installment_group_id as string | null) ?? null,
      installment_index:
        typeof payload.installment_index === 'number'
          ? payload.installment_index
          : null,
      installment_count:
        typeof payload.installment_count === 'number'
          ? payload.installment_count
          : null,
      category_sync_id: await getRelatedSyncId(
        'categories',
        payload.category_id as number | null,
      ),
      subcategory_sync_id: await getRelatedSyncId(
        'subcategories',
        payload.subcategory_id as number | null,
      ),
      type: String(payload.type),
      amount: Number(payload.amount),
      description: (payload.description as string | null) ?? null,
      notes: (payload.notes as string | null) ?? null,
      is_paid: toBoolean(payload.is_paid),
      transaction_date: String(payload.transaction_date),
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'recurring_entries') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      account_sync_id: await getRelatedSyncId(
        'accounts',
        payload.account_id as number | null,
      ),
      person_sync_id: await getRelatedSyncId(
        'people',
        payload.person_id as number | null,
      ),
      category_sync_id: await getRelatedSyncId(
        'categories',
        payload.category_id as number | null,
      ),
      subcategory_sync_id: await getRelatedSyncId(
        'subcategories',
        payload.subcategory_id as number | null,
      ),
      name: String(payload.name),
      type: String(payload.type),
      group_type: String(payload.group_type),
      amount: Number(payload.amount),
      day_of_month: Number(payload.day_of_month),
      notes: (payload.notes as string | null) ?? null,
      is_active: toBoolean(payload.is_active),
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  if (tableName === 'planning') {
    return {
      sync_id: String(payload.sync_id),
      user_id: authenticatedUserId,
      household_id: householdId,
      device_id: deviceId,
      year: Number(payload.year),
      month: Number(payload.month),
      category_sync_id: await getRelatedSyncId(
        'categories',
        payload.category_id as number | null,
      ),
      subcategory_sync_id: await getRelatedSyncId(
        'subcategories',
        payload.subcategory_id as number | null,
      ),
      planned_amount: Number(payload.planned_amount),
      notes: (payload.notes as string | null) ?? null,
      created_at: String(payload.created_at),
      updated_at: String(payload.updated_at),
      is_deleted: false,
      deleted_at: null,
    };
  }

  return {
    sync_id: String(payload.sync_id),
    user_id: authenticatedUserId,
    household_id: householdId,
    device_id: deviceId,
    essential_percentage: Number(payload.essential_percentage),
    non_essential_percentage: Number(payload.non_essential_percentage),
    savings_percentage: Number(payload.savings_percentage),
    created_at: String(payload.created_at),
    updated_at: String(payload.updated_at),
    is_deleted: false,
    deleted_at: null,
  };
}

async function buildDeleteRecord(
  tableName: SyncTableName,
  payload: LocalRow,
  deviceId: string,
): Promise<RemoteRow> {
  const base = await buildRemoteRecord(tableName, payload, deviceId);
  const deletedAt = nowIso();

  return {
    ...base,
    updated_at: deletedAt,
    is_deleted: true,
    deleted_at: deletedAt,
  };
}

async function getQueue(): Promise<SyncQueueRow[]> {
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return [];
  }

  const db = await getDatabase();
  return db.getAllAsync<SyncQueueRow>(
    'SELECT * FROM sync_queue WHERE user_id = ? ORDER BY created_at ASC, id ASC',
    [userId],
  );
}

async function fetchRemoteRowsForTable(
  tableName: SyncTableName,
  cursor: string | null,
  scopeId: string,
): Promise<RemoteSyncRow[]> {
  const client = getSupabaseClient();
  const authenticatedUserId = getCurrentAuthenticatedUserId();

  if (!client) {
    return [];
  }

  const mergedRows = new Map<string, RemoteSyncRow>();

  let householdQuery = client
    .from(tableName)
    .select('*')
    .eq('household_id', scopeId)
    .order('updated_at', { ascending: true });

  if (cursor) {
    householdQuery = householdQuery.gte('updated_at', cursor);
  }

  const { data: householdRows, error: householdError } = await householdQuery;

  if (householdError) {
    throw householdError;
  }

  for (const row of (householdRows ?? []) as RemoteSyncRow[]) {
    mergedRows.set(row.sync_id, row);
  }

  if (!authenticatedUserId) {
    return [...mergedRows.values()];
  }

  let legacyQuery = client
    .from(tableName)
    .select('*')
    .eq('user_id', authenticatedUserId)
    .is('household_id', null)
    .order('updated_at', { ascending: true });

  if (cursor) {
    legacyQuery = legacyQuery.gte('updated_at', cursor);
  }

  const { data: legacyRows, error: legacyError } = await legacyQuery;

  if (legacyError) {
    throw legacyError;
  }

  for (const row of (legacyRows ?? []) as RemoteSyncRow[]) {
    if (!mergedRows.has(row.sync_id)) {
      mergedRows.set(row.sync_id, row);
    }
  }

  return [...mergedRows.values()].sort((left, right) =>
    left.updated_at.localeCompare(right.updated_at),
  );
}

async function resolveLocalId(
  tableName: SyncTableName,
  syncId: string | null | undefined,
): Promise<number | null> {
  if (!syncId) {
    return null;
  }

  const db = await getDatabase();
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return null;
  }

  const row = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM ${tableName} WHERE sync_id = ? AND user_id = ?`,
    [syncId, userId],
  );

  return row?.id ?? null;
}

async function deleteLocalBySyncId(
  tableName: SyncTableName,
  syncId: string,
): Promise<void> {
  const userId = getCurrentDatabaseUserId();

  if (!userId) {
    return;
  }

  const db = await getDatabase();
  await db.runAsync(`DELETE FROM ${tableName} WHERE sync_id = ? AND user_id = ?`, [
    syncId,
    userId,
  ]);
}

async function upsertAccount(row: RemoteSyncRow, syncedAt: string): Promise<void> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const ownerPersonId = await resolveLocalId(
    'people',
    row.owner_person_sync_id as string | null,
  );
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO accounts (
        sync_id,
        user_id,
        owner_person_id,
        name,
        type,
        balance,
        currency,
        color,
        icon,
        is_active,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        owner_person_id = excluded.owner_person_id,
        name = excluded.name,
        type = excluded.type,
        balance = excluded.balance,
        currency = excluded.currency,
        color = excluded.color,
        icon = excluded.icon,
        is_active = excluded.is_active,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      ownerPersonId,
      toStringValue(row.name),
      toStringValue(row.type),
      toNumberValue(row.balance),
      toStringValue(row.currency),
      toNullableString(row.color),
      toNullableString(row.icon),
      row.is_active ? 1 : 0,
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );
}

async function upsertPerson(row: RemoteSyncRow, syncedAt: string): Promise<void> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO people (
        sync_id,
        user_id,
        auth_user_id,
        name,
        color,
        is_active,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        auth_user_id = excluded.auth_user_id,
        name = excluded.name,
        color = excluded.color,
        is_active = excluded.is_active,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      toNullableString(row.auth_user_id),
      toStringValue(row.name),
      toNullableString(row.color),
      row.is_active ? 1 : 0,
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );
}

async function upsertCategory(row: RemoteSyncRow, syncedAt: string): Promise<void> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO categories (
        sync_id,
        user_id,
        name,
        type,
        color,
        icon,
        is_system,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        name = excluded.name,
        type = excluded.type,
        color = excluded.color,
        icon = excluded.icon,
        is_system = excluded.is_system,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      toStringValue(row.name),
      toStringValue(row.type),
      toNullableString(row.color),
      toNullableString(row.icon),
      row.is_system ? 1 : 0,
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );
}

async function upsertSubcategory(
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<boolean> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const categoryId = await resolveLocalId(
    'categories',
    row.category_sync_id as string | null,
  );

  if (!categoryId) {
    return false;
  }

  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO subcategories (
        sync_id,
        user_id,
        category_id,
        name,
        color,
        icon,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        category_id = excluded.category_id,
        name = excluded.name,
        color = excluded.color,
        icon = excluded.icon,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      categoryId,
      toStringValue(row.name),
      toNullableString(row.color),
      toNullableString(row.icon),
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );

  return true;
}

async function upsertTransaction(
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<boolean> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const accountId = await resolveLocalId(
    'accounts',
    row.account_sync_id as string | null,
  );

  if (!accountId) {
    return false;
  }

  const destinationAccountId = await resolveLocalId(
    'accounts',
    row.destination_account_sync_id as string | null,
  );
  const personId = await resolveLocalId(
    'people',
    row.person_sync_id as string | null,
  );
  const categoryId = await resolveLocalId(
    'categories',
    row.category_sync_id as string | null,
  );
  const subcategoryId = await resolveLocalId(
    'subcategories',
    row.subcategory_sync_id as string | null,
  );
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO transactions (
        sync_id,
        user_id,
        account_id,
        destination_account_id,
        person_id,
        installment_group_id,
        installment_index,
        installment_count,
        category_id,
        subcategory_id,
        type,
        amount,
        description,
        notes,
        is_paid,
        transaction_date,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        account_id = excluded.account_id,
        destination_account_id = excluded.destination_account_id,
        person_id = excluded.person_id,
        installment_group_id = excluded.installment_group_id,
        installment_index = excluded.installment_index,
        installment_count = excluded.installment_count,
        category_id = excluded.category_id,
        subcategory_id = excluded.subcategory_id,
        type = excluded.type,
        amount = excluded.amount,
        description = excluded.description,
        notes = excluded.notes,
        is_paid = excluded.is_paid,
        transaction_date = excluded.transaction_date,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      accountId,
      destinationAccountId,
      personId,
      toNullableString(row.installment_group_id),
      row.installment_index ? toNumberValue(row.installment_index) : null,
      row.installment_count ? toNumberValue(row.installment_count) : null,
      categoryId,
      subcategoryId,
      toStringValue(row.type),
      toNumberValue(row.amount),
      toNullableString(row.description),
      toNullableString(row.notes),
      row.is_paid ? 1 : 0,
      toStringValue(row.transaction_date),
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );

  return true;
}

async function upsertRecurringEntry(
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<boolean> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const accountId = await resolveLocalId(
    'accounts',
    row.account_sync_id as string | null,
  );
  const personId = await resolveLocalId(
    'people',
    row.person_sync_id as string | null,
  );
  const categoryId = await resolveLocalId(
    'categories',
    row.category_sync_id as string | null,
  );
  const subcategoryId = await resolveLocalId(
    'subcategories',
    row.subcategory_sync_id as string | null,
  );
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO recurring_entries (
        sync_id,
        user_id,
        account_id,
        person_id,
        category_id,
        subcategory_id,
        name,
        type,
        group_type,
        amount,
        day_of_month,
        notes,
        is_active,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        account_id = excluded.account_id,
        person_id = excluded.person_id,
        category_id = excluded.category_id,
        subcategory_id = excluded.subcategory_id,
        name = excluded.name,
        type = excluded.type,
        group_type = excluded.group_type,
        amount = excluded.amount,
        day_of_month = excluded.day_of_month,
        notes = excluded.notes,
        is_active = excluded.is_active,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      accountId,
      personId,
      categoryId,
      subcategoryId,
      toStringValue(row.name),
      toStringValue(row.type),
      toStringValue(row.group_type),
      toNumberValue(row.amount),
      toNumberValue(row.day_of_month),
      toNullableString(row.notes),
      row.is_active ? 1 : 0,
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );

  return true;
}

async function upsertPlanning(
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<boolean> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const categoryId = await resolveLocalId(
    'categories',
    row.category_sync_id as string | null,
  );

  if (!categoryId) {
    return false;
  }

  const subcategoryId = await resolveLocalId(
    'subcategories',
    row.subcategory_sync_id as string | null,
  );
  const db = await getDatabase();

  await db.runAsync(
    `
      INSERT INTO planning (
        sync_id,
        user_id,
        year,
        month,
        category_id,
        subcategory_id,
        planned_amount,
        notes,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        year = excluded.year,
        month = excluded.month,
        category_id = excluded.category_id,
        subcategory_id = excluded.subcategory_id,
        planned_amount = excluded.planned_amount,
        notes = excluded.notes,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      toNumberValue(row.year),
      toNumberValue(row.month),
      categoryId,
      subcategoryId,
      toNumberValue(row.planned_amount),
      toNullableString(row.notes),
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );

  return true;
}

async function upsertPlanningSettings(
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<void> {
  const localScopeId = toStringValue(row.household_id ?? row.user_id);
  const db = await getDatabase();
  await db.runAsync(
    `
      INSERT INTO planning_settings (
        sync_id,
        user_id,
        essential_percentage,
        non_essential_percentage,
        savings_percentage,
        created_at,
        updated_at,
        last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(sync_id) DO UPDATE SET
        user_id = excluded.user_id,
        essential_percentage = excluded.essential_percentage,
        non_essential_percentage = excluded.non_essential_percentage,
        savings_percentage = excluded.savings_percentage,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at,
        last_synced_at = excluded.last_synced_at
    `,
    [
      row.sync_id,
      localScopeId,
      toNumberValue(row.essential_percentage),
      toNumberValue(row.non_essential_percentage),
      toNumberValue(row.savings_percentage),
      toStringValue(row.created_at),
      toStringValue(row.updated_at),
      syncedAt,
    ],
  );
}

async function applyRemoteRow(
  tableName: SyncTableName,
  row: RemoteSyncRow,
  syncedAt: string,
): Promise<boolean> {
  if (row.is_deleted) {
    await deleteLocalBySyncId(tableName, row.sync_id);
    return true;
  }

  if (tableName === 'accounts') {
    await upsertAccount(row, syncedAt);
    return true;
  }

  if (tableName === 'people') {
    await upsertPerson(row, syncedAt);
    return true;
  }

  if (tableName === 'categories') {
    await upsertCategory(row, syncedAt);
    return true;
  }

  if (tableName === 'subcategories') {
    return upsertSubcategory(row, syncedAt);
  }

  if (tableName === 'transactions') {
    return upsertTransaction(row, syncedAt);
  }

  if (tableName === 'recurring_entries') {
    return upsertRecurringEntry(row, syncedAt);
  }

  if (tableName === 'planning') {
    return upsertPlanning(row, syncedAt);
  }

  await upsertPlanningSettings(row, syncedAt);
  return true;
}

export class SyncService {
  async queueUpsert(tableName: SyncTableName, syncId: string): Promise<void> {
    const row = await getRowBySyncId(tableName, syncId);

    if (!row) {
      return;
    }

    await replaceQueuedMutation(tableName, syncId, 'upsert', row);
  }

  async queueDelete<T extends { sync_id: string }>(
    tableName: SyncTableName,
    payload: T,
  ): Promise<void> {
    await replaceQueuedMutation(tableName, payload.sync_id, 'delete', {
      ...(payload as LocalRow),
      updated_at: nowIso(),
    });
  }

  async stageUnsyncedRows(): Promise<void> {
    const userId = getCurrentDatabaseUserId();

    if (!userId) {
      return;
    }

    const db = await getDatabase();

    for (const tableName of SYNC_TABLES) {
      const rows = await db.getAllAsync<LocalRow>(
        `SELECT * FROM ${tableName} WHERE user_id = ? AND last_synced_at IS NULL`,
        [userId],
      );

      for (const row of rows) {
        if (typeof row.sync_id === 'string') {
          await replaceQueuedMutation(tableName, row.sync_id, 'upsert', row);
        }
      }
    }
  }

  async getPendingCount(): Promise<number> {
    return getPendingCount();
  }

  async syncNow(): Promise<SyncResult> {
    const client = getSupabaseClient();
    const scopeId = getCurrentDatabaseUserId();

    if (!client) {
      return {
        pushed: 0,
        pulled: 0,
        pending: await getPendingCount(),
        lastSyncAt:
          (await getMetadata(
            `last_sync_completed_at:${getCurrentDatabaseUserId() ?? 'anonymous'}`,
          )) ?? null,
      };
    }

    if (!scopeId) {
      return {
        pushed: 0,
        pulled: 0,
        pending: await getPendingCount(),
        lastSyncAt: null,
      };
    }

    await this.stageUnsyncedRows();

    const deviceId = await getDeviceId();
    const queue = await getQueue();
    let pushed = 0;

    for (const item of queue) {
      const payload = JSON.parse(item.payload) as LocalRow;
      const remoteRecord =
        item.operation === 'delete'
          ? await buildDeleteRecord(item.table_name, payload, deviceId)
          : await buildRemoteRecord(item.table_name, payload, deviceId);

      const { error } = await client
        .from(item.table_name)
        .upsert(remoteRecord, { onConflict: 'sync_id' });

      if (error) {
        const db = await getDatabase();
        await db.runAsync(
          `
            UPDATE sync_queue
            SET attempts = attempts + 1, last_error = ?
            WHERE id = ?
          `,
          [error.message, item.id],
        );
        throw error;
      }

      if (item.operation === 'upsert') {
        await markRecordSynced(item.table_name, item.record_sync_id, nowIso());
      }

      const db = await getDatabase();
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      pushed += 1;
    }

    const cursor = await getLastSyncCursor();
    const syncedAt = nowIso();
    let pulled = 0;
    let newestCursor = cursor;

    for (const tableName of SYNC_TABLES) {
      const rows = await fetchRemoteRowsForTable(tableName, cursor, scopeId);

      for (const row of rows) {
        const applied = await applyRemoteRow(tableName, row, syncedAt);

        if (applied) {
          pulled += 1;
          if (!newestCursor || row.updated_at > newestCursor) {
            newestCursor = row.updated_at;
          }
        }
      }
    }

    const completedAt = nowIso();

    if (newestCursor) {
      await setLastSyncCursor(newestCursor);
    }

    const userId = getCurrentDatabaseUserId();

    if (userId) {
      await setMetadata(`last_sync_completed_at:${userId}`, completedAt);
    }

    return {
      pushed,
      pulled,
      pending: await getPendingCount(),
      lastSyncAt: completedAt,
    };
  }
}

export const syncService = new SyncService();
