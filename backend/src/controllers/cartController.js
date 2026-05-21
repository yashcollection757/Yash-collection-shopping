import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ApiError, sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

const calcTotals = (items) => ({
  totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
});

/**
 * Get user's cart
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    const responseData = cart || { items: [], totalPrice: 0, totalItems: 0 };
    logger.info('Cart retrieved', { userId: req.user.id, itemsCount: responseData.items?.length || 0 });
    return sendSuccess(res, 'Cart retrieved successfully', { cart: responseData });
  } catch (error) {
    logger.error('Error fetching cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Sync entire cart (replace) from frontend localStorage
 * POST /api/cart/sync
 * Body: { items: [ { id, productId, name, size, sku, quantity, price, image } ] }
 */
export const syncCart = async (req, res, next) => {
  try {
    const { items = [] } = req.body;

    const mappedItems = items.map(item => ({
      itemId: item.id,
      productId: String(item.productId || ''),
      name: item.name,
      size: item.size,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      color: item.color || 'Default',
    }));

    const { totalPrice, totalItems } = calcTotals(mappedItems);

    const cart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: mappedItems, totalPrice, totalItems },
      { upsert: true, new: true }
    );

    logger.info('Cart synced', { userId: req.user.id, itemCount: mappedItems.length });
    return sendSuccess(res, 'Cart synced successfully', { cart });
  } catch (error) {
    logger.error('Error syncing cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Add item to cart AND reserve stock from product
 * POST /api/cart/add
 * Body: { id, productId, name, size, sku, quantity = 1, price, image, variantId }
 */
export const addToCart = async (req, res, next) => {
  try {
    const { id, productId, name, size, sku, quantity = 1, price, image, color = 'Default', variantId } = req.body;

    if (!id || !name || !price || !productId) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT);
    }

    const qty = parseInt(quantity);
    if (qty <= 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Quantity must be greater than 0');
    }

    // Fetch product and check stock for the specific variant
    const product = await Product.findById(productId);
    if (!product) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Product not found');
    }

    // Find the variant
    const variant = variantId 
      ? product.variants.find(v => v._id.toString() === variantId)
      : product.variants.find(v => v.size === size);

    if (!variant) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Product variant not found');
    }

    // Check current stock (just verify, don't reserve)
    if (variant.quantity < qty) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        `Insufficient stock. Only ${variant.quantity} pieces available for ${variant.size}`
      );
    }

    logger.info('Stock availability verified', {
      productId,
      variantSize: variant.size,
      quantityRequested: qty,
      availableStock: variant.quantity,
    });

    // Now add to user's cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingIdx = cart.items.findIndex(i => i.itemId === id);
    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += qty;
    } else {
      cart.items.push({
        itemId: id,
        productId: String(productId),
        variantId: variantId ? variantId.toString() : undefined,
        name,
        size,
        sku,
        quantity: qty,
        price,
        image,
        color,
      });
    }

    const totals = calcTotals(cart.items);
    cart.totalPrice = totals.totalPrice;
    cart.totalItems = totals.totalItems;

    await cart.save();

    logger.info('Item added to cart with stock reservation', { userId: req.user.id, itemId: id, quantityAdded: qty });
    return sendSuccess(
      res,
      `${qty} piece${qty > 1 ? 's' : ''} added to cart!`,
      { cart, remainingStock: variant.quantity },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Error adding to cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Remove item from cart AND return stock to product
 * POST /api/cart/remove
 * Body: { id, productId, variantId, quantity }
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const { id, productId, variantId, quantity } = req.body;
    if (!id) return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Cart not found');

    const itemIdx = cart.items.findIndex(i => i.itemId === id);
    if (itemIdx === -1) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Item not found in cart');

    const removedQty = quantity || cart.items[itemIdx].quantity;

    // No stock manipulation on removal - stock only changes on actual order
    logger.info('Item removed from cart (stock unchanged)', { productId, quantityRemoved: removedQty });

    cart.items.splice(itemIdx, 1);
    const totals = calcTotals(cart.items);
    cart.totalPrice = totals.totalPrice;
    cart.totalItems = totals.totalItems;
    await cart.save();

    logger.info('Item removed from cart', { userId: req.user.id, itemId: id });
    return sendSuccess(res, SUCCESS_MESSAGES.CART_UPDATED, { cart });
  } catch (error) {
    logger.error('Error removing from cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/update
 * Body: { id, quantity }
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { id, quantity } = req.body;
    if (!id || quantity === undefined) return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT);

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Cart not found');

    const idx = cart.items.findIndex(i => i.itemId === id);
    if (idx === -1) return sendError(res, HTTP_STATUS.NOT_FOUND, 'Item not found in cart');

    if (parseInt(quantity) <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].quantity = parseInt(quantity);
    }

    const totals = calcTotals(cart.items);
    cart.totalPrice = totals.totalPrice;
    cart.totalItems = totals.totalItems;
    await cart.save();

    logger.info('Cart item updated', { userId: req.user.id, itemId: id, quantity });
    return sendSuccess(res, SUCCESS_MESSAGES.CART_UPDATED, { cart });
  } catch (error) {
    logger.error('Error updating cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Clear entire cart AND return all stock
 * POST /api/cart/clear
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    
    // No stock manipulation on clear - stock only changes on actual order

    const clearedCart = await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalPrice: 0, totalItems: 0 },
      { new: true }
    );

    logger.info('Cart cleared and stock returned', { userId: req.user.id });
    return sendSuccess(res, 'Cart cleared successfully', { cart: clearedCart });
  } catch (error) {
    logger.error('Error clearing cart', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};
