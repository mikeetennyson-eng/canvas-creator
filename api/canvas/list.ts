import { NextApiRequest, NextApiResponse } from 'next';
import Canvas from '../models/Canvas.js';
import { verifyToken } from '../config/jwt.js';
import '../_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get user ID from token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyToken(token);
    const userId = decoded.id;

    // Get last 5 canvases, sorted by updatedAt descending
    const canvases = await Canvas.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('_id title description thumbnail createdAt updatedAt');

    res.status(200).json({
      message: 'Canvases retrieved',
      canvases,
    });
  } catch (error) {
    console.error('Canvas list error:', error);
    res.status(500).json({
      message: 'Error retrieving canvases',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
