import { verifyToken as verifyJWT } from './config/jwt.js';
import Subscription from './models/Subscription.js';
import { connectDB } from './config/db.js';

// Helper to get header from Node.js or Web API request objects
function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

// Helper to parse JSON body from Node.js or Web API request objects
async function parseBody(req: any): Promise<any> {
  if (req.body) {
    return req.body;
  }
  
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

export async function handleSubscription(req: any): Promise<Response> {
  try {
    await connectDB();
    
    const host = getHeader(req.headers, 'host') || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    let path = url.pathname;
    
    path = path.split('?')[0].replace(/\/$/, '');

    console.log(`[Subscription] Method: ${req.method}, Path: ${path}`);

    // Get token
    const authHeader = getHeader(req.headers, 'authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(JSON.stringify({ message: 'No token provided' }), { status: 401 });
    }

    let userId: string;
    try {
      const decoded = verifyJWT(token);
      userId = decoded.id;
    } catch {
      return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
    }

    // Get subscription info
    if (path.match(/\/subscription\/info$/) && req.method === 'GET') {
      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        // Create free subscription if doesn't exist (fallback)
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        subscription = await Subscription.create({
          userId,
          plan: 'free',
          status: 'active',
          price: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenewal: false,
        });
      }

      // Check if subscription is expired
      if (subscription.plan === 'professional' && new Date() > subscription.currentPeriodEnd!) {
        subscription.status = 'expired';
        await subscription.save();
      }

      return new Response(
        JSON.stringify({
          message: 'Subscription info retrieved',
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            autoRenewal: subscription.autoRenewal,
            daysRemaining: subscription.plan === 'professional' 
              ? Math.ceil((subscription.currentPeriodEnd!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upgrade to professional plan
    if (path.match(/\/subscription\/upgrade$/) && req.method === 'POST') {
      const body = await parseBody(req);
      const { paymentMethod, transactionId } = body;

      if (!transactionId) {
        return new Response(JSON.stringify({ message: 'Transaction ID required' }), { status: 400 });
      }

      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        return new Response(JSON.stringify({ message: 'Subscription not found' }), { status: 404 });
      }

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      subscription.plan = 'professional';
      subscription.status = 'active';
      subscription.price = 40000; // 400 Rs in paise
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.autoRenewal = true; // Auto-enable renewal
      subscription.paymentMethod = paymentMethod || 'credit_card';
      subscription.transactionId = transactionId;
      subscription.notificationSent = false;

      await subscription.save();

      return new Response(
        JSON.stringify({
          message: 'Subscription upgraded successfully',
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
            autoRenewal: subscription.autoRenewal,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Downgrade to free plan
    if (path.match(/\/subscription\/downgrade$/) && req.method === 'POST') {
      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        return new Response(JSON.stringify({ message: 'Subscription not found' }), { status: 404 });
      }

      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      subscription.plan = 'free';
      subscription.status = 'active';
      subscription.price = 0;
      subscription.currentPeriodStart = now;
      subscription.currentPeriodEnd = periodEnd;
      subscription.autoRenewal = false;
      subscription.transactionId = undefined;
      subscription.notificationSent = false;

      await subscription.save();

      return new Response(
        JSON.stringify({
          message: 'Subscription downgraded to free plan',
          subscription: { plan: subscription.plan, status: subscription.status },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Toggle auto-renewal
    if (path.match(/\/subscription\/toggle-renewal$/) && req.method === 'POST') {
      const body = await parseBody(req);
      const { autoRenewal } = body;

      if (typeof autoRenewal !== 'boolean') {
        return new Response(JSON.stringify({ message: 'autoRenewal must be boolean' }), { status: 400 });
      }

      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        return new Response(JSON.stringify({ message: 'Subscription not found' }), { status: 404 });
      }

      subscription.autoRenewal = autoRenewal;
      await subscription.save();

      // Check if subscription is expired (shouldn't be, but just in case)
      if (subscription.plan === 'professional' && new Date() > subscription.currentPeriodEnd!) {
        subscription.status = 'expired';
        await subscription.save();
      }

      return new Response(
        JSON.stringify({
          message: `Auto-renewal ${autoRenewal ? 'enabled' : 'disabled'}`,
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            autoRenewal: subscription.autoRenewal,
            daysRemaining: subscription.plan === 'professional' 
              ? Math.ceil((subscription.currentPeriodEnd!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Subscription] No matching route for ${req.method} ${path}`);
    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
