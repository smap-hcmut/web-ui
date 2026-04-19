/**
 * Database Connection (Read-Only)
 *
 * Connects to the SMAP PostgreSQL database using the metabase_readonly user.
 * Used by /api/analytics/* routes for dashboard data.
 *
 * Singleton pattern prevents connection leaks during Next.js hot-reload.
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://metabase_readonly:metabase_readonly@172.16.19.10:5432/smap';

// Singleton pool — survives Next.js hot-reload in dev
const globalForDb = globalThis as unknown as { pgPool: Pool | undefined };

function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: DATABASE_URL,
      max: 5, // read-only, low concurrency is fine
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return globalForDb.pgPool;
}

export const db = drizzle(getPool(), { schema });
export { schema };
