import { Router } from 'express';
import { saveCanvas, getCanvases, getCanvas, deleteCanvas } from '../controllers/canvasController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * @route   POST /api/canvas/save
 * @desc    Save a canvas
 * @header  Authorization: Bearer <token>
 * @body    { _id?, title, canvasData, thumbnail }
 * @returns { canvas }
 */
router.post('/save', authMiddleware, saveCanvas);

/**
 * @route   PUT /api/canvas/save
 * @desc    Update a canvas
 * @header  Authorization: Bearer <token>
 * @body    { _id, title, canvasData, thumbnail }
 * @returns { canvas }
 */
router.put('/save', authMiddleware, saveCanvas);

/**
 * @route   GET /api/canvas/list
 * @desc    Get all canvases for user
 * @header  Authorization: Bearer <token>
 * @returns { canvases }
 */
router.get('/list', authMiddleware, getCanvases);

/**
 * @route   GET /api/canvas/:id
 * @desc    Get a specific canvas
 * @header  Authorization: Bearer <token>
 * @returns { canvas }
 */
router.get('/:id', authMiddleware, getCanvas);

/**
 * @route   DELETE /api/canvas/:id
 * @desc    Delete a canvas
 * @header  Authorization: Bearer <token>
 * @returns { message, canvas }
 */
router.delete('/:id', authMiddleware, deleteCanvas);

export default router;
