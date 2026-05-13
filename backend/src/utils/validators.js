import { VALIDATION_RULES, ERROR_MESSAGES } from '../constants/appConstants.js';

export const validateEmail = (email) => {
  return VALIDATION_RULES.EMAIL_REGEX.test(email);
};

export const validatePassword = (password) => {
  return password && password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH;
};

export const validateName = (name) => {
  return name && 
         name.length >= VALIDATION_RULES.NAME_MIN_LENGTH && 
         name.length <= VALIDATION_RULES.NAME_MAX_LENGTH;
};

export const validateProductName = (name) => {
  return name && 
         name.length >= VALIDATION_RULES.PRODUCT_NAME_MIN_LENGTH && 
         name.length <= VALIDATION_RULES.PRODUCT_NAME_MAX_LENGTH;
};

export const validatePrice = (price) => {
  const numPrice = parseFloat(price);
  return !isNaN(numPrice) && 
         numPrice >= VALIDATION_RULES.PRICE_MIN && 
         numPrice <= VALIDATION_RULES.PRICE_MAX;
};

export const validateQuantity = (quantity) => {
  const numQty = parseInt(quantity);
  return !isNaN(numQty) && 
         numQty >= VALIDATION_RULES.QUANTITY_MIN && 
         numQty <= VALIDATION_RULES.QUANTITY_MAX;
};

/**
 * Validates signup request body
 */
export const validateSignupInput = (data) => {
  const errors = [];
  
  if (!data.name || !validateName(data.name)) {
    errors.push({
      field: 'name',
      message: `Name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
    });
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please provide a valid email address'
    });
  }
  
  if (!data.password || !validatePassword(data.password)) {
    errors.push({
      field: 'password',
      message: `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters long`
    });
  }

  if (data.phone) {
    const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push({
        field: 'phone',
        message: 'Please provide a valid 10-digit Indian phone number'
      });
    }
  }
  
  return errors;
};

/**
 * Validates login request body
 */
export const validateLoginInput = (data) => {
  const errors = [];
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please provide a valid email address'
    });
  }
  
  if (!data.password) {
    errors.push({
      field: 'password',
      message: 'Password is required'
    });
  }
  
  return errors;
};

/**
 * Validates product creation/update request body
 */
export const validateProductInput = (data) => {
  const errors = [];
  
  if (!data.name || !validateProductName(data.name)) {
    errors.push({
      field: 'name',
      message: `Product name must be between ${VALIDATION_RULES.PRODUCT_NAME_MIN_LENGTH} and ${VALIDATION_RULES.PRODUCT_NAME_MAX_LENGTH} characters`
    });
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: 'Description is required'
    });
  }
  
  if (!data.category) {
    errors.push({
      field: 'category',
      message: 'Category is required'
    });
  }
  
  if (!data.image) {
    errors.push({
      field: 'image',
      message: 'Product image is required'
    });
  }
  
  if (!Array.isArray(data.variants) || data.variants.length === 0) {
    errors.push({
      field: 'variants',
      message: 'At least one product variant is required'
    });
  } else {
    data.variants.forEach((variant, index) => {
      if (!variant.size) {
        errors.push({
          field: `variants[${index}].size`,
          message: 'Size is required for each variant'
        });
      }
      
      if (!validatePrice(variant.price)) {
        errors.push({
          field: `variants[${index}].price`,
          message: 'Valid price is required'
        });
      }
      
      if (!validatePrice(variant.originalPrice)) {
        errors.push({
          field: `variants[${index}].originalPrice`,
          message: 'Valid original price is required'
        });
      }
      
      if (!validateQuantity(variant.quantity)) {
        errors.push({
          field: `variants[${index}].quantity`,
          message: 'Valid quantity is required'
        });
      }
    });
  }
  
  return errors;
};

/**
 * Validates add to cart request
 */
export const validateCartInput = (data) => {
  const errors = [];
  
  if (!data.productId) {
    errors.push({
      field: 'productId',
      message: 'Product ID is required'
    });
  }
  
  if (!data.size) {
    errors.push({
      field: 'size',
      message: 'Size is required'
    });
  }
  
  if (!validateQuantity(data.quantity)) {
    errors.push({
      field: 'quantity',
      message: 'Valid quantity is required'
    });
  }
  
  return errors;
};
