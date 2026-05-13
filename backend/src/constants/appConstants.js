// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Not authorized to access this route',
  ADMIN_ONLY: 'Admin access required',
  PRODUCT_NOT_FOUND: 'Product not found',
  CART_EMPTY: 'Cart is empty',
  INVALID_INPUT: 'Invalid input provided',
  IMAGE_UPLOAD_FAILED: 'Image upload failed',
  DATABASE_ERROR: 'Database error occurred',
  SERVER_ERROR: 'Internal server error'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  SIGNUP_SUCCESS: 'Account created successfully',
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  CART_UPDATED: 'Cart updated successfully',
  ORDER_CREATED: 'Order created successfully'
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PRODUCT_NAME_MIN_LENGTH: 3,
  PRODUCT_NAME_MAX_LENGTH: 100,
  PRICE_MIN: 0,
  PRICE_MAX: 1000000,
  QUANTITY_MIN: 0,
  QUANTITY_MAX: 99999
};

// API Constants
export const API_CONSTANTS = {
  ITEMS_PER_PAGE: 10,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  JWT_EXPIRE: '30d',
  TOKEN_PREFIX: 'Bearer '
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DISTRIBUTOR: 'distributor',
  RETAILER: 'retailer',
  CUSTOMER: 'customer'
};
