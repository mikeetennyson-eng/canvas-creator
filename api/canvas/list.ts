import { verifyToken as verifyJWT } from '../config/jwt.js';
import Canvas from '../models/Canvas.js';
import { connectDB } from '../config/db.js';

function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    await connectDB();

    const authHeader = getHeader(req.headers, 'authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    let userId: string;
    try {
      const decoded = verifyJWT(token);
      userId = decoded.id;
    } catch {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const canvases = await Canvas.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json({ message: 'Canvases retrieved', canvases });
  } catch (error) {
    console.error('[Canvas List] Error:', error);
    res.status(500).json({ message: 'Failed to fetch canvases' });
  }
}
