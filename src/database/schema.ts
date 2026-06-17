export const PRAGMA_STATEMENTS = `
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
`;

export const CREATE_TABLES_STATEMENTS = `
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    owner_person_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    color TEXT,
    icon TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT,
    FOREIGN KEY (owner_person_id) REFERENCES people(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    color TEXT,
    icon TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS subcategories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    account_id INTEGER NOT NULL,
    destination_account_id INTEGER,
    person_id INTEGER,
    installment_group_id TEXT,
    installment_index INTEGER,
    installment_count INTEGER,
    category_id INTEGER,
    subcategory_id INTEGER,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount REAL NOT NULL,
    description TEXT,
    notes TEXT,
    is_paid INTEGER NOT NULL DEFAULT 1,
    transaction_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (destination_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE RESTRICT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS recurring_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    account_id INTEGER,
    person_id INTEGER,
    category_id INTEGER,
    subcategory_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    group_type TEXT NOT NULL CHECK (group_type IN ('fixed', 'variable')),
    amount REAL NOT NULL,
    day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS people (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    auth_user_id TEXT,
    name TEXT NOT NULL,
    color TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS planning (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    category_id INTEGER NOT NULL,
    subcategory_id INTEGER,
    planned_amount REAL NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
    UNIQUE (year, month, category_id, subcategory_id)
  );

  CREATE TABLE IF NOT EXISTS planning_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_id TEXT UNIQUE,
    user_id TEXT,
    essential_percentage REAL NOT NULL,
    non_essential_percentage REAL NOT NULL,
    savings_percentage REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_synced_at TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    table_name TEXT NOT NULL,
    record_sync_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`;

export const CREATE_INDEXES_STATEMENTS = `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_sync_id
    ON accounts (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_sync_id
    ON categories (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategories_sync_id
    ON subcategories (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_sync_id
    ON transactions (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_entries_sync_id
    ON recurring_entries (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_people_sync_id
    ON people (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_sync_id
    ON planning (sync_id);

  CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_settings_sync_id
    ON planning_settings (sync_id);

  CREATE INDEX IF NOT EXISTS idx_subcategories_category_id
    ON subcategories (category_id);

  CREATE INDEX IF NOT EXISTS idx_accounts_user_id
    ON accounts (user_id);

  CREATE INDEX IF NOT EXISTS idx_people_user_id
    ON people (user_id);

  CREATE INDEX IF NOT EXISTS idx_categories_user_id
    ON categories (user_id);

  CREATE INDEX IF NOT EXISTS idx_subcategories_user_id
    ON subcategories (user_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_user_id
    ON transactions (user_id);

  CREATE INDEX IF NOT EXISTS idx_recurring_entries_user_id
    ON recurring_entries (user_id);

  CREATE INDEX IF NOT EXISTS idx_planning_user_id
    ON planning (user_id);

  CREATE INDEX IF NOT EXISTS idx_planning_settings_user_id
    ON planning_settings (user_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_account_id
    ON transactions (account_id);

  CREATE INDEX IF NOT EXISTS idx_accounts_owner_person_id
    ON accounts (owner_person_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_destination_account_id
    ON transactions (destination_account_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_person_id
    ON transactions (person_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_installment_group_id
    ON transactions (installment_group_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_category_id
    ON transactions (category_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_subcategory_id
    ON transactions (subcategory_id);

  CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date
    ON transactions (transaction_date);

  CREATE INDEX IF NOT EXISTS idx_recurring_entries_day_of_month
    ON recurring_entries (day_of_month);

  CREATE INDEX IF NOT EXISTS idx_recurring_entries_account_id
    ON recurring_entries (account_id);

  CREATE INDEX IF NOT EXISTS idx_recurring_entries_person_id
    ON recurring_entries (person_id);

  CREATE INDEX IF NOT EXISTS idx_recurring_entries_category_id
    ON recurring_entries (category_id);

  CREATE INDEX IF NOT EXISTS idx_planning_period
    ON planning (year, month);

  CREATE INDEX IF NOT EXISTS idx_planning_category_id
    ON planning (category_id);

  CREATE INDEX IF NOT EXISTS idx_planning_subcategory_id
    ON planning (subcategory_id);

  CREATE INDEX IF NOT EXISTS idx_planning_settings_updated_at
    ON planning_settings (updated_at);

  CREATE INDEX IF NOT EXISTS idx_sync_queue_created_at
    ON sync_queue (created_at);

  CREATE INDEX IF NOT EXISTS idx_sync_queue_record
    ON sync_queue (table_name, record_sync_id);

  CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id
    ON sync_queue (user_id);
`;
