import { NextApiRequest, NextApiResponse } from 'next';
import Canvas from '../models/Canvas.js';
import { verifyToken } from '../config/jwt.js';
import '../_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
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

    const { _id, title, description, canvasData, thumbnail } = req.body;

    if (!title || !canvasData) {
      return res.status(400).json({ message: 'Title and canvas data are required' });
    }

    let canvas;

    if (req.method === 'PUT' && _id) {
      // Update existing canvas
      canvas = await Canvas.findByIdAndUpdate(
        _id,
        {
          title,
          description,
          canvasData,
          ...(thumbnail && { thumbnail }),
        },
        { new: true, runValidators: true }
      );

      if (!canvas) {
        return res.status(404).json({ message: 'Canvas not found' });
      }

      // Verify ownership
      if (canvas.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this canvas' });
      }
    } else {
      // Create new canvas
      canvas = await Canvas.create({
        userId,
        title,
        description,
        canvasData,
        ...(thumbnail && { thumbnail }),
      });
    }

    res.status(req.method === 'PUT' ? 200 : 201).json({
      message: req.method === 'PUT' ? 'Canvas updated' : 'Canvas saved',
      canvas: {
        _id: canvas._id,
        title: canvas.title,
        description: canvas.description,
        createdAt: canvas.createdAt,
        updatedAt: canvas.updatedAt,
      },
    });
  } catch (error) {
    console.error('Canvas save error:', error);
    res.status(500).json({
      message: 'Error saving canvas',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
