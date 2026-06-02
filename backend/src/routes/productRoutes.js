import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} from '../controllers/productController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Admin endpoint - returns all products including inactive ones
router.get('/admin/all', asyncHandler(getAllProductsAdmin));

router.get('/', asyncHandler(getAllProducts));
router.get('/:id', asyncHandler(getProductById));
router.post('/', asyncHandler(createProduct));
router.put('/:id', asyncHandler(updateProduct));
router.delete('/:id', asyncHandler(deleteProduct));

export default router;
