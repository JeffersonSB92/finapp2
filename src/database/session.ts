let currentDatabaseUserId: string | null = null;
let currentAuthenticatedUserId: string | null = null;

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

export function setCurrentAuthenticatedUserId(userId: string | null): void {
  currentAuthenticatedUserId = userId;
}

export function getCurrentAuthenticatedUserId(): string | null {
  return currentAuthenticatedUserId;
}

export function requireCurrentAuthenticatedUserId(): string {
  if (!currentAuthenticatedUserId) {
    throw new Error('No authenticated Supabase user available.');
  }

  return currentAuthenticatedUserId;
}
