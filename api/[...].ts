import { handleAuth, handleCanvas } from './handlers.js';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${path}`);

  try {
    if (path.startsWith('/api/canvas')) {
      return handleCanvas(req);
    }

    if (path.startsWith('/api/auth')) {
      return handleAuth(req);
    }

    if (path === '/api/health') {
      return new Response(
        JSON.stringify({
          message: 'Server is running',
          timestamp: new Date(),
          env: {
            mongodb_connected: !!process.env.MONGODB_URI,
            jwt_secret_exists: !!process.env.JWT_SECRET,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
