import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { connectDB } from '../config/db.js';
import { generateToken } from '../config/jwt.js';

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
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method not allowed' });
      return;
    }

    await connectDB();

    const body = await parseBody(req);
    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({ name, email, password });

    // Create free subscription
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await Subscription.create({
      userId: user._id,
      plan: 'free',
      status: 'active',
      price: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    const token = generateToken({ id: user._id.toString(), email: user.email });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('[Signup] Error:', error);
    res.status(500).json({ message: 'Signup failed', error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
