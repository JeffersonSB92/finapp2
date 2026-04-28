import { getDatabase } from './connection';

const USER_TABLES = [
  'accounts',
  'categories',
  'subcategories',
  'transactions',
  'planning',
  'planning_settings',
] as const;

export async function claimLegacyLocalDataForUser(userId: string): Promise<void> {
  const db = await getDatabase();

  const existingOwnedRow = await db.getFirstAsync<{ count: number }>(
    `
      SELECT
        (
          (SELECT COUNT(*) FROM accounts WHERE user_id = ?)
          + (SELECT COUNT(*) FROM categories WHERE user_id = ?)
          + (SELECT COUNT(*) FROM transactions WHERE user_id = ?)
          + (SELECT COUNT(*) FROM planning WHERE user_id = ?)
          + (SELECT COUNT(*) FROM planning_settings WHERE user_id = ?)
        ) AS count
    `,
    [userId, userId, userId, userId, userId],
  );

  if ((existingOwnedRow?.count ?? 0) > 0) {
    return;
  }

  for (const tableName of USER_TABLES) {
    await db.runAsync(
      `UPDATE ${tableName} SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = ''`,
      [userId],
    );
  }

  await db.runAsync(
    `UPDATE sync_queue SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = ''`,
    [userId],
  );
}
