import { handleAuth, handleCanvas } from './handlers.js';

export default async function handler(req: any): Promise<Response> {
  const host = req.headers.get?.('host') || req.headers['host'] || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  const path = url.pathname;

  console.log(`[Vercel Main] ${req.method} ${path}`);

  try {
    if (path === '/api/health') {
      return new Response(
        JSON.stringify({
          message: 'Server is running',
          timestamp: new Date(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // This catch-all shouldn't be hit since auth/ and canvas/ have their own routes
    console.log('[Vercel Main] Unhandled path, returning 404');
    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[Vercel Main Error]:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
