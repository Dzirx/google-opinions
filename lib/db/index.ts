import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Try to load .env.local if DATABASE_URL is not set (for standalone scripts)
if (!process.env.DATABASE_URL) {
  try {
    const { config } = require('dotenv');
    const { resolve } = require('path');
    config({ path: resolve(process.cwd(), '.env.local') });
  } catch (error) {
    // Ignore if dotenv is not available
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Connection for queries
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });
