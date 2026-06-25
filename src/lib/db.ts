// Uses PostgreSQL (Neon) when DATABASE_URL is set, otherwise SQLite for local dev.

export type Row = Record<string, unknown>;

export interface DB {
  query: (sql: string, params?: unknown[]) => Promise<Row[]>;
  execute: (sql: string, params?: unknown[]) => Promise<{ lastId: number | string }>;
}

let _db: DB | null = null;

export async function getDb(): Promise<DB> {
  if (_db) return _db;

  if (process.env.DATABASE_URL) {
    const { Pool } = await import('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    _db = {
      async query(text, params = []) {
        const result = await pool.query(text, params);
        return result.rows as Row[];
      },
      async execute(text, params = []) {
        const result = await pool.query(text + ' RETURNING id', params);
        return { lastId: (result.rows[0] as Row)?.id as number ?? 0 };
      },
    };

    await initPostgres(_db);
  } else {
    // SQLite for local development
    const Database = (await import('better-sqlite3')).default;
    const path = await import('path');
    const fs = await import('fs');

    const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'reviews.db');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    initSqlite(sqlite);

    _db = {
      async query(text, params = []) {
        // Convert $1/$2 placeholders and Postgres-specific functions for SQLite
        const converted = text
          .replace(/\$\d+/g, '?')
          .replace(/ROUND\(([^,]+)::numeric,/g, 'ROUND($1,')
          .replace(/TO_CHAR\(([^,]+),\s*'YYYY-MM'\)/g, "strftime('%Y-%m', $1)")
          .replace(/::numeric/g, '')
          .replace(/::float/g, '');
        return sqlite.prepare(converted).all(...params) as Row[];
      },
      async execute(text, params = []) {
        const converted = text.replace(/\$\d+/g, '?');
        // Strip RETURNING clause for SQLite
        const stripped = converted.replace(/\s+RETURNING\s+\w+\s*$/i, '');
        const result = sqlite.prepare(stripped).run(...params);
        return { lastId: result.lastInsertRowid as number };
      },
    };
  }

  return _db;
}

function initSqlite(db: import('better-sqlite3').Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      year INTEGER,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comment TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      driver_name TEXT NOT NULL,
      stars INTEGER NOT NULL,
      comment TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Migration: add is_active if missing
  const driverCols = db.prepare("PRAGMA table_info(drivers)").all() as { name: string }[];
  if (!driverCols.find(c => c.name === 'is_active')) {
    db.exec("ALTER TABLE drivers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1");
  }
  // Migration: add customer fields to ratings if missing
  const ratingCols = db.prepare("PRAGMA table_info(ratings)").all() as { name: string }[];
  if (!ratingCols.find(c => c.name === 'customer_name')) {
    db.exec("ALTER TABLE ratings ADD COLUMN customer_name TEXT");
  }
  if (!ratingCols.find(c => c.name === 'customer_contact')) {
    db.exec("ALTER TABLE ratings ADD COLUMN customer_contact TEXT");
  }
}

async function initPostgres(db: DB) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS drivers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      plate TEXT NOT NULL UNIQUE,
      model TEXT NOT NULL,
      year INTEGER,
      driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS ratings (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comment TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS customer_name TEXT`);
  await db.query(`ALTER TABLE ratings ADD COLUMN IF NOT EXISTS customer_contact TEXT`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS alerts (
      id SERIAL PRIMARY KEY,
      driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      driver_name TEXT NOT NULL,
      stars INTEGER NOT NULL,
      comment TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
