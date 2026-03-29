import { verifyToken as verifyJWT } from '../config/jwt.js';

function getHeader(headers, name) {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    const authHeader = getHeader(req.headers, 'authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    try {
      verifyJWT(token);
      res.status(200).json({ message: 'Access granted' });
    } catch {
      res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    console.error('[Protected] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
