import { Account, AccountType, ISODateString } from '../types';
import {
  fromDatabaseBoolean,
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
  toDatabaseBoolean,
} from './shared';

interface AccountRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  color?: string | null;
  icon?: string | null;
  is_active?: boolean;
}

function mapAccount(row: AccountRow): Account {
  return {
    ...row,
    is_active: fromDatabaseBoolean(row.is_active),
  };
}

export class AccountRepository {
  async create(input: CreateAccountInput): Promise<Account> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO accounts (
          sync_id,
          user_id,
          name,
          type,
          balance,
          currency,
          color,
          icon,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.name,
        input.type,
        input.balance ?? 0,
        input.currency ?? 'BRL',
        input.color ?? null,
        input.icon ?? null,
        toDatabaseBoolean(input.is_active ?? true),
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<Account> {
    return getRequiredById('Account', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Account | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<AccountRow>(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapAccount(row) : null;
  }

  async getAll(): Promise<Account[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<AccountRow>(
      'SELECT * FROM accounts WHERE user_id = ? ORDER BY name ASC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapAccount);
  }

  async update(id: number, input: UpdateAccountInput): Promise<Account> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE accounts
        SET
          name = ?,
          type = ?,
          balance = ?,
          currency = ?,
          color = ?,
          icon = ?,
          is_active = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.name, current.name),
        resolveUpdateValue(input.type, current.type),
        resolveUpdateValue(input.balance, current.balance),
        resolveUpdateValue(input.currency, current.currency),
        resolveUpdateValue(input.color, current.color),
        resolveUpdateValue(input.icon, current.icon),
        toDatabaseBoolean(resolveUpdateValue(input.is_active, current.is_active)),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM accounts WHERE id = ? AND user_id = ?', [
      id,
      getCurrentUserIdOrThrow(),
    ]);
  }
}
