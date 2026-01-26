import { PrismaClient } from '@prisma/client';

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

// Validate DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please configure it in .env.local');
}

// Global Prisma client instance (singleton pattern)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client
export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Export Prisma client as default
export default db;
