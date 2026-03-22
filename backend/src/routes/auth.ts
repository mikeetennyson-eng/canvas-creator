import { Router } from 'express';
import { signup, login, verifyToken } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @body    { name, email, password, confirmPassword }
 * @returns { token, user }
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @body    { email, password }
 * @returns { token, user }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @body    { token }
 * @returns { user }
 */
router.post('/verify', verifyToken);

/**
 * @route   GET /api/auth/protected
 * @desc    Protected route example
 * @header  Authorization: Bearer <token>
 * @returns { message, user }
 */
router.get('/protected', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'You have access to protected route',
    user: (req as any).user,
  });
});

export default router;
