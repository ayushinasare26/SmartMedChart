import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { DB_BASE64 } from './dbBackup';

let databaseUrl = process.env.DATABASE_URL || 'file:./smartmed.db';

// On Vercel / serverless runtimes, initialize SQLite db in writable /tmp
if (process.env.VERCEL) {
  const tmpDbPath = '/tmp/smartmed.db';
  if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
    try {
      // 1. Try copying from filesystem if available
      const candidatePaths = [
        path.join(process.cwd(), 'prisma', 'smartmed.db'),
        path.join(__dirname, '..', '..', 'prisma', 'smartmed.db'),
        path.join(__dirname, '..', 'prisma', 'smartmed.db'),
      ];
      let copied = false;
      for (const src of candidatePaths) {
        if (fs.existsSync(src) && fs.statSync(src).size > 0) {
          fs.copyFileSync(src, tmpDbPath);
          copied = true;
          console.log(`[Vercel] Copied database from ${src} to ${tmpDbPath}`);
          break;
        }
      }
      // 2. If not found on disk, decode embedded base64 database
      if (!copied && DB_BASE64) {
        fs.writeFileSync(tmpDbPath, Buffer.from(DB_BASE64, 'base64'));
        console.log(`[Vercel] Restored embedded SQLite database to ${tmpDbPath}`);
      }
    } catch (err) {
      console.error('[Vercel] Error initializing database in /tmp:', err);
    }
  }
  databaseUrl = `file:${tmpDbPath}`;
  process.env.DATABASE_URL = databaseUrl;
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
