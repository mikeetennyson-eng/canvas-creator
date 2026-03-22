import { VercelRequest, VercelResponse } from '@vercel/node';
import app, { connectDatabase } from './_middleware';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Ensure database connection
    await connectDatabase();
    
    // Handle the request through Express
    return new Promise((resolve) => {
      app(req as any, res as any);
      res.on('finish', resolve);
      res.on('close', resolve);
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};
