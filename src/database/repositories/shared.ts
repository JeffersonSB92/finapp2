import { getDatabase } from '../connection';
import { requireCurrentDatabaseUserId } from '../session';

export function toDatabaseBoolean(value: boolean): number {
  return value ? 1 : 0;
}

export function fromDatabaseBoolean(value: number): boolean {
  return value === 1;
}

export function resolveUpdateValue<T>(
  value: T | undefined,
  currentValue: T,
): T {
  return value === undefined ? currentValue : value;
}

export function generateSyncId(): string {
  const timestamp = Date.now().toString(36);
  const randomSegment = () => Math.random().toString(36).slice(2, 10);

  return `sync_${timestamp}_${randomSegment()}_${randomSegment()}`;
}

export function getCurrentUserIdOrThrow(): string {
  return requireCurrentDatabaseUserId();
}

export async function getRequiredById<T>(
  tableName: string,
  id: number,
  finder: (entityId: number) => Promise<T | null>,
): Promise<T> {
  const entity = await finder(id);

  if (!entity) {
    throw new Error(`${tableName} with id ${id} not found.`);
  }

  return entity;
}

export { getDatabase };
