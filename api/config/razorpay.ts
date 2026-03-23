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

// Create Razorpay Order
export async function createRazorpayOrder(amount: number, userId: string) {
  const razorpay = getRazorpayInstance();

  try {
    const order = await razorpay.orders.create({
      amount: amount, // Amount in paise (400 INR = 40000 paise)
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
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
