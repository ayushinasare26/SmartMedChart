import type { VercelRequest, VercelResponse } from '@vercel/node';

let appInstance: any = null;
let loadError: any = null;

try {
  // Lazily load express server
  appInstance = require('../server/server').default;
} catch (err: any) {
  console.error('[Vercel Module Load Error]:', err);
  loadError = err;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (loadError) {
    return res.status(500).json({
      error: 'Module initialization failed',
      message: loadError.message,
      stack: loadError.stack,
    });
  }

  try {
    return appInstance(req, res);
  } catch (err: any) {
    console.error('[Vercel Invocation Error]:', err);
    return res.status(500).json({
      error: 'Serverless invocation error',
      message: err?.message,
      stack: err?.stack,
    });
  }
}
