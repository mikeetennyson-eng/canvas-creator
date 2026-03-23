import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../controllers/authController.js';
import '../_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await verifyToken(req, res);
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      message: 'Error during token verification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}