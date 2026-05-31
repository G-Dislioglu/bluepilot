import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.BLUEPILOT_BUILDER_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('BLUEPILOT_BUILDER_DATABASE_URL is required for Bluepilot Builder database operations');
  }

  const sql = neon(databaseUrl);
  dbInstance = drizzle(sql);
  return dbInstance;
}
