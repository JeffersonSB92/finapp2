import { ISODateString, Transaction, TransactionType } from '../types';
import {
  generateSyncId,
  fromDatabaseBoolean,
  getCurrentUserIdOrThrow,
  getDatabase,
  getRequiredById,
  resolveUpdateValue,
  toDatabaseBoolean,
} from './shared';
import { addMonthsToIsoDate } from '../../utils/date';

interface TransactionRow {
  id: number;
  sync_id: string;
  user_id: string;
  last_synced_at: ISODateString | null;
  account_id: number;
  destination_account_id: number | null;
  person_id: number | null;
  installment_group_id: string | null;
  installment_index: number | null;
  installment_count: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  type: TransactionType;
  amount: number;
  description: string | null;
  notes: string | null;
  is_paid: number;
  transaction_date: ISODateString;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface CreateTransactionInput {
  account_id: number;
  destination_account_id?: number | null;
  person_id?: number | null;
  installment_group_id?: string | null;
  installment_index?: number | null;
  installment_count?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  notes?: string | null;
  is_paid?: boolean;
  transaction_date: ISODateString;
}

export interface UpdateTransactionInput {
  account_id?: number;
  destination_account_id?: number | null;
  person_id?: number | null;
  installment_group_id?: string | null;
  installment_index?: number | null;
  installment_count?: number | null;
  category_id?: number | null;
  subcategory_id?: number | null;
  type?: TransactionType;
  amount?: number;
  description?: string | null;
  notes?: string | null;
  is_paid?: boolean;
  transaction_date?: ISODateString;
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    ...row,
    is_paid: fromDatabaseBoolean(row.is_paid),
  };
}

export class TransactionRepository {
  private async createSingle(
    input: CreateTransactionInput,
    syncId = generateSyncId(),
  ): Promise<Transaction> {
    const db = await getDatabase();
    const userId = getCurrentUserIdOrThrow();
    const result = await db.runAsync(
      `
        INSERT INTO transactions (
          sync_id,
          user_id,
          account_id,
          destination_account_id,
          person_id,
          installment_group_id,
          installment_index,
          installment_count,
          category_id,
          subcategory_id,
          type,
          amount,
          description,
          notes,
          is_paid,
          transaction_date
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        syncId,
        userId,
        input.account_id,
        input.destination_account_id ?? null,
        input.person_id ?? null,
        input.installment_group_id ?? null,
        input.installment_index ?? null,
        input.installment_count ?? null,
        input.category_id ?? null,
        input.subcategory_id ?? null,
        input.type,
        input.amount,
        input.description ?? null,
        input.notes ?? null,
        toDatabaseBoolean(input.is_paid ?? true),
        input.transaction_date,
      ],
    );

    return this.getById(result.lastInsertRowId);
  }

  async create(input: CreateTransactionInput): Promise<Transaction> {
    return this.createSingle(input);
  }

  async createInstallmentSeries(
    input: CreateTransactionInput,
    installmentCount: number,
  ): Promise<Transaction[]> {
    if (installmentCount <= 1) {
      return [await this.create(input)];
    }

    const installmentGroupId = generateSyncId();
    const transactions: Transaction[] = [];

    for (let index = 0; index < installmentCount; index += 1) {
      transactions.push(
        await this.createSingle({
          ...input,
          installment_group_id: installmentGroupId,
          installment_index: index + 1,
          installment_count: installmentCount,
          transaction_date: addMonthsToIsoDate(input.transaction_date, index),
        }),
      );
    }

    return transactions;
  }

  async getById(id: number): Promise<Transaction> {
    return getRequiredById('Transaction', id, this.findById.bind(this));
  }

  async findById(id: number): Promise<Transaction | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, getCurrentUserIdOrThrow()],
    );

    return row ? mapTransaction(row) : null;
  }

  async getAll(): Promise<Transaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<TransactionRow>(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC, id DESC',
      [getCurrentUserIdOrThrow()],
    );

    return rows.map(mapTransaction);
  }

  async update(
    id: number,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    const current = await this.getById(id);
    const db = await getDatabase();

    await db.runAsync(
      `
        UPDATE transactions
        SET
          account_id = ?,
          destination_account_id = ?,
          person_id = ?,
          installment_group_id = ?,
          installment_index = ?,
          installment_count = ?,
          category_id = ?,
          subcategory_id = ?,
          type = ?,
          amount = ?,
          description = ?,
          notes = ?,
          is_paid = ?,
          transaction_date = ?,
          updated_at = datetime('now'),
          last_synced_at = NULL
        WHERE id = ? AND user_id = ?
      `,
      [
        resolveUpdateValue(input.account_id, current.account_id),
        resolveUpdateValue(
          input.destination_account_id,
          current.destination_account_id,
        ),
        resolveUpdateValue(input.person_id, current.person_id),
        resolveUpdateValue(
          input.installment_group_id,
          current.installment_group_id,
        ),
        resolveUpdateValue(
          input.installment_index,
          current.installment_index,
        ),
        resolveUpdateValue(
          input.installment_count,
          current.installment_count,
        ),
        resolveUpdateValue(input.category_id, current.category_id),
        resolveUpdateValue(input.subcategory_id, current.subcategory_id),
        resolveUpdateValue(input.type, current.type),
        resolveUpdateValue(input.amount, current.amount),
        resolveUpdateValue(input.description, current.description),
        resolveUpdateValue(input.notes, current.notes),
        toDatabaseBoolean(resolveUpdateValue(input.is_paid, current.is_paid)),
        resolveUpdateValue(input.transaction_date, current.transaction_date),
        id,
        getCurrentUserIdOrThrow(),
      ],
    );

    return this.getById(id);
  }

  async delete(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM transactions WHERE id = ? AND user_id = ?', [
      id,
      getCurrentUserIdOrThrow(),
    ]);
  }
}
