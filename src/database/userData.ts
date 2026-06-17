import { getDatabase } from './connection';

const USER_TABLES = [
  'people',
  'accounts',
  'categories',
  'subcategories',
  'transactions',
  'planning',
  'planning_settings',
] as const;

export async function claimLegacyLocalDataForScope(
  scopeId: string,
  legacyScopeIds: string[] = [],
): Promise<void> {
  const db = await getDatabase();
  const candidateLegacyIds = Array.from(
    new Set(legacyScopeIds.map((item) => item.trim()).filter(Boolean)),
  );

  const existingOwnedRow = await db.getFirstAsync<{ count: number }>(
    `
      SELECT
        (
          (SELECT COUNT(*) FROM accounts WHERE user_id = ?)
          + (SELECT COUNT(*) FROM people WHERE user_id = ?)
          + (SELECT COUNT(*) FROM categories WHERE user_id = ?)
          + (SELECT COUNT(*) FROM subcategories WHERE user_id = ?)
          + (SELECT COUNT(*) FROM transactions WHERE user_id = ?)
          + (SELECT COUNT(*) FROM planning WHERE user_id = ?)
          + (SELECT COUNT(*) FROM planning_settings WHERE user_id = ?)
        ) AS count
    `,
    [scopeId, scopeId, scopeId, scopeId, scopeId, scopeId, scopeId],
  );

  if ((existingOwnedRow?.count ?? 0) > 0) {
    return;
  }

  for (const tableName of USER_TABLES) {
    if (candidateLegacyIds.length > 0) {
      const placeholders = candidateLegacyIds.map(() => '?').join(', ');
      await db.runAsync(
        `UPDATE ${tableName} SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = '' OR user_id IN (${placeholders})`,
        [scopeId, ...candidateLegacyIds],
      );
      continue;
    }

    await db.runAsync(
      `UPDATE ${tableName} SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = ''`,
      [scopeId],
    );
  }

  if (candidateLegacyIds.length > 0) {
    const placeholders = candidateLegacyIds.map(() => '?').join(', ');
    await db.runAsync(
      `UPDATE sync_queue SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = '' OR user_id IN (${placeholders})`,
      [scopeId, ...candidateLegacyIds],
    );
    return;
  }

  await db.runAsync(
    `UPDATE sync_queue SET user_id = ? WHERE user_id IS NULL OR TRIM(user_id) = ''`,
    [scopeId],
  );
}
