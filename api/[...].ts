import { VercelRequest, VercelResponse } from '@vercel/node';
import app, { connectDatabase } from './_middleware';

export default async (req: VercelRequest, res: VercelResponse) => {
  // Ensure database connection
  await connectDatabase();
  
  // Handle the request through Express
  app(req as any, res as any);
};
