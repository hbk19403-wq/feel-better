import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// ── PostgreSQL pool (Supabase) ────────────────────────────────────────────────
let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL env var is required');
    _pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
    });
    _pool.on('error', (err) => console.error('PG pool error:', err));
  }
  return _pool;
}

// ── Async query helpers ────────────────────────────────────────────────────────

export async function dbAll<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res: QueryResult<T> = await getPool().query(sql, params);
  return res.rows;
}

export async function dbGet<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const res: QueryResult<T> = await getPool().query(sql, params);
  return res.rows[0];
}

export async function dbRun(sql: string, params: unknown[] = []): Promise<void> {
  await getPool().query(sql, params);
}

export async function dbExec(sql: string): Promise<void> {
  await getPool().query(sql);
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
