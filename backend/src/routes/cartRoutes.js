import express from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  syncCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/', protect, asyncHandler(getCart));
router.post('/sync', protect, asyncHandler(syncCart));       // ← new: sync full cart
router.post('/add', protect, asyncHandler(addToCart));
router.post('/remove', protect, asyncHandler(removeFromCart));
router.put('/update', protect, asyncHandler(updateCartItem));
router.post('/clear', protect, asyncHandler(clearCart));

export default router;
