import express from 'express';
import {
  getAllCollections,
  getAllCollectionsAdmin,
  createCollection,
  updateCollection,
  deleteCollection,
} from '../controllers/collectionController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public — B2B frontend fetches active collections only
router.get('/', asyncHandler(getAllCollections));

// Admin — all collections including inactive
router.get('/admin/all', asyncHandler(getAllCollectionsAdmin));

// Admin CRUD — Multer handles image upload (memoryStorage → Cloudinary)
router.post('/', upload.single('image'), asyncHandler(createCollection));
router.put('/:id', upload.single('image'), asyncHandler(updateCollection));
router.delete('/:id', asyncHandler(deleteCollection));

export default router;
