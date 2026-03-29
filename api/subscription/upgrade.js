import { verifyToken as verifyJWT } from '../config/jwt.js';
import Subscription from '../models/Subscription.js';
import { connectDB } from '../config/db.js';

function getHeader(headers, name) {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

export default async function handler(req, res) {
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

    let userId;
    try {
      const decoded = verifyJWT(token);
      userId = decoded.id;
    } catch {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription = await Subscription.create({
        userId,
        plan: 'professional',
        status: 'active',
        price: 34900,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    } else {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription.plan = 'professional';
      subscription.status = 'active';
      subscription.price = 34900;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.paymentMethod = 'manual';
      subscription.transactionId = `manual_${Date.now()}`;
      await subscription.save();
    }

    res.status(200).json({
      message: 'Subscription upgraded successfully',
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        daysRemaining: Math.ceil((subscription.currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    console.error('[Upgrade] Error:', error);
    res.status(500).json({ message: 'Failed to upgrade subscription' });
  }
}
