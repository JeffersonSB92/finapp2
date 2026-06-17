import { ISODateString, Person } from '../types';
import {
  fromDatabaseBoolean,
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
  toDatabaseBoolean,
} from './shared';

interface PersonRow {
  id: number;
  sync_id: string;
  user_id: string;
  auth_user_id: string | null;
  last_synced_at: ISODateString | null;
  name: string;
  color: string | null;
  is_active: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

interface SyncIdRow {
  sync_id: string;
}

export interface CreatePersonInput {
  auth_user_id?: string | null;
  name: string;
  color?: string | null;
  is_active?: boolean;
}

export interface UpdatePersonInput {
  auth_user_id?: string | null;
  name?: string;
  color?: string | null;
  is_active?: boolean;
}

export interface MergePeopleResult {
  accountSyncIds: string[];
  sourcePerson: Person;
  targetPerson: Person;
  transactionSyncIds: string[];
}

function mapPerson(row: PersonRow): Person {
  return {
    ...row,
    is_active: fromDatabaseBoolean(row.is_active),
  };
}

export class PersonRepository {
  async create(input: CreatePersonInput): Promise<Person> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO people (
          sync_id,
          user_id,
          auth_user_id,
          name,
          color,
          is_active
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.auth_user_id ?? null,
        input.name,
        input.color ?? null,
        toDatabaseBoolean(input.is_active ?? true),
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<Person> {
    return getRequiredById('Person', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Person | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PersonRow>(
      'SELECT * FROM people WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapPerson(row) : null;
  }

  async getAll(): Promise<Person[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PersonRow>(
      'SELECT * FROM people WHERE user_id = ? ORDER BY name ASC, id ASC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapPerson);
  }

  async findByAuthUserId(authUserId: string): Promise<Person | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PersonRow>(
      'SELECT * FROM people WHERE auth_user_id = ? AND user_id = ? LIMIT 1',
      [authUserId, getCurrentUserIdOrThrow()],
    );

    return row ? mapPerson(row) : null;
  }

  async findFirstUnlinkedByName(name: string): Promise<Person | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PersonRow>(
      `
        SELECT *
        FROM people
        WHERE user_id = ?
          AND auth_user_id IS NULL
          AND LOWER(TRIM(name)) = LOWER(TRIM(?))
        ORDER BY id ASC
        LIMIT 1
      `,
      [getCurrentUserIdOrThrow(), name],
    );

    return row ? mapPerson(row) : null;
  }

  async mergePeople(
    sourceId: number,
    targetId: number,
  ): Promise<MergePeopleResult | null> {
    if (sourceId === targetId) {
      return null;
    }

    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const sourcePerson = await this.getById(sourceId);
    const targetPerson = await this.getById(targetId);
    const accountRows = await db.getAllAsync<SyncIdRow>(
      `
        SELECT sync_id
        FROM accounts
        WHERE owner_person_id = ? AND user_id = ?
      `,
      [sourceId, userId],
    );
    const transactionRows = await db.getAllAsync<SyncIdRow>(
      `
        SELECT sync_id
        FROM transactions
        WHERE person_id = ? AND user_id = ?
      `,
      [sourceId, userId],
    );

    await db.runAsync(
      `
        UPDATE accounts
        SET owner_person_id = ?, updated_at = datetime('now'), last_synced_at = NULL
        WHERE owner_person_id = ? AND user_id = ?
      `,
      [targetId, sourceId, userId],
    );

    await db.runAsync(
      `
        UPDATE transactions
        SET person_id = ?, updated_at = datetime('now'), last_synced_at = NULL
        WHERE person_id = ? AND user_id = ?
      `,
      [targetId, sourceId, userId],
    );

    await db.runAsync(
      'DELETE FROM people WHERE id = ? AND user_id = ?',
      [sourceId, userId],
    );

    return {
      accountSyncIds: accountRows.map((row) => row.sync_id),
      sourcePerson,
      targetPerson,
      transactionSyncIds: transactionRows.map((row) => row.sync_id),
    };
  }

  async update(id: number, input: UpdatePersonInput): Promise<Person> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE people
        SET
          auth_user_id = ?,
          name = ?,
          color = ?,
          is_active = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.auth_user_id, current.auth_user_id),
        resolveUpdateValue(input.name, current.name),
        resolveUpdateValue(input.color, current.color),
        toDatabaseBoolean(resolveUpdateValue(input.is_active, current.is_active)),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();

    const usage = await db.getFirstAsync<{
      accounts_count: number;
      transactions_count: number;
    }>(
      `
        SELECT
          (SELECT COUNT(*) FROM accounts WHERE owner_person_id = ? AND user_id = ?) AS accounts_count,
          (SELECT COUNT(*) FROM transactions WHERE person_id = ? AND user_id = ?) AS transactions_count
      `,
      [id, getCurrentUserIdOrThrow(), id, getCurrentUserIdOrThrow()],
    );

    if ((usage?.accounts_count ?? 0) > 0 || (usage?.transactions_count ?? 0) > 0) {
      throw new Error(
        'Essa pessoa ainda está vinculada a contas ou transações. Reatribua esses registros antes de remover.',
      );
    }

    const current = await this.getById(id);

    if (current.auth_user_id) {
      throw new Error(
        'Essa pessoa está vinculada a um usuário autenticado e não pode ser removida manualmente.',
      );
    }

    await db.runAsync('DELETE FROM people WHERE id = ? AND user_id = ?', [
      id,
      getCurrentUserIdOrThrow(),
    ]);
  }
}
