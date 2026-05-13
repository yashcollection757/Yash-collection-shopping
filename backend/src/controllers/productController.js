import Product from '../models/Product.js';
import { ApiError, sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateProductInput } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, API_CONSTANTS } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

/**
 * Get all products with filtering and search
 * GET /api/products
 */
export const getAllProducts = async (req, res, next) => {
  try {
    const { category, minPrice, maxPrice, search, page = 1, limit = API_CONSTANTS.ITEMS_PER_PAGE } = req.query;

    let filter = { isActive: true };

    // Category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // Search filter
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Filter by price range (checking all variants)
    let filteredProducts = products;
    if (minPrice || maxPrice) {
      filteredProducts = products.filter((product) => {
        const variantPrices = product.variants.map((v) => v.price);
        if (variantPrices.length === 0) return false;
        
        const minVariantPrice = Math.min(...variantPrices);
        const maxVariantPrice = Math.max(...variantPrices);

        if (minPrice && maxVariantPrice < parseInt(minPrice)) return false;
        if (maxPrice && minVariantPrice > parseInt(maxPrice)) return false;
        return true;
      });
    }

    const totalCount = await Product.countDocuments(filter);

    logger.info('Products fetched', { count: filteredProducts.length, filters: { category, search } });

    return sendSuccess(res, 'Products retrieved successfully', {
      count: filteredProducts.length,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / parseInt(limit)),
      products: filteredProducts,
    });

  } catch (error) {
    logger.error('Error fetching products', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      logger.warn('Product not found', { productId: req.params.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    logger.info('Product fetched by ID', { productId: req.params.id });

    return sendSuccess(res, 'Product retrieved successfully', { product });

  } catch (error) {
    logger.error('Error fetching product', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Create new product
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, image, variants, volumePricing } = req.body;

    // Validate input
    const errors = validateProductInput({
      name,
      description,
      category,
      image,
      variants,
    });

    if (errors.length > 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT, errors);
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ name: name.trim() });
    if (existingProduct) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Product with this name already exists');
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      image,
      variants: variants.map(v => ({
        size: v.size.trim(),
        price: parseFloat(v.price),
        originalPrice: parseFloat(v.originalPrice),
        quantity: parseInt(v.quantity),
        sku: v.sku || `${name.substring(0, 3)}-${v.size}-${Date.now()}`.toUpperCase(),
      })),
      volumePricing: volumePricing || 'Available',
      // createdBy removed as auth is disabled for dashboard
    });

    logger.info('Product created successfully', { productId: product._id, name: product.name });

    return sendSuccess(res, SUCCESS_MESSAGES.PRODUCT_CREATED, { product }, HTTP_STATUS.CREATED);

  } catch (error) {
    logger.error('Error creating product', { error: error.message });
    
    if (error.code === 11000) {
      return sendError(res, HTTP_STATUS.CONFLICT, 'Product already exists');
    }
    
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { name, description, category, image, variants, volumePricing, isActive } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Product not found for update', { productId: req.params.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Update allowed fields
    if (name) product.name = name.trim();
    if (description) product.description = description.trim();
    if (category) product.category = category.trim();
    if (image) product.image = image;
    if (volumePricing !== undefined) product.volumePricing = volumePricing;
    if (isActive !== undefined) product.isActive = isActive;

    // Handle variants update
    if (variants && Array.isArray(variants)) {
      product.variants = variants.map(v => ({
        size: v.size.trim(),
        price: parseFloat(v.price),
        originalPrice: parseFloat(v.originalPrice),
        quantity: parseInt(v.quantity),
        sku: v.sku || `${product.name.substring(0, 3)}-${v.size}-${Date.now()}`.toUpperCase(),
      }));
    }

    await product.save();

    logger.info('Product updated successfully', { productId: product._id });

    return sendSuccess(res, SUCCESS_MESSAGES.PRODUCT_UPDATED, { product });

  } catch (error) {
    logger.error('Error updating product', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Delete product (soft delete)
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      logger.warn('Product not found for deletion', { productId: req.params.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PRODUCT_NOT_FOUND);
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    logger.info('Product deleted successfully', { productId: product._id });

    return sendSuccess(res, SUCCESS_MESSAGES.PRODUCT_DELETED);

  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};
