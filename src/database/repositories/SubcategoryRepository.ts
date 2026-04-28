import { ISODateString, Subcategory } from '../types';
import { getCurrentUserIdOrThrow, getDatabase } from './shared';

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

export class SubcategoryRepository {
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
}
