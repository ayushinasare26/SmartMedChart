import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// On Vercel / serverless runtimes, copy pre-seeded SQLite db to writable /tmp
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/smartmed.db';
  if (!fs.existsSync(tmpDbPath)) {
    const candidatePaths = [
      path.join(process.cwd(), 'prisma', 'smartmed.db'),
      path.join(__dirname, '..', '..', 'prisma', 'smartmed.db'),
      path.join(__dirname, '..', 'prisma', 'smartmed.db'),
      path.join(__dirname, 'smartmed.db'),
    ];
    for (const src of candidatePaths) {
      if (fs.existsSync(src)) {
        try {
          fs.copyFileSync(src, tmpDbPath);
          console.log(`[Vercel] Successfully initialized database at ${tmpDbPath} from ${src}`);
          break;
        } catch (err) {
          console.error('[Vercel] Failed to copy database:', err);
        }
      }
    }
  }
  process.env.DATABASE_URL = `file:${tmpDbPath}`;
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasourceUrl: process.env.VERCEL ? 'file:/tmp/smartmed.db' : undefined,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
