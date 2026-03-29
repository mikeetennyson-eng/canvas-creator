import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay instance
export function getRazorpayInstance() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    throw new Error('Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }

  return new Razorpay({
    key_id: key,
    key_secret: secret,
  });
}

// Create Razorpay Plan for recurring subscriptions
export async function createRazorpayPlan(
  planName: string,
  amount: number,
  interval: number = 12,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
) {
  const razorpay = getRazorpayInstance();

  try {
    const plan = await (razorpay.plans as any).create({
      period: period,
      interval: interval,
      description: planName,
      notes: {
        planName: planName,
      },
    });

    return plan;
  } catch (error) {
    console.error('Error creating Razorpay plan:', error);
    throw error;
  }
}

// Create Razorpay Subscription
export async function createRazorpaySubscription(
  customerId: string,
  planId: string,
  quantity: number = 1,
  totalCount: number = 0 // 0 = use default (12 billing cycles)
) {
  const razorpay = getRazorpayInstance();

  try {
    // Razorpay requires either total_count OR end_at
    // Keep subscription duration near-term to avoid very long checkout mandate horizon.
    const finalTotalCount = totalCount > 0 ? totalCount : 12;

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1, // Send notification to customer
      quantity: quantity,
      total_count: finalTotalCount,
      notes: {
        customerId: customerId,
      },
    });

    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
  }
}

// Create Razorpay Order (for one-time payment)
export async function createRazorpayOrder(amount: number, userId: string) {
  const razorpay = getRazorpayInstance();

  try {
    // Generate short unique receipt (max 40 chars)
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const userIdShort = userId.toString().slice(-6); // Last 6 chars of userId
    const receipt = `order_${userIdShort}_${timestamp}`; // ~22 chars total

    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise (349 INR = 34900 paise)
      currency: 'INR',
      receipt: receipt,
      notes: {
        userId: userId,
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const message = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return expectedSignature === signature;
}

// Verify subscription signature
export function verifySubscriptionSignature(
  paymentId: string,
  subscriptionId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const message = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return expectedSignature === signature;
}

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// Fetch payment details from Razorpay
export async function getPaymentDetails(paymentId: string) {
  const razorpay = getRazorpayInstance();

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

// Fetch subscription details
export async function getSubscriptionDetails(subscriptionId: string) {
  const razorpay = getRazorpayInstance();

  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtEnd: boolean = false
) {
  const razorpay = getRazorpayInstance();

  try {
    const result = await razorpay.subscriptions.cancel(
      subscriptionId,
      cancelAtEnd // Razorpay expects boolean directly, not an object
    );

    return result;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}
