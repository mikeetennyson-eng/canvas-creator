import Subscription from '../models/Subscription.js';

export const getSubscriptionInfo = async (req, res) => {
  try {
    const userId = req.user.id;

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
      });
    }

    res.status(200).json({ message: 'Subscription retrieved', subscription });
  } catch (error) {
    console.error('[Subscription Info] Error:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
};

export const upgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    let subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      subscription = await Subscription.create({
        userId,
        plan: 'professional',
        status: 'active',
        price: 9.99,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      });
    } else {
      subscription.plan = 'professional';
      subscription.price = 9.99;
      subscription.status = 'active';
      await subscription.save();
    }

    res.status(200).json({ message: 'Subscription upgraded', subscription });
  } catch (error) {
    console.error('[Subscription Upgrade] Error:', error);
    res.status(500).json({ message: 'Failed to upgrade subscription' });
  }
};

export const downgradeSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

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
      });
    } else {
      subscription.plan = 'free';
      subscription.price = 0;
      subscription.status = 'active';
      await subscription.save();
    }

    res.status(200).json({ message: 'Subscription downgraded', subscription });
  } catch (error) {
    console.error('[Subscription Downgrade] Error:', error);
    res.status(500).json({ message: 'Failed to downgrade subscription' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ userId });

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ message: 'Subscription already cancelled' });
    }

    subscription.plan = 'free';
    subscription.status = 'cancelled';
    subscription.price = 0;
    subscription.currentPeriodEnd = new Date();
    await subscription.save();

    res.status(200).json({ message: 'Subscription cancelled', subscription });
  } catch (error) {
    console.error('[Subscription Cancel] Error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
};
