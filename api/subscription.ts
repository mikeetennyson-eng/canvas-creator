import { verifyToken as verifyJWT } from './config/jwt.js';
import Subscription from './models/Subscription.js';
import { connectDB } from './config/db.js';
import { createRazorpayOrder, verifyPaymentSignature } from './config/razorpay.js';
import { handleRazorpayWebhook } from './webhooks/razorpay.js';
import { checkExpiringSubscriptions } from './services/autoRenewal.js';

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

    // Cancel subscription (downgrade to free)
    if (path.match(/\/subscription\/cancel$/) && req.method === 'POST') {
      let subscription = await Subscription.findOne({ userId });
      
      if (!subscription) {
        return new Response(JSON.stringify({ message: 'Subscription not found' }), { status: 404 });
      }

      // Only allow cancellation of professional plans
      if (subscription.plan !== 'professional') {
        return new Response(
          JSON.stringify({ message: 'Can only cancel professional subscriptions' }),
          { status: 400 }
        );
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
          message: 'Subscription cancelled. Your account has been downgraded to free plan.',
          subscription: {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            autoRenewal: subscription.autoRenewal,
            daysRemaining: null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Razorpay order
    if (path.match(/\/subscription\/create-order$/) && req.method === 'POST') {
      try {
        const order = await createRazorpayOrder(40000, userId); // 400 INR = 40000 paise
        
        return new Response(
          JSON.stringify({
            message: 'Order created successfully',
            order,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return new Response(
          JSON.stringify({ message: 'Failed to create order' }),
          { status: 500 }
        );
      }
    }

    // Verify payment and upgrade subscription
    if (path.match(/\/subscription\/verify-payment$/) && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const { orderId, paymentId, signature } = body;

        if (!orderId || !paymentId || !signature) {
          return new Response(
            JSON.stringify({ message: 'Missing required payment details' }),
            { status: 400 }
          );
        }

        // Verify payment signature
        const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
        
        if (!isValidSignature) {
          return new Response(
            JSON.stringify({ message: 'Invalid payment signature' }),
            { status: 400 }
          );
        }

        // Get or create subscription
        let subscription = await Subscription.findOne({ userId });
        
        if (!subscription) {
          return new Response(
            JSON.stringify({ message: 'Subscription not found' }),
            { status: 404 }
          );
        }

        // Update subscription to professional
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        subscription.plan = 'professional';
        subscription.status = 'active';
        subscription.price = 40000; // 400 Rs in paise
        subscription.currentPeriodStart = now;
        subscription.currentPeriodEnd = periodEnd;
        subscription.autoRenewal = true;
        subscription.paymentMethod = 'razorpay';
        subscription.transactionId = paymentId;
        subscription.orderId = orderId;
        subscription.notificationSent = false;

        await subscription.save();

        return new Response(
          JSON.stringify({
            message: 'Payment verified and subscription upgraded successfully',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
              daysRemaining: Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error verifying payment:', error);
        return new Response(
          JSON.stringify({ message: 'Failed to verify payment' }),
          { status: 500 }
        );
      }
    }

    // Auto-renewal check endpoint (protected by secret key)
    if (path.match(/\/subscription\/check-expiry$/) && req.method === 'POST') {
      try {
        const authHeader = getHeader(req.headers, 'authorization');
        const token = authHeader?.split(' ')[1];
        const secret = process.env.CRON_SECRET || 'default_secret';

        // Verify with either JWT token or cron secret
        if (token) {
          try {
            verifyJWT(token);
          } catch {
            return new Response(
              JSON.stringify({ message: 'Invalid token' }),
              { status: 401 }
            );
          }
        } else if (process.env.CRON_SECRET && token !== secret) {
          return new Response(
            JSON.stringify({ message: 'Unauthorized' }),
            { status: 401 }
          );
        }

        const result = await checkExpiringSubscriptions();

        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error checking expiring subscriptions:', error);
        return new Response(
          JSON.stringify({ message: 'Check failed' }),
          { status: 500 }
        );
      }
    }

    // Webhook endpoint (no auth needed)
    if (path.match(/\/subscription\/webhook$/) && req.method === 'POST') {
      try {
        const signature = getHeader(req.headers, 'x-razorpay-signature');
        if (!signature) {
          return new Response(
            JSON.stringify({ message: 'Missing signature' }),
            { status: 401 }
          );
        }

        const body = await parseBody(req);
        const result = await handleRazorpayWebhook(body, signature);

        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error handling webhook:', error);
        return new Response(
          JSON.stringify({ message: 'Webhook processing failed' }),
          { status: 500 }
        );
      }
    }

    console.log(`[Subscription] No matching route for ${req.method} ${path}`);
    return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
  } catch (error) {
    console.error('Subscription error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
