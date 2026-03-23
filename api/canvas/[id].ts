import { NextApiRequest, NextApiResponse } from 'next';
import Canvas from '../../models/Canvas.js';
import { verifyToken } from '../../config/jwt.js';
import '../../_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
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
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'Canvas ID is required' });
    }

    const canvas = await Canvas.findById(id);

    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    // Verify ownership
    if (canvas.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this canvas' });
    }

    if (req.method === 'DELETE') {
      await Canvas.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Canvas deleted' });
    }

    res.status(200).json({
      message: 'Canvas retrieved',
      canvas: {
        _id: canvas._id,
        title: canvas.title,
        description: canvas.description,
        canvasData: canvas.canvasData,
        thumbnail: canvas.thumbnail,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
      },
    });
  } catch (error) {
    console.error('Canvas operation error:', error);
    res.status(500).json({
      message: 'Error processing request',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
