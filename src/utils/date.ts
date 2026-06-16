export function createMonthDate(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function getCurrentMonthDate(): Date {
  const now = new Date();
  return createMonthDate(now.getFullYear(), now.getMonth());
}

export function shiftMonth(date: Date, amount: number): Date {
  return createMonthDate(date.getFullYear(), date.getMonth() + amount);
}

export function getLocalMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameLocalMonth(dateIso: string, referenceDate: Date): boolean {
  const date = new Date(dateIso);

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth()
  );
}

export function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export function formatIsoDateInput(dateIso: string): string {
  return formatDateInput(new Date(dateIso));
}

export function parseDateInputToIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString();
}

export function getLocalDateKey(dateIso: string): string {
  return formatIsoDateInput(dateIso);
}

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}
