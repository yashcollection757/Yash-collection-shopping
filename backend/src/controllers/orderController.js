import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { ApiError, sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * Create new order
 * POST /api/orders
 * Body: { shippingAddress, paymentMethod, items, subtotal, shipping, total }
 */
export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, items, subtotal, shipping, total, orderNote } = req.body;

    // Validate input
    if (!shippingAddress || !paymentMethod) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT, [
        shippingAddress ? null : { field: 'shippingAddress', message: 'Shipping address is required' },
        paymentMethod ? null : { field: 'paymentMethod', message: 'Payment method is required' }
      ].filter(Boolean));
    }

    if (!items || items.length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Order items are required');
    }

    const calculatedSubtotal = subtotal || items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const calculatedShipping = shipping !== undefined ? shipping : (calculatedSubtotal > 5000 ? 0 : 200);
    const totalPrice = total || (calculatedSubtotal + calculatedShipping);

    // Create order
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      user: req.user.id,
      items: items.map(item => ({
        productId: item.productId || item.id,
        name: item.name,
        size: item.size,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        color: item.color || 'Default',
      })),
      shippingAddress,
      subtotal: calculatedSubtotal,
      tax: 0,
      shipping: calculatedShipping,
      totalPrice,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'placed',
      orderNote,
    });

    // Decrement stock for the ordered items
    for (const item of items) {
      if (item.productId || item.id) {
        const prodId = item.productId || item.id;
        try {
          const prod = await Product.findById(prodId);
          if (prod) {
            const variantIndex = prod.variants.findIndex(v => v.size === item.size);
            if (variantIndex > -1) {
              prod.variants[variantIndex].quantity = Math.max(0, prod.variants[variantIndex].quantity - item.quantity);
              await prod.save();
            }
          }
        } catch (err) {
          logger.error('Failed to decrement stock', { productId: prodId, error: err.message });
        }
      }
    }

    logger.info('Order created successfully', { orderId: order._id, orderNumber: order.orderNumber, userId: req.user.id });

    // Send Order Confirmation Email
    if (shippingAddress.email) {
      const itemsHtml = items.map(item => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5edf2;">
            <span style="color:#1b2f3e;font-weight:600;font-size:14px;">${item.name}</span>
            <br/><span style="color:#70a0b5;font-size:12px;">Size: ${item.size || '—'} &nbsp;|&nbsp; Qty: ${item.quantity}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e5edf2;text-align:right;color:#1b2f3e;font-weight:700;font-size:14px;">
            ₹${(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('');

      sendEmail({
        email: shippingAddress.email,
        subject: `Order Received – ${order.orderNumber} | Yash Collections`,
        html: `
          <div style="font-family:'Inter','Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fbfc;border:1px solid #e5edf2;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1b2f3e,#0d3d4a);padding:32px;text-align:center;">
              <h1 style="color:#1dbbcc;margin:0;font-size:26px;letter-spacing:-0.5px;">Yash Collections</h1>
              <p style="color:rgba(255,255,255,0.6);margin:5px 0 0;font-size:12px;">B2B Wholesale Portal</p>
            </div>
            <div style="padding:32px;">
              <h2 style="color:#1b2f3e;margin:0 0 6px;">Order Received! 🛍️</h2>
              <p style="color:#3e6b82;font-size:15px;margin:0 0 20px;">Hi <strong>${shippingAddress.name}</strong>, your order has been placed successfully.</p>

              <div style="background:rgba(229,138,62,0.08);border:1px solid rgba(229,138,62,0.25);border-radius:12px;padding:16px;margin-bottom:20px;display:flex;align-items:center;gap:12px;">
                <span style="font-size:22px;">⏳</span>
                <div>
                  <p style="margin:0;color:#1b2f3e;font-size:14px;font-weight:700;">Status: Pending Admin Review</p>
                  <p style="margin:4px 0 0;color:#3e6b82;font-size:13px;">Our team will review and process your order shortly. You'll receive an update once it's confirmed.</p>
                </div>
              </div>

              <div style="background:white;border:1px solid #e5edf2;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 12px;color:#1b2f3e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Order Details</p>
                <p style="margin:0 0 6px;color:#70a0b5;font-size:13px;">Order ID: <strong style="color:#1b2f3e;">${order.orderNumber}</strong></p>
                <p style="margin:0;color:#70a0b5;font-size:13px;">Payment: <strong style="color:#1b2f3e;">${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod}</strong></p>
              </div>

              <div style="background:white;border:1px solid #e5edf2;border-radius:12px;padding:20px;margin-bottom:20px;">
                <p style="margin:0 0 12px;color:#1b2f3e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Items Ordered</p>
                <table style="width:100%;border-collapse:collapse;">
                  ${itemsHtml}
                </table>
                <div style="margin-top:14px;padding-top:14px;border-top:2px solid #e5edf2;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                    <span style="color:#70a0b5;font-size:13px;">Subtotal</span>
                    <span style="color:#1b2f3e;font-size:13px;">₹${calculatedSubtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                    <span style="color:#70a0b5;font-size:13px;">Shipping</span>
                    <span style="color:#1b2f3e;font-size:13px;">${calculatedShipping === 0 ? 'FREE' : '₹' + calculatedShipping}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid #e5edf2;">
                    <span style="color:#1b2f3e;font-size:15px;font-weight:800;">Total</span>
                    <span style="color:#1dbbcc;font-size:15px;font-weight:800;">₹${totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div style="background:white;border:1px solid #e5edf2;border-radius:12px;padding:20px;">
                <p style="margin:0 0 8px;color:#1b2f3e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Shipping To</p>
                <p style="margin:0;color:#3e6b82;font-size:14px;line-height:1.7;">${shippingAddress.name}<br/>${shippingAddress.address || ''}, ${shippingAddress.city || ''}<br/>${shippingAddress.state || ''} - ${shippingAddress.pincode || ''}<br/>📞 ${shippingAddress.phone || ''}</p>
              </div>
            </div>
            <div style="background:#f0f5f8;padding:18px 32px;border-top:1px solid #e5edf2;text-align:center;">
              <p style="margin:0;color:#70a0b5;font-size:12px;">© 2024 Yash Collections. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(err => logger.error('Failed to send order confirmation email', { error: err.message }));
    }

    return sendSuccess(res, SUCCESS_MESSAGES.ORDER_CREATED, { order }, HTTP_STATUS.CREATED);

  } catch (error) {
    logger.error('Error creating order', { error: error.message, userId: req.user.id });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get user's orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    logger.info('User orders retrieved', { userId: req.user.id, count: orders.length });

    return sendSuccess(res, 'Orders retrieved successfully', {
      count: orders.length,
      orders,
    });

  } catch (error) {
    logger.error('Error fetching user orders', { error: error.message, userId: req.user.id });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get order by ID
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      logger.warn('Order not found', { orderId: req.params.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn('Unauthorized order access attempt', { orderId: req.params.id, userId: req.user.id });
      return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ADMIN_ONLY);
    }

    logger.info('Order retrieved', { orderId: req.params.id });
    return sendSuccess(res, 'Order retrieved successfully', { order });

  } catch (error) {
    logger.error('Error fetching order', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update order status (Admin only)
 * PUT /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      logger.warn('Order not found for status update', { orderId: req.params.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Order not found');
    }

    const oldStatus = order.orderStatus;

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    // Send Delivered Email if status changed to delivered
    if (orderStatus === 'delivered' && oldStatus !== 'delivered' && order.shippingAddress && order.shippingAddress.email) {
      const deliveredItemsHtml = order.items.map(item => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5edf2;">
            <span style="color:#1b2f3e;font-weight:600;font-size:13px;">${item.name}</span>
            <br/><span style="color:#70a0b5;font-size:12px;">Size: ${item.size || '—'} &nbsp;|&nbsp; Qty: ${item.quantity}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5edf2;text-align:right;color:#1b2f3e;font-weight:700;font-size:13px;">
            ₹${(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `).join('');

      sendEmail({
        email: order.shippingAddress.email,
        subject: `✅ Order Delivered – ${order.orderNumber} | Yash Collections`,
        html: `
          <div style="font-family:'Inter','Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fbfc;border:1px solid #e5edf2;border-radius:16px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#1b2f3e,#0d3d4a);padding:32px;text-align:center;">
              <h1 style="color:#1dbbcc;margin:0;font-size:26px;letter-spacing:-0.5px;">Yash Collections</h1>
              <p style="color:rgba(255,255,255,0.6);margin:5px 0 0;font-size:12px;">B2B Wholesale Portal</p>
            </div>
            <div style="padding:32px;text-align:center;">
              <div style="width:72px;height:72px;background:rgba(34,197,94,0.12);border:2px solid rgba(34,197,94,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
                <span style="font-size:34px;">✅</span>
              </div>
              <h2 style="color:#1b2f3e;margin:0 0 8px;">Order Delivered!</h2>
              <p style="color:#3e6b82;font-size:15px;margin:0 0 24px;">Hi <strong>${order.shippingAddress.name}</strong>, your order has been successfully delivered. Thank you for shopping with us!</p>

              <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:16px;margin-bottom:24px;text-align:left;">
                <p style="margin:0;color:#1b2f3e;font-size:13px;font-weight:700;">Order ID: ${order.orderNumber}</p>
                <p style="margin:6px 0 0;color:#3e6b82;font-size:13px;">Status: <strong style="color:#22c55e;">Delivered 📦</strong></p>
              </div>

              <div style="background:white;border:1px solid #e5edf2;border-radius:12px;padding:20px;margin-bottom:20px;text-align:left;">
                <p style="margin:0 0 12px;color:#1b2f3e;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Items Delivered</p>
                <table style="width:100%;border-collapse:collapse;">
                  ${deliveredItemsHtml}
                </table>
                <div style="margin-top:12px;padding-top:12px;border-top:2px solid #e5edf2;display:flex;justify-content:space-between;">
                  <span style="color:#1b2f3e;font-weight:800;font-size:14px;">Total Paid</span>
                  <span style="color:#1dbbcc;font-weight:800;font-size:14px;">₹${order.totalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <p style="color:#70a0b5;font-size:13px;text-align:left;">If you have any questions about your order, feel free to contact us.</p>
            </div>
            <div style="background:#f0f5f8;padding:18px 32px;border-top:1px solid #e5edf2;text-align:center;">
              <p style="margin:0;color:#70a0b5;font-size:12px;">© 2024 Yash Collections. All rights reserved.</p>
            </div>
          </div>
        `
      }).catch(err => logger.error('Failed to send order delivered email', { error: err.message }));
    }

    logger.info('Order status updated', { orderId: order._id, orderStatus, paymentStatus });
    return sendSuccess(res, 'Order updated successfully', { order });

  } catch (error) {
    logger.error('Error updating order status', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get all orders (Admin only)
 * GET /api/orders (with admin role)
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const totalCount = await Order.countDocuments(filter);

    logger.info('All orders retrieved', { count: orders.length, status });

    return sendSuccess(res, 'Orders retrieved successfully', {
      count: orders.length,
      total: totalCount,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(totalCount / parseInt(limit)),
      orders,
    });

  } catch (error) {
    logger.error('Error fetching all orders', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};
