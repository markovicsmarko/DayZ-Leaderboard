import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'database.json');

export function getDatabaseUrl(): string {
  // 1. Check environment variable (highest priority, good for Vercel/Docker deployments)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // 2. Read from local config file (written by the Setup Wizard)
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (configData && configData.databaseUrl) {
        return configData.databaseUrl;
      }
    }
  } catch (err) {
    console.error('[PrismaInit] Error reading database config file:', err);
  }

  // 3. Placeholder fallback to allow build step (Prisma needs a valid connection format)
  return 'mysql://root:password@127.0.0.1:3306/dayz_leaderboard';
}

export function getApiKey(): string {
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }

  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (configData && configData.apiKey) {
        return configData.apiKey;
      }
    }
  } catch (err) {
    console.error('[ConfigInit] Error reading API key:', err);
  }

  return 'CHANGE_ME';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
