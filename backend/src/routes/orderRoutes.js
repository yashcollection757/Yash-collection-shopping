import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/', protect, asyncHandler(createOrder));
router.get('/my-orders', protect, asyncHandler(getMyOrders));
router.get('/:id', protect, asyncHandler(getOrderById));
router.put('/:id/status', asyncHandler(updateOrderStatus));
router.get('/', asyncHandler(getAllOrders));

export default router;
