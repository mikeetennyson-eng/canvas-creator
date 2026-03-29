import { Router } from 'express';
import { getSubscriptionInfo, upgradeSubscription, downgradeSubscription, cancelSubscription } from '../controllers/subscriptionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * @route   GET /api/subscription/info
 * @desc    Get subscription info
 * @header  Authorization: Bearer <token>
 * @returns { subscription }
 */
router.get('/info', authMiddleware, getSubscriptionInfo);

/**
 * @route   POST /api/subscription/upgrade
 * @desc    Upgrade subscription to professional
 * @header  Authorization: Bearer <token>
 * @returns { subscription }
 */
router.post('/upgrade', authMiddleware, upgradeSubscription);

/**
 * @route   POST /api/subscription/downgrade
 * @desc    Downgrade subscription to free
 * @header  Authorization: Bearer <token>
 * @returns { subscription }
 */
router.post('/downgrade', authMiddleware, downgradeSubscription);

/**
 * @route   POST /api/subscription/cancel
 * @desc    Cancel subscription
 * @header  Authorization: Bearer <token>
 * @returns { subscription }
 */
router.post('/cancel', authMiddleware, cancelSubscription);

export default router;
