import { NextApiRequest, NextApiResponse } from 'next';
import { login } from '../../../backend/src/controllers/authController.js';
import '../../../api/_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await login(req, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error during login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}