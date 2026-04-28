import { ISODateString, Planning } from '../types';
import {
  generateSyncId,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
} from './shared';

interface PlanningRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  year: number;
  month: number;
  category_id: number;
  subcategory_id: number | null;
  planned_amount: number;
  notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreatePlanningInput {
  year: number;
  month: number;
  category_id: number;
  subcategory_id?: number | null;
  planned_amount: number;
  notes?: string | null;
}

export interface UpdatePlanningInput {
  year?: number;
  month?: number;
  category_id?: number;
  subcategory_id?: number | null;
  planned_amount?: number;
  notes?: string | null;
}

function mapPlanning(row: PlanningRow): Planning {
  return row;
}

export class PlanningRepository {
  async create(input: CreatePlanningInput): Promise<Planning> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO planning (
          sync_id,
          user_id,
          year,
          month,
          category_id,
          subcategory_id,
          planned_amount,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        generateSyncId(),
        userId,
        input.year,
        input.month,
        input.category_id,
        input.subcategory_id ?? null,
        input.planned_amount,
        input.notes ?? null,
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async getById(id: number): Promise<Planning> {
    return getRequiredById('Planning', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Planning | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PlanningRow>(
      'SELECT * FROM planning WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapPlanning(row) : null;
  }

  async getAll(): Promise<Planning[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<PlanningRow>(
      'SELECT * FROM planning WHERE user_id = ? ORDER BY year DESC, month DESC, id DESC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapPlanning);
  }

  async update(id: number, input: UpdatePlanningInput): Promise<Planning> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE planning
        SET
          year = ?,
          month = ?,
          category_id = ?,
          subcategory_id = ?,
          planned_amount = ?,
          notes = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.year, current.year),
        resolveUpdateValue(input.month, current.month),
        resolveUpdateValue(input.category_id, current.category_id),
        resolveUpdateValue(input.subcategory_id, current.subcategory_id),
        resolveUpdateValue(input.planned_amount, current.planned_amount),
        resolveUpdateValue(input.notes, current.notes),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM planning WHERE id = ? AND user_id = ?', [
      id,
      getCurrentUserIdOrThrow(),
    ]);
  }
}
