import { verifyToken as verifyJWT } from '../config/jwt.js';
import Canvas from '../models/Canvas.js';
import { connectDB } from '../config/db.js';

function getHeader(headers, name) {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

export default async function handler(req, res) {
  try {
    await connectDB();

    const authHeader = getHeader(req.headers, 'authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    let userId;
    try {
      const decoded = verifyJWT(token);
      userId = decoded.id;
    } catch {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const canvasId = req.query.id;

    if (req.method === 'GET') {
      try {
        const canvas = await Canvas.findOne({ _id: canvasId, userId });

        if (!canvas) {
          res.status(404).json({ message: 'Canvas not found' });
          return;
        }

        res.status(200).json({ message: 'Canvas retrieved', canvas });
      } catch (error) {
        console.error('[Canvas Get] Error:', error);
        res.status(500).json({ message: 'Failed to fetch canvas' });
      }
      return;
    }

    if (req.method === 'DELETE') {
      try {
        const result = await Canvas.findOneAndDelete({ _id: canvasId, userId });

        if (!result) {
          res.status(404).json({ message: 'Canvas not found' });
          return;
        }

        res.status(200).json({ message: 'Canvas deleted' });
      } catch (error) {
        console.error('[Canvas Delete] Error:', error);
        res.status(500).json({ message: 'Failed to delete canvas' });
      }
      return;
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('[Canvas] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
