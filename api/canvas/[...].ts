import { handleCanvas } from '../handlers.js';

export default async function handler(req: any): Promise<Response> {
  try {
    return handleCanvas(req);
  } catch (error) {
    console.error('[Canvas Catch-All Error]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
