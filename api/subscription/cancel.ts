import { verifyToken as verifyJWT } from '../config/jwt.js';
import Subscription from '../models/Subscription.js';
import { connectDB } from '../config/db.js';

function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

export default async function handler(req: any, res: any): Promise<void> {
  try {
    if (req.method !== 'POST') {
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

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      res.status(404).json({ message: 'Subscription not found' });
      return;
    }

    if (subscription.status === 'cancelled') {
      res.status(400).json({ message: 'Subscription already cancelled' });
      return;
    }

    subscription.status = 'cancelled';
    await subscription.save();

    res.status(200).json({
      message: 'Subscription cancelled',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error('[Cancel] Error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
}
