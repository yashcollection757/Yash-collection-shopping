import Collection from '../models/Collection.js';
import cloudinary from '../config/cloudinary.js';
import { sendSuccess, sendError, ApiError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

/**
 * Get all active collections
 * GET /api/collections
 */
export const getAllCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({ isActive: true }).sort({ createdAt: -1 });
    return sendSuccess(res, 'Collections retrieved successfully', { collections });
  } catch (error) {
    logger.error('Error fetching collections', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get all collections (admin — includes inactive)
 * GET /api/collections/admin/all
 */
export const getAllCollectionsAdmin = async (req, res, next) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    return sendSuccess(res, 'Collections retrieved successfully', { collections });
  } catch (error) {
    logger.error('Error fetching collections (admin)', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Create new collection (with optional Multer image upload to Cloudinary)
 * POST /api/collections
 */
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Collection name is required');
    }

    const existing = await Collection.findOne({ name: name.trim() });
    if (existing) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Collection with this name already exists');
    }

    let imageUrl = '';
    let imagePublicId = '';

    // If a file was uploaded via Multer, push to Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'yash-collection/collections',
            public_id: `collection-${Date.now()}`,
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    const collection = await Collection.create({
      name: name.trim(),
      description: description?.trim() || '',
      image: imageUrl,
      imagePublicId,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
    });

    logger.info('Collection created', { id: collection._id, name: collection.name });
    return sendSuccess(res, 'Collection created successfully', { collection }, HTTP_STATUS.CREATED);
  } catch (error) {
    logger.error('Error creating collection', { error: error.message });
    if (error.code === 11000) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Collection already exists');
    }
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update collection
 * PUT /api/collections/:id
 */
export const updateCollection = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;

    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Collection not found');
    }

    if (name) collection.name = name.trim();
    if (description !== undefined) collection.description = description.trim();
    if (isActive !== undefined) collection.isActive = isActive === 'true' || isActive === true;

    // If a new file was uploaded, replace image in Cloudinary
    if (req.file) {
      // Delete old image from Cloudinary if it exists
      if (collection.imagePublicId) {
        await cloudinary.uploader.destroy(collection.imagePublicId).catch(() => {});
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: 'yash-collection/collections',
            public_id: `collection-${Date.now()}`,
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      collection.image = result.secure_url;
      collection.imagePublicId = result.public_id;
    }

    await collection.save();
    logger.info('Collection updated', { id: collection._id });
    return sendSuccess(res, 'Collection updated successfully', { collection });
  } catch (error) {
    logger.error('Error updating collection', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Delete collection
 * DELETE /api/collections/:id
 */
export const deleteCollection = async (req, res, next) => {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Collection not found');
    }

    // Delete image from Cloudinary
    if (collection.imagePublicId) {
      await cloudinary.uploader.destroy(collection.imagePublicId).catch(() => {});
    }

    await collection.deleteOne();
    logger.info('Collection deleted', { id: req.params.id });
    return sendSuccess(res, 'Collection deleted successfully');
  } catch (error) {
    logger.error('Error deleting collection', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};
