import { ISODateString, PlanningSettings } from '../types';
import { generateSyncId, getCurrentUserIdOrThrow, getDatabase } from './shared';

interface PlanningSettingsRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  essential_percentage: number;
  non_essential_percentage: number;
  savings_percentage: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface SavePlanningSettingsInput {
  essential_percentage: number;
  non_essential_percentage: number;
  savings_percentage: number;
}

function mapPlanningSettings(row: PlanningSettingsRow): PlanningSettings {
  return row;
}

export class PlanningSettingsRepository {
  async getLatest(): Promise<PlanningSettings | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<PlanningSettingsRow>(
      `
        SELECT *
        FROM planning_settings
        WHERE user_id = ?
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `,
      [getCurrentUserIdOrThrow()],
    );

    return row ? mapPlanningSettings(row) : null;
  }

  async save(input: SavePlanningSettingsInput): Promise<PlanningSettings> {
    const db = await getDatabase();
    const current = await this.getLatest();
    const userId = getCurrentUserIdOrThrow();

    if (!current) {
      const result = await db.runAsync(
        `
          INSERT INTO planning_settings (
            sync_id,
            user_id,
            essential_percentage,
            non_essential_percentage,
            savings_percentage
          )
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          generateSyncId(),
          userId,
          input.essential_percentage,
          input.non_essential_percentage,
          input.savings_percentage,
        ],
      );

      const created = await db.getFirstAsync<PlanningSettingsRow>(
        'SELECT * FROM planning_settings WHERE id = ? AND user_id = ?',
        [result.lastInsertRowId, userId],
      );

      if (!created) {
        throw new Error('Failed to create planning settings.');
      }

      return mapPlanningSettings(created);
    }

    await db.runAsync(
      `
        UPDATE planning_settings
        SET
          essential_percentage = ?,
          non_essential_percentage = ?,
          savings_percentage = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        input.essential_percentage,
        input.non_essential_percentage,
        input.savings_percentage,
        current.id,
        userId,
      ],
    );

    const updated = await db.getFirstAsync<PlanningSettingsRow>(
      'SELECT * FROM planning_settings WHERE id = ? AND user_id = ?',
      [current.id, userId],
    );

    if (!updated) {
      throw new Error('Failed to update planning settings.');
    }

    return mapPlanningSettings(updated);
  }
}
