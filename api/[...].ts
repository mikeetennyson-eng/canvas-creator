import { VercelRequest, VercelResponse } from '@vercel/node';
import app from './_middleware';

export default async (req: VercelRequest, res: VercelResponse) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  try {
    return new Promise<void>((resolve, reject) => {
      // Handle the request through Express
      app(req as any, res as any);
      
      // Resolve when response is sent
      res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] Response sent with status ${res.statusCode}`);
        resolve();
      });
      
      res.on('close', () => {
        resolve();
      });
      
      res.on('error', (err) => {
        console.error('Response error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Serverless handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
};
