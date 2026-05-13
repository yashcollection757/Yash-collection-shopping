import express from 'express';
import cloudinary from '../config/cloudinary.js';
import upload from '../middleware/upload.js';
import { sendSuccess, sendError, ApiError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

/**
 * Upload image to Cloudinary
 * POST /api/upload
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req, res, next) => {
  try {
    // Multer already validated size and type — just check file exists
    if (!req.file) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No file provided');
    }

    // Determine folder based on type query parameter
    const type = req.query.type || 'products'; // 'products', 'banners', 'collections'
    const folder = `yash-collection/${type}`;

    // Upload to Cloudinary from buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: folder,
          public_id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quality: 'auto',
          fetch_format: 'auto',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    logger.info('Image uploaded successfully', {
      fileName: req.file.originalname,
      publicId: result.public_id,
      size: req.file.size,
    });

    return sendSuccess(res, 'Image uploaded successfully', {
      imageUrl:  result.secure_url,
      publicId:  result.public_id,
      size:      result.bytes,
      format:    result.format,
    });

  } catch (error) {
    logger.error('Image upload error', {
      error:    error.message,
      fileName: req.file?.originalname,
    });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.IMAGE_UPLOAD_FAILED));
  }
}));

export default router;

