import { handleAuth, handleCanvas } from './handlers.js';

export default async function handler(req: any, res: any): Promise<void> {
  const host = req.headers.get?.('host') || req.headers['host'] || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  const path = url.pathname;

  console.log(`[Vercel Main] ${req.method} ${path}`);

  try {
    if (path === '/api/health') {
      res.status(200).json({
        message: 'Server is running',
        timestamp: new Date(),
      });
      return;
    }

    // This catch-all shouldn't be hit since auth/ and canvas/ have their own routes
    console.log('[Vercel Main] Unhandled path, returning 404');
    res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error('[Vercel Main Error]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
