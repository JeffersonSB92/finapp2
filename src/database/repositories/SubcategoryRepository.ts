import { ISODateString, Subcategory } from '../types';
import {
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
} from './shared';

interface SubcategoryRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  category_id: number;
  name: string;
  color: string | null;
  icon: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

function mapSubcategory(row: SubcategoryRow): Subcategory {
  return row;
}

export interface CreateSubcategoryInput {
  category_id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
}

export interface UpdateSubcategoryInput {
  category_id?: number;
  name?: string;
  color?: string | null;
  icon?: string | null;
}

export class SubcategoryRepository {
  async create(input: CreateSubcategoryInput): Promise<Subcategory> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO subcategories (sync_id, user_id, category_id, name, color, icon)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.category_id,
        input.name,
        input.color ?? null,
        input.icon ?? null,
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<Subcategory> {
    return getRequiredById('Subcategory', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Subcategory | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<SubcategoryRow>(
      'SELECT * FROM subcategories WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapSubcategory(row) : null;
  }

  async getAll(): Promise<Subcategory[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SubcategoryRow>(
      'SELECT * FROM subcategories WHERE user_id = ? ORDER BY name ASC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapSubcategory);
  }

  async getByCategoryId(categoryId: number): Promise<Subcategory[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<SubcategoryRow>(
      'SELECT * FROM subcategories WHERE category_id = ? AND user_id = ? ORDER BY name ASC',
      [categoryId, getCurrentUserIdOrThrow()],
    );

    return rows.map(mapSubcategory);
  }

  async update(id: number, input: UpdateSubcategoryInput): Promise<Subcategory> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE subcategories
        SET
          category_id = ?,
          name = ?,
          color = ?,
          icon = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.category_id, current.category_id),
        resolveUpdateValue(input.name, current.name),
        resolveUpdateValue(input.color, current.color),
        resolveUpdateValue(input.icon, current.icon),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const usage = await db.getFirstAsync<{
      planning_count: number;
      transactions_count: number;
    }>(
      `
        SELECT
          (SELECT COUNT(*) FROM transactions WHERE subcategory_id = ? AND user_id = ?) AS transactions_count,
          (SELECT COUNT(*) FROM planning WHERE subcategory_id = ? AND user_id = ?) AS planning_count
      `,
      [id, userId, id, userId],
    );

    if ((usage?.transactions_count ?? 0) > 0 || (usage?.planning_count ?? 0) > 0) {
      throw new Error(
        'Essa subcategoria está vinculada a transações ou planejamentos. Reatribua esses registros antes de excluir.',
      );
    }

    await db.runAsync('DELETE FROM subcategories WHERE id = ? AND user_id = ?', [id, userId]);
  }
}
