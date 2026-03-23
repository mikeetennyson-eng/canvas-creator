import { NextApiRequest, NextApiResponse } from 'next';
import { signup } from '../../../backend/src/controllers/authController.js';
import '../../../api/_db-init.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await signup(req, res);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Error during signup',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}