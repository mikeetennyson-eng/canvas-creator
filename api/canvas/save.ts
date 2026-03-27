import { verifyToken as verifyJWT } from '../config/jwt.js';
import Canvas from '../models/Canvas.js';
import { connectDB } from '../config/db.js';

function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

async function parseBody(req: any): Promise<any> {
  if (req.body) return req.body;
  if (req.on) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }
  return req.json();
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (req.method !== 'POST' && req.method !== 'PUT') {
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

    const body = await parseBody(req);
    const { _id, title, description, canvasData, thumbnail } = body;

    if (!title || !canvasData) {
      res.status(400).json({ message: 'Title and canvasData required' });
      return;
    }

    let canvas;
    if (_id) {
      canvas = await Canvas.findByIdAndUpdate(
        _id,
        { title, description, canvasData, thumbnail, updatedAt: new Date() },
        { new: true }
      );
    } else {
      canvas = await Canvas.create({
        userId,
        title,
        description,
        canvasData,
        thumbnail,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    res.status(200).json({ message: 'Canvas saved', canvas });
  } catch (error) {
    console.error('[Canvas Save] Error:', error);
    res.status(500).json({ message: 'Failed to save canvas' });
  }
}
