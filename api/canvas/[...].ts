import { handleCanvas } from '../handlers.js';

export default async function handler(req: any, res: any): Promise<void> {
  try {
    console.log('[Canvas Route] Handling request:', req.method, req.url);
    const result = await handleCanvas(req);
    
    // Handle Response object
    if (result instanceof Response) {
      const data = await result.json();
      res.status(result.status).json(data);
    } else {
      // Fallback for other response types
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('[Canvas Catch-All Error]:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
