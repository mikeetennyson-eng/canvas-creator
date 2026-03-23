import { handleAuth } from '../handlers.js';

export default async function handler(req: Request): Promise<Response> {
  try {
    return handleAuth(req);
  } catch (error) {
    console.error('[Auth Catch-All Error]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
