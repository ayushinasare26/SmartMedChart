export default function handler(req: any, res: any) {
  try {
    res.status(200).json({
      status: 'ok',
      msg: 'Vercel serverless works!',
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
}
