let currentDatabaseUserId: string | null = null;

export function setCurrentDatabaseUserId(userId: string | null): void {
  currentDatabaseUserId = userId;
}

export function getCurrentDatabaseUserId(): string | null {
  return currentDatabaseUserId;
}

export function requireCurrentDatabaseUserId(): string {
  if (!currentDatabaseUserId) {
    throw new Error('No authenticated user available for local database access.');
  }

  return currentDatabaseUserId;
}
