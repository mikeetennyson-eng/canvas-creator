import { verifyWebhookSignature } from '../config/razorpay.js';
import Subscription from '../models/Subscription.js';
import { connectDB } from '../config/db.js';

export async function handleRazorpayWebhook(
  event: any,
  signature: string
): Promise<{ success: boolean; message: string }> {
  try {
    await connectDB();

    // Verify webhook signature
    const bodyString = JSON.stringify(event);
    if (!verifyWebhookSignature(bodyString, signature)) {
      console.error('[Webhook] Invalid signature');
      return { success: false, message: 'Invalid signature' };
    }

    console.log(`[Webhook] Processing event: ${event.event}`);

    switch (event.event) {
      case 'subscription.activated':
        return handleSubscriptionActivated(event);

      case 'subscription.charged':
        return handleSubscriptionCharged(event);

      case 'subscription.payment_failed':
        return handleSubscriptionPaymentFailed(event);

      case 'subscription.halted':
        return handleSubscriptionHalted(event);

      case 'subscription.cancelled':
        return handleSubscriptionCancelled(event);

      case 'subscription.expired':
        return handleSubscriptionExpired(event);

      case 'payment.authorized':
        return handlePaymentAuthorized(event);

      case 'payment.failed':
        return handlePaymentFailed(event);

      default:
        console.log(`[Webhook] Unhandled event type: ${event.event}`);
        return { success: true, message: 'Event received but not processed' };
    }
  } catch (error) {
    console.error('[Webhook] Error handling webhook:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function handleSubscriptionActivated(event: any) {
  try {
    const { subscription } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;

    console.log(`[Webhook] Subscription activated: ${subscriptionId}`);

    const sub = await Subscription.findOneAndUpdate(
      { userId: customerId },
      {
        subscriptionId: subscriptionId,
        status: 'active',
        failedPaymentAttempts: 0,
      },
      { new: true }
    );

    return {
      success: true,
      message: `Subscription ${subscriptionId} activated for user ${customerId}`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionActivated:', error);
    throw error;
  }
}

async function handleSubscriptionCharged(event: any) {
  try {
    const { subscription, payment } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;
    const paymentId = payment.id;

    console.log(`[Webhook] Subscription charged: ${subscriptionId}, Payment: ${paymentId}`);

    // Update subscription with new period
    const currentPeriodEnd = new Date(subscription.current_end * 1000);
    const nextRenewalDate = new Date(subscription.expire_by * 1000);

    const sub = await Subscription.findOneAndUpdate(
      { userId: customerId },
      {
        status: 'active',
        transactionId: paymentId,
        currentPeriodEnd: currentPeriodEnd,
        nextRenewalDate: nextRenewalDate,
        failedPaymentAttempts: 0,
        lastPaymentError: undefined,
        notificationSent: false, // Reset reminder
      },
      { new: true }
    );

    console.log(`[Webhook] Subscription renewed for user ${customerId}`);
    return {
      success: true,
      message: `Subscription renewed with payment ${paymentId}`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionCharged:', error);
    throw error;
  }
}

async function handleSubscriptionPaymentFailed(event: any) {
  try {
    const { subscription, payment } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;
    const failureReason = payment.error_reason || 'Unknown error';

    console.log(`[Webhook] Subscription payment failed: ${subscriptionId}, Reason: ${failureReason}`);

    const sub = await Subscription.findOne({ userId: customerId });

    if (sub) {
      const failedAttempts = (sub.failedPaymentAttempts || 0) + 1;

      await Subscription.findOneAndUpdate(
        { userId: customerId },
        {
          failedPaymentAttempts: failedAttempts,
          lastPaymentError: failureReason,
          status: 'inactive', // Mark as inactive on payment failure
        }
      );

      console.log(`[Webhook] Payment attempt ${failedAttempts} failed for user ${customerId}`);
    }

    return {
      success: true,
      message: `Payment failure recorded for subscription ${subscriptionId}`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionPaymentFailed:', error);
    throw error;
  }
}

async function handleSubscriptionHalted(event: any) {
  try {
    const { subscription } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;

    console.log(`[Webhook] Subscription halted: ${subscriptionId}`);

    await Subscription.findOneAndUpdate(
      { userId: customerId },
      {
        status: 'inactive',
      }
    );

    return {
      success: true,
      message: `Subscription ${subscriptionId} halted`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionHalted:', error);
    throw error;
  }
}

async function handleSubscriptionCancelled(event: any) {
  try {
    const { subscription } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;

    console.log(`[Webhook] Subscription cancelled: ${subscriptionId}`);

    // Downgrade to free plan
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Subscription.findOneAndUpdate(
      { userId: customerId },
      {
        plan: 'free',
        status: 'active',
        price: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        subscriptionId: undefined,
        failedPaymentAttempts: 0,
      }
    );

    console.log(`[Webhook] User ${customerId} downgraded to free plan`);
    return {
      success: true,
      message: `Subscription cancelled and user downgraded to free plan`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionCancelled:', error);
    throw error;
  }
}

async function handleSubscriptionExpired(event: any) {
  try {
    const { subscription } = event.payload;
    const subscriptionId = subscription.id;
    const customerId = subscription.notes?.customerId;

    console.log(`[Webhook] Subscription expired: ${subscriptionId}`);

    // Mark subscription as expired and downgrade to free
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await Subscription.findOneAndUpdate(
      { userId: customerId },
      {
        plan: 'free',
        status: 'expired',
        price: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        subscriptionId: undefined,
      }
    );

    console.log(`[Webhook] User ${customerId} subscription expired`);
    return {
      success: true,
      message: `Subscription expired and user downgraded to free plan`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handleSubscriptionExpired:', error);
    throw error;
  }
}

async function handlePaymentAuthorized(event: any) {
  try {
    const { payment } = event.payload;
    const customerId = payment.notes?.userId;

    console.log(`[Webhook] Payment authorized: ${payment.id}`);

    if (customerId) {
      await Subscription.findOneAndUpdate(
        { userId: customerId },
        { lastPaymentError: undefined }
      );
    }

    return {
      success: true,
      message: `Payment ${payment.id} authorized`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handlePaymentAuthorized:', error);
    throw error;
  }
}

async function handlePaymentFailed(event: any) {
  try {
    const { payment } = event.payload;
    const customerId = payment.notes?.userId;
    const failureReason = payment.error_reason || 'Payment failed';

    console.log(`[Webhook] Payment failed: ${payment.id}`);

    if (customerId) {
      await Subscription.findOneAndUpdate(
        { userId: customerId },
        { lastPaymentError: failureReason }
      );
    }

    return {
      success: true,
      message: `Payment failure recorded`,
    };
  } catch (error) {
    console.error('[Webhook] Error in handlePaymentFailed:', error);
    throw error;
  }
}
