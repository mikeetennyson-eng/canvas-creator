import { verifyToken as verifyJWT } from '../config/jwt.js';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

async function parseBody(req) {
  if (req.body) return req.body;
  if (req.on) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => {
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

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    await connectDB();

    const body = await parseBody(req);
    const { token } = body;

    if (!token) {
      res.status(400).json({ message: 'Token required' });
      return;
    }

    const decoded = verifyJWT(token);
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Token verified',
      user: { id: user._id, email: user.email },
    });
  } catch (error) {
    console.error('[Verify] Error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}
