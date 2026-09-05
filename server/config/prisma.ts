import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { DB_BASE64 } from './dbBackup';

let _prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (_prismaInstance) {
    return _prismaInstance;
  }

  let databaseUrl = process.env.DATABASE_URL || 'file:./smartmed.db';

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/smartmed.db';
    if (!fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0) {
      try {
        let copied = false;
        const candidatePaths = [
          path.join(process.cwd(), 'prisma', 'smartmed.db'),
          path.join(__dirname, '..', '..', 'prisma', 'smartmed.db'),
          path.join(__dirname, '..', 'prisma', 'smartmed.db'),
        ];
        for (const src of candidatePaths) {
          if (fs.existsSync(src) && fs.statSync(src).size > 0) {
            fs.copyFileSync(src, tmpDbPath);
            copied = true;
            console.log(`[Vercel] Copied database from ${src} to ${tmpDbPath}`);
            break;
          }
        }
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

  _prismaInstance = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  return _prismaInstance;
}

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = global.__prisma || getPrismaClient();
    if (process.env.NODE_ENV !== 'production' && !global.__prisma) {
      global.__prisma = client;
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});
