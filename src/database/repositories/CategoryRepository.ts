import { Category, ISODateString, TransactionType } from '../types';
import {
  fromDatabaseBoolean,
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
  toDatabaseBoolean,
} from './shared';

interface CategoryRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  is_system: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateCategoryInput {
  name: string;
  type: TransactionType;
  color?: string | null;
  icon?: string | null;
  is_system?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: TransactionType;
  color?: string | null;
  icon?: string | null;
  is_system?: boolean;
}

function mapCategory(row: CategoryRow): Category {
  return {
    ...row,
    is_system: fromDatabaseBoolean(row.is_system),
  };
}

export class CategoryRepository {
  async create(input: CreateCategoryInput): Promise<Category> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO categories (sync_id, user_id, name, type, color, icon, is_system)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.name,
        input.type,
        input.color ?? null,
        input.icon ?? null,
        toDatabaseBoolean(input.is_system ?? false),
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<Category> {
    return getRequiredById('Category', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Category | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<CategoryRow>(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapCategory(row) : null;
  }

  async getAll(): Promise<Category[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<CategoryRow>(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY name ASC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapCategory);
  }

  async update(id: number, input: UpdateCategoryInput): Promise<Category> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE categories
        SET
          name = ?,
          type = ?,
          color = ?,
          icon = ?,
          is_system = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.name, current.name),
        resolveUpdateValue(input.type, current.type),
        resolveUpdateValue(input.color, current.color),
        resolveUpdateValue(input.icon, current.icon),
        toDatabaseBoolean(resolveUpdateValue(input.is_system, current.is_system)),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM categories WHERE id = ? AND user_id = ?', [
      id,
      getCurrentUserIdOrThrow(),
    ]);
  }
}
