import { ISODateString, RecurringEntry, TransactionType } from '../types';
import {
  fromDatabaseBoolean,
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
  toDatabaseBoolean,
} from './shared';

interface RecurringEntryRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  account_id: number | null;
  person_id: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  name: string;
  type: TransactionType;
  group_type: 'fixed' | 'variable';
  amount: number;
  day_of_month: number;
  notes: string | null;
  is_active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateRecurringEntryInput {
  account_id?: number | null;
  person_id?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  name: string;
  type: TransactionType;
  group_type: 'fixed' | 'variable';
  amount: number;
  day_of_month: number;
  notes?: string | null;
  is_active?: boolean;
}

export interface UpdateRecurringEntryInput {
  account_id?: number | null;
  person_id?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  name?: string;
  type?: TransactionType;
  group_type?: 'fixed' | 'variable';
  amount?: number;
  day_of_month?: number;
  notes?: string | null;
  is_active?: boolean;
}

function mapRecurringEntry(row: RecurringEntryRow): RecurringEntry {
  return {
    ...row,
    is_active: fromDatabaseBoolean(row.is_active),
  };
}

export class RecurringEntryRepository {
  async create(input: CreateRecurringEntryInput): Promise<RecurringEntry> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
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
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.account_id ?? null,
        input.person_id ?? null,
        input.category_id ?? null,
        input.subcategory_id ?? null,
        input.name,
        input.type,
        input.group_type,
        input.amount,
        input.day_of_month,
        input.notes ?? null,
        toDatabaseBoolean(input.is_active ?? true),
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<RecurringEntry> {
    return getRequiredById('Recurring entry', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<RecurringEntry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<RecurringEntryRow>(
      'SELECT * FROM recurring_entries WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapRecurringEntry(row) : null;
  }

  async getAll(): Promise<RecurringEntry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<RecurringEntryRow>(
      'SELECT * FROM recurring_entries WHERE user_id = ? ORDER BY day_of_month ASC, name COLLATE NOCASE ASC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapRecurringEntry);
  }

  async update(
    id: number,
    input: UpdateRecurringEntryInput,
  ): Promise<RecurringEntry> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE recurring_entries
        SET
          account_id = ?,
          person_id = ?,
          category_id = ?,
          subcategory_id = ?,
          name = ?,
          type = ?,
          group_type = ?,
          amount = ?,
          day_of_month = ?,
          notes = ?,
          is_active = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.account_id, current.account_id),
        resolveUpdateValue(input.person_id, current.person_id),
        resolveUpdateValue(input.category_id, current.category_id),
        resolveUpdateValue(input.subcategory_id, current.subcategory_id),
        resolveUpdateValue(input.name, current.name),
        resolveUpdateValue(input.type, current.type),
        resolveUpdateValue(input.group_type, current.group_type),
        resolveUpdateValue(input.amount, current.amount),
        resolveUpdateValue(input.day_of_month, current.day_of_month),
        resolveUpdateValue(input.notes, current.notes),
        toDatabaseBoolean(resolveUpdateValue(input.is_active, current.is_active)),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM recurring_entries WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );
  }
}
