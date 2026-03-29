// Consolidated API handler - Vercel serverless function
// Routes all API requests through a single function to stay under 12 function limit

import { verifyToken as verifyJWT } from './config/jwt.js';
import User from './models/User.js';
import Canvas from './models/Canvas.js';
import Subscription from './models/Subscription.js';
import { connectDB } from './config/db.js';
import { generateToken } from './config/jwt.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifySubscriptionSignature,
  createRazorpayPlan,
  createRazorpaySubscription,
  getSubscriptionDetails,
  cancelRazorpaySubscription,
} from './config/razorpay.js';
import { handleRazorpayWebhook } from './webhooks/razorpay.js';
import { checkExpiringSubscriptions } from './services/autoRenewal.js';
import crypto from 'crypto';

const SESSION_TAKEOVER_GRACE_MS = 2 * 60 * 1000;

function generateSessionId(): string {
  return crypto.randomBytes(16).toString('hex');
}

function isTakeoverWindowActive(user: any): boolean {
  if (!user.takeoverRequestedAt) return false;
  return Date.now() - new Date(user.takeoverRequestedAt).getTime() <= SESSION_TAKEOVER_GRACE_MS;
}

// Helper to get header from Node.js or Web API request objects
function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

// Helper to parse JSON body
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

// Main handler
export default async function handler(req: any, res: any): Promise<void> {
  try {
    // ============ CORS HANDLING ============
    const clientUrls = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:8080';
    const allowedOrigins = clientUrls.split(',').map((url) => url.trim());
    const origin = getHeader(req.headers, 'origin') || '';

    // Add CORS headers
    if (!origin) {
      // Non-browser request, allow it
      res.setHeader('Access-Control-Allow-Origin', '*');
    } else if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    await connectDB();

    const host = getHeader(req.headers, 'host') || req.headers['host'] || 'localhost';
    const url = new URL(req.url || '/', `https://${host}`);
    let path = url.pathname;

    path = path.split('?')[0].replace(/\/$/, '');

    console.log(`[API] ${req.method} ${path}`);

    // Health check
    if (path === '/api/health') {
      res.status(200).json({ message: 'Server is running', timestamp: new Date() });
      return;
    }

    // ============ AUTH ROUTES ============
    if (path.startsWith('/api/auth/')) {
      // Signup
      if (path === '/api/auth/signup' && req.method === 'POST') {
        try {
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

          const initialSessionId = generateSessionId();
          const user = await User.create({
            name,
            email,
            password,
            activeSessionId: initialSessionId,
          });

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
            autoRenewal: false,
          });

          const token = generateToken({ id: user._id.toString(), email: user.email, sid: initialSessionId });

          res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: user._id, name: user.name, email: user.email },
          });
        } catch (error) {
          console.error('Signup error:', error);
          res.status(500).json({ message: 'Signup failed', error: error instanceof Error ? error.message : 'Unknown error' });
        }
        return;
      }

      // Login
      if (path === '/api/auth/login' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { email, password, forceLogoutPrevious } = body;

          if (!email || !password) {
            res.status(400).json({ message: 'Email and password required' });
            return;
          }

          const user = await User.findOne({ email }).select('+password');
          if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
          }

          const isPasswordValid = await user.comparePassword(password);
          if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
          }

          if (user.activeSessionId && !forceLogoutPrevious) {
            res.status(409).json({
              message: 'An active session exists on another device. Do you want to log out that session?',
              code: 'SESSION_ACTIVE_ON_ANOTHER_DEVICE',
            });
            return;
          }

          const newSessionId = generateSessionId();
          const previousSessionId = user.activeSessionId;

          user.activeSessionId = newSessionId;
          if (forceLogoutPrevious && previousSessionId) {
            user.previousSessionId = previousSessionId;
            user.takeoverRequestedAt = new Date();
          } else {
            user.previousSessionId = undefined;
            user.takeoverRequestedAt = undefined;
          }
          await user.save();

          const token = generateToken({ id: user._id.toString(), email: user.email, sid: newSessionId });

          res.status(200).json({
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email },
          });
        } catch (error) {
          console.error('Login error:', error);
          res.status(500).json({ message: 'Login failed' });
        }
        return;
      }

      // Verify token
      if (path === '/api/auth/verify' && req.method === 'POST') {
        try {
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

          const isCurrentSession = !!decoded.sid && decoded.sid === user.activeSessionId;
          const isPreviousGraceSession =
            !!decoded.sid &&
            decoded.sid === user.previousSessionId &&
            isTakeoverWindowActive(user);

          if (!isCurrentSession && !isPreviousGraceSession) {
            res.status(401).json({ message: 'Session expired. Please login again.' });
            return;
          }

          res.status(200).json({
            message: 'Token verified',
            user: { id: user._id, email: user.email },
          });
        } catch (error) {
          res.status(401).json({ message: 'Invalid token' });
        }
        return;
      }

      // Session status for takeover flow (old session polls this)
      if (path === '/api/auth/session-status' && req.method === 'GET') {
        const authHeader = getHeader(req.headers, 'authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
          res.status(401).json({ message: 'No token provided' });
          return;
        }

        try {
          const decoded = verifyJWT(token);
          const user = await User.findById(decoded.id);
          if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
          }

          const takeoverActive = !!user.previousSessionId && isTakeoverWindowActive(user);
          const takeoverRequested = takeoverActive && decoded.sid === user.previousSessionId;

          res.status(200).json({
            message: 'Session status fetched',
            takeoverRequested,
          });
        } catch {
          res.status(401).json({ message: 'Invalid token' });
        }
        return;
      }

      // Logout current/previous session entry
      if (path === '/api/auth/logout-session' && req.method === 'POST') {
        const authHeader = getHeader(req.headers, 'authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
          res.status(401).json({ message: 'No token provided' });
          return;
        }

        try {
          const decoded = verifyJWT(token);
          const user = await User.findById(decoded.id);
          if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
          }

          if (decoded.sid && decoded.sid === user.previousSessionId) {
            user.previousSessionId = undefined;
            user.takeoverRequestedAt = undefined;
          }

          if (decoded.sid && decoded.sid === user.activeSessionId) {
            user.activeSessionId = undefined;
          }

          await user.save();
          res.status(200).json({ message: 'Session logged out' });
        } catch {
          res.status(401).json({ message: 'Invalid token' });
        }
        return;
      }

      // Protected route example
      if (path === '/api/auth/protected' && req.method === 'GET') {
        const authHeader = getHeader(req.headers, 'authorization');
        const token = authHeader?.split(' ')[1];

        if (!token) {
          res.status(401).json({ message: 'No token provided' });
          return;
        }

        try {
          const decoded = verifyJWT(token);
          const user = await User.findById(decoded.id);
          if (!user || decoded.sid !== user.activeSessionId) {
            res.status(401).json({ message: 'Session expired. Please login again.' });
            return;
          }
          res.status(200).json({ message: 'Access granted' });
        } catch {
          res.status(401).json({ message: 'Invalid token' });
        }
        return;
      }
    }

    // ============ CANVAS ROUTES ============
    if (path.startsWith('/api/canvas/')) {
      const authHeader = getHeader(req.headers, 'authorization');
      const token = authHeader?.split(' ')[1];

      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }

      let userId: string;
      let canProceed = false;
      try {
        const decoded = verifyJWT(token);
        userId = decoded.id;

        const user = await User.findById(decoded.id);
        if (!user) {
          res.status(401).json({ message: 'User not found' });
          return;
        }

        const isCurrentSession = !!decoded.sid && decoded.sid === user.activeSessionId;
        const isPreviousGraceSession =
          !!decoded.sid &&
          decoded.sid === user.previousSessionId &&
          isTakeoverWindowActive(user);

        const isSaveRoute = path === '/api/canvas/save' && (req.method === 'POST' || req.method === 'PUT');
        canProceed = isCurrentSession || (isPreviousGraceSession && isSaveRoute);

        if (!canProceed) {
          res.status(401).json({ message: 'Session expired. Please login again.' });
          return;
        }
      } catch {
        res.status(401).json({ message: 'Invalid token' });
        return;
      }

      // Save canvas
      if (path === '/api/canvas/save' && (req.method === 'POST' || req.method === 'PUT')) {
        try {
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
          console.error('Save canvas error:', error);
          res.status(500).json({ message: 'Failed to save canvas' });
        }
        return;
      }

      // List canvases
      if (path === '/api/canvas/list' && req.method === 'GET') {
        try {
          const canvases = await Canvas.find({ userId }).sort({ updatedAt: -1 });
          res.status(200).json({ message: 'Canvases retrieved', canvases });
        } catch (error) {
          console.error('List canvases error:', error);
          res.status(500).json({ message: 'Failed to fetch canvases' });
        }
        return;
      }

      // Get specific canvas
      if (path.match(/\/api\/canvas\/[a-zA-Z0-9]+$/) && req.method === 'GET') {
        try {
          const canvasId = path.split('/').pop();
          const canvas = await Canvas.findOne({ _id: canvasId, userId });

          if (!canvas) {
            res.status(404).json({ message: 'Canvas not found' });
            return;
          }

          res.status(200).json({ message: 'Canvas retrieved', canvas });
        } catch (error) {
          console.error('Get canvas error:', error);
          res.status(500).json({ message: 'Failed to fetch canvas' });
        }
        return;
      }

      // Delete canvas
      if (path.match(/\/api\/canvas\/[a-zA-Z0-9]+$/) && req.method === 'DELETE') {
        try {
          const canvasId = path.split('/').pop();
          const result = await Canvas.findOneAndDelete({ _id: canvasId, userId });

          if (!result) {
            res.status(404).json({ message: 'Canvas not found' });
            return;
          }

          res.status(200).json({ message: 'Canvas deleted' });
        } catch (error) {
          console.error('Delete canvas error:', error);
          res.status(500).json({ message: 'Failed to delete canvas' });
        }
        return;
      }
    }

    // ============ SUBSCRIPTION ROUTES ============
    if (path.startsWith('/api/subscription/')) {
      // Webhook (no auth needed)
      if (path === '/api/subscription/webhook' && req.method === 'POST') {
        try {
          const signature = getHeader(req.headers, 'x-razorpay-signature');
          if (!signature) {
            res.status(401).json({ message: 'Missing signature' });
            return;
          }

          const body = await parseBody(req);
          const result = await handleRazorpayWebhook(body, signature);

          res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
          console.error('Webhook error:', error);
          res.status(500).json({ message: 'Webhook processing failed' });
        }
        return;
      }

      // Check expiry (protected)
      if (path === '/api/subscription/check-expiry' && req.method === 'POST') {
        try {
          const authHeader = getHeader(req.headers, 'authorization');
          const tokenPart = authHeader?.split(' ')[1];
          const secret = process.env.CRON_SECRET;

          let isAuthorized = false;
          if (tokenPart) {
            if (secret && tokenPart === secret) {
              isAuthorized = true;
            } else {
              try {
                verifyJWT(tokenPart);
                isAuthorized = true;
              } catch {
                isAuthorized = false;
              }
            }
          }

          if (!isAuthorized) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
          }

          const result = await checkExpiringSubscriptions();
          res.status(result.success ? 200 : 500).json(result);
        } catch (error) {
          console.error('Check expiry error:', error);
          res.status(500).json({ message: 'Check failed' });
        }
        return;
      }

      // All other subscription routes require auth
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

        const user = await User.findById(decoded.id);
        if (!user || decoded.sid !== user.activeSessionId) {
          res.status(401).json({ message: 'Session expired. Please login again.' });
          return;
        }
      } catch {
        res.status(401).json({ message: 'Invalid token' });
        return;
      }

      // Get subscription info
      if (path === '/api/subscription/info' && req.method === 'GET') {
        try {
          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
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

          if (subscription.plan === 'professional' && new Date() > subscription.currentPeriodEnd!) {
            if (!subscription.subscriptionId) {
              subscription.plan = 'free';
              subscription.status = 'active';
              subscription.price = 0;
              subscription.autoRenewal = false;
              subscription.transactionId = undefined;
              subscription.orderId = undefined;
              subscription.planId = undefined;
            } else {
              subscription.status = 'expired';
            }
            await subscription.save();
          }

          res.status(200).json({
            message: 'Subscription info retrieved',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
              daysRemaining:
                subscription.plan === 'professional'
                  ? Math.ceil((subscription.currentPeriodEnd!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null,
            },
          });
        } catch (error) {
          console.error('Get subscription error:', error);
          res.status(500).json({ message: 'Failed to get subscription info' });
        }
        return;
      }

      // Upgrade subscription
      if (path === '/api/subscription/upgrade' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { paymentMethod, transactionId } = body;

          if (!transactionId) {
            res.status(400).json({ message: 'Transaction ID required' });
            return;
          }

          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
          }

          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          subscription.plan = 'professional';
          subscription.status = 'active';
          subscription.price = 40000;
          subscription.currentPeriodStart = now;
          subscription.currentPeriodEnd = periodEnd;
          subscription.autoRenewal = true;
          subscription.paymentMethod = paymentMethod || 'credit_card';
          subscription.transactionId = transactionId;
          subscription.notificationSent = false;

          await subscription.save();

          res.status(200).json({
            message: 'Subscription upgraded successfully',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
            },
          });
        } catch (error) {
          console.error('Upgrade subscription error:', error);
          res.status(500).json({ message: 'Failed to upgrade subscription' });
        }
        return;
      }

      // Downgrade subscription
      if (path === '/api/subscription/downgrade' && req.method === 'POST') {
        try {
          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
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

          res.status(200).json({
            message: 'Subscription downgraded to free plan',
            subscription: { plan: subscription.plan, status: subscription.status },
          });
        } catch (error) {
          console.error('Downgrade subscription error:', error);
          res.status(500).json({ message: 'Failed to downgrade subscription' });
        }
        return;
      }

      // Toggle auto-renewal
      if (path === '/api/subscription/toggle-renewal' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { autoRenewal } = body;

          if (typeof autoRenewal !== 'boolean') {
            res.status(400).json({ message: 'autoRenewal must be boolean' });
            return;
          }

          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
          }

          subscription.autoRenewal = autoRenewal;
          await subscription.save();

          if (subscription.plan === 'professional' && new Date() > subscription.currentPeriodEnd!) {
            subscription.status = 'expired';
            await subscription.save();
          }

          res.status(200).json({
            message: `Auto-renewal ${autoRenewal ? 'enabled' : 'disabled'}`,
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
              daysRemaining:
                subscription.plan === 'professional'
                  ? Math.ceil((subscription.currentPeriodEnd!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  : null,
            },
          });
        } catch (error) {
          console.error('Toggle renewal error:', error);
          res.status(500).json({ message: 'Failed to toggle renewal' });
        }
        return;
      }

      // Cancel subscription
      if (path === '/api/subscription/cancel' && req.method === 'POST') {
        try {
          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
          }

          if (subscription.plan !== 'professional') {
            res.status(400).json({ message: 'Can only cancel professional subscriptions' });
            return;
          }

          if (subscription.subscriptionId) {
            try {
              await cancelRazorpaySubscription(subscription.subscriptionId, false);
              console.log('[API] Razorpay subscription cancelled:', subscription.subscriptionId);
            } catch (error) {
              console.error('[API] Failed to cancel Razorpay subscription:', error);
              res.status(502).json({
                message: 'Failed to cancel subscription with payment provider. Please try again.',
              });
              return;
            }
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
          subscription.subscriptionId = undefined;
          subscription.planId = undefined;
          subscription.notificationSent = false;

          await subscription.save();

          res.status(200).json({
            message: 'Subscription cancelled. Your account has been downgraded to free plan.',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
              daysRemaining: null,
            },
          });
        } catch (error) {
          console.error('Cancel subscription error:', error);
          res.status(500).json({ message: 'Failed to cancel subscription' });
        }
        return;
      }

      // Create Razorpay order
      if (path === '/api/subscription/create-order' && req.method === 'POST') {
        try {
          const order = await createRazorpayOrder(1000, userId);

          res.status(200).json({
            message: 'Order created successfully',
            order,
          });
        } catch (error) {
          console.error('Create order error:', error);
          res.status(500).json({ message: 'Failed to create order' });
        }
        return;
      }

      // Create Razorpay subscription
      if (path === '/api/subscription/create-subscription' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { autoRenewal } = body;

          console.log('[API] Creating recurring subscription for user:', userId);

          const rawPlanId = process.env.RAZORPAY_PROFESSIONAL_PLAN_ID || null;
          let planId = rawPlanId
            ? rawPlanId.trim().replace(/^['\"]|['\"]$/g, '')
            : null;

          if (planId && !/^plan_[A-Za-z0-9]{14}$/.test(planId)) {
            console.error('[API] Invalid RAZORPAY_PROFESSIONAL_PLAN_ID format', {
              length: planId.length,
            });
            res.status(500).json({
              message: 'Invalid RAZORPAY_PROFESSIONAL_PLAN_ID format in environment variables',
            });
            return;
          }

          if (!planId) {
            console.log('[API] Creating new Razorpay plan...');
            const plan = await createRazorpayPlan('Canvas Creator Professional', 40000, 1, 'monthly');
            planId = plan.id;
            console.log('[API] Plan created:', planId);
          }

          const subscription = await createRazorpaySubscription(userId, planId, 1, 0);

          console.log('[API] Subscription created:', subscription.id);

          let userSubscription = await Subscription.findOne({ userId });

          if (!userSubscription) {
            res.status(404).json({ message: 'User subscription not found' });
            return;
          }

          userSubscription.subscriptionId = subscription.id;
          userSubscription.planId = planId;
          userSubscription.autoRenewal = autoRenewal !== false;
          const validStatuses = ['active', 'inactive', 'cancelled', 'expired'];
          if (validStatuses.includes(subscription.status)) {
            userSubscription.status = subscription.status as any;
          }

          await userSubscription.save();

          console.log('[API] Subscription saved to DB:', userSubscription._id);

          res.status(200).json({
            message: 'Subscription created successfully',
            subscription: {
              subscriptionId: subscription.id,
              planId: planId,
              status: subscription.status,
              shortUrl: subscription.short_url,
              paymentLink: subscription.short_url,
            },
          });
        } catch (error) {
          console.error('Create subscription error:', error);
          res.status(500).json({
            message: 'Failed to create subscription',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return;
      }

      // Verify payment (ONE-TIME PAYMENT)
      if (path === '/api/subscription/verify-payment' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { orderId, paymentId, signature } = body;

          if (!orderId || !paymentId || !signature) {
            res.status(400).json({ message: 'Missing required payment details' });
            return;
          }

          const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);

          if (!isValidSignature) {
            res.status(400).json({ message: 'Invalid payment signature' });
            return;
          }

          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
          }

          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

          subscription.plan = 'professional';
          subscription.status = 'active';
          subscription.price = 40000;
          subscription.currentPeriodStart = now;
          subscription.currentPeriodEnd = periodEnd;
          subscription.autoRenewal = false; // ONE-TIME PAYMENT - NO AUTO-RENEWAL
          subscription.paymentMethod = 'razorpay';
          subscription.transactionId = paymentId;
          subscription.orderId = orderId;
          subscription.subscriptionId = undefined; // Clear any recurring subscription ID
          subscription.notificationSent = false;

          await subscription.save();

          res.status(200).json({
            message: 'Payment verified and subscription upgraded successfully',
            subscription: {
              plan: subscription.plan,
              status: subscription.status,
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              autoRenewal: subscription.autoRenewal,
              daysRemaining: Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            },
          });
        } catch (error) {
          console.error('Verify payment error:', error);
          res.status(500).json({ message: 'Failed to verify payment' });
        }
        return;
      }

      // Verify recurring subscription
      if (path === '/api/subscription/verify-subscription' && req.method === 'POST') {
        try {
          const body = await parseBody(req);
          const { subscriptionId, paymentId, signature } = body;

          if (!subscriptionId) {
            res.status(400).json({ message: 'Subscription ID required' });
            return;
          }

          console.log('[API] Verifying recurring subscription:', subscriptionId);

          // Validate Razorpay signature when payment info is present
          if (paymentId && signature) {
            const validSig = verifySubscriptionSignature(paymentId, subscriptionId, signature);
            if (!validSig) {
              res.status(400).json({ message: 'Invalid razorpay signature' });
              return;
            }
          }

          // Fetch subscription from Razorpay
          let razorpaySubscription;
          try {
            razorpaySubscription = await getSubscriptionDetails(subscriptionId);
            console.log('[API] Razorpay subscription status:', razorpaySubscription.status);
          } catch (error) {
            console.error('[API] Error fetching Razorpay subscription:', error);
            return res.status(500).json({ message: 'Failed to verify subscription with payment provider' });
          }

          let subscription = await Subscription.findOne({ userId });

          if (!subscription) {
            res.status(404).json({ message: 'Subscription not found' });
            return;
          }

          // Treat these status values as acceptable activation states for immediate UX
          const acceptableStatuses = ['active', 'authenticated', 'created', 'pending', 'trialing'];
          if (acceptableStatuses.includes(razorpaySubscription.status)) {
            const now = new Date();
            const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

            subscription.plan = 'professional';
            subscription.status = 'active';
            subscription.price = 40000;
            subscription.currentPeriodStart = now;
            subscription.currentPeriodEnd = periodEnd;
            subscription.autoRenewal = true;
            subscription.paymentMethod = 'razorpay';
            subscription.subscriptionId = subscriptionId;
            subscription.notificationSent = false;

            await subscription.save();

            console.log('[API] Subscription verified and upgraded:', subscription._id);

            res.status(200).json({
              message: `Subscription verified and activated (Razorpay status: ${razorpaySubscription.status})`,
              subscription: {
                plan: subscription.plan,
                status: subscription.status,
                currentPeriodStart: subscription.currentPeriodStart,
                currentPeriodEnd: subscription.currentPeriodEnd,
                autoRenewal: subscription.autoRenewal,
                daysRemaining: Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
              },
              razorpayStatus: razorpaySubscription.status,
            });
          } else {
            res.status(202).json({
              message: `Subscription pending: Razorpay status ${razorpaySubscription.status}. Verify again after a few seconds.`,
              razorpayStatus: razorpaySubscription.status,
            });
          }
        } catch (error) {
          console.error('Verify subscription error:', error);
          res.status(500).json({
            message: 'Failed to verify subscription',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return;
      }
    }

    // 404 - Not found
    console.log(`[API] Unhandled route: ${req.method} ${path}`);
    res.status(404).json({ message: 'Not found' });
  } catch (error) {
    console.error('[API] General error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
