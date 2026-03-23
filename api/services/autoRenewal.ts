import Subscription from '../models/Subscription.js';
import { connectDB } from '../config/db.js';

/**
 * Check for expired and expiring subscriptions
 * This should be called periodically via a cron job or serverless function
 */
export async function checkExpiringSubscriptions() {
  try {
    await connectDB();
    console.log('[Auto-Renewal] Starting expiry check...');

    const now = new Date();
    const reminderThreshold = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

    // 1. Find expired professional subscriptions and downgrade to free
    const expiredSubscriptions = await Subscription.find({
      plan: 'professional',
      status: { $in: ['active', 'inactive'] },
      currentPeriodEnd: { $lt: now },
      autoRenewal: true, // Only auto-renew if enabled
      subscriptionId: { $exists: false }, // Only handle one-time orders (subscriptions handled by webhooks)
    });

    console.log(`[Auto-Renewal] Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const sub of expiredSubscriptions) {
      console.log(`[Auto-Renewal] Downgrading user ${sub.userId} - subscription expired`);

      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await Subscription.findByIdAndUpdate(sub._id, {
        plan: 'free',
        status: 'expired',
        price: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        autoRenewal: false,
        notificationSent: false,
      });
    }

    // 2. Find subscriptions expiring soon and send reminders
    const expiringSubscriptions = await Subscription.find({
      plan: 'professional',
      status: 'active',
      currentPeriodEnd: {
        $gte: now,
        $lte: reminderThreshold,
      },
      autoRenewal: true,
      notificationSent: false,
    });

    console.log(`[Auto-Renewal] Found ${expiringSubscriptions.length} subscriptions expiring soon`);

    for (const sub of expiringSubscriptions) {
      // Mark notification as sent
      await Subscription.findByIdAndUpdate(sub._id, {
        notificationSent: true,
      });

      const daysRemaining = Math.ceil(
        (sub.currentPeriodEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      console.log(
        `[Auto-Renewal] Reminder: User ${sub.userId} subscription expires in ${daysRemaining} days`
      );

      // TODO: Send email notification to user about upcoming renewal
      // Example: await sendRenewalReminderEmail(userId, daysRemaining);
    }

    // 3. Reset notification flag for subscriptions with recent renewal
    const recentlyRenewed = await Subscription.find({
      plan: 'professional',
      status: 'active',
      currentPeriodEnd: {
        $gt: reminderThreshold,
      },
      notificationSent: true,
    });

    console.log(`[Auto-Renewal] Resetting notification flag for ${recentlyRenewed.length} renewed subscriptions`);

    for (const sub of recentlyRenewed) {
      await Subscription.findByIdAndUpdate(sub._id, {
        notificationSent: false,
      });
    }

    console.log('[Auto-Renewal] Expiry check completed successfully');
    return { success: true, message: 'Expiry check completed' };
  } catch (error) {
    console.error('[Auto-Renewal] Error during expiry check:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Utility function to calculate days remaining
 */
export function getDaysRemaining(expiryDate: Date): number {
  return Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Utility function to check if subscription needs renewal soon
 */
export function isSubscriptionExpiringWarning(subscription: any, warningDaysThreshold: number = 3): boolean {
  if (subscription.plan !== 'professional' || !subscription.autoRenewal) {
    return false;
  }

  const daysRemaining = getDaysRemaining(new Date(subscription.currentPeriodEnd));
  return daysRemaining > 0 && daysRemaining <= warningDaysThreshold;
}
