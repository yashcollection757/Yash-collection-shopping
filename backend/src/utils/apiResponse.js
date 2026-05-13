import { HTTP_STATUS } from '../constants/appConstants.js';

/**
 * Standard API Response Format
 * {
 *   success: boolean,
 *   statusCode: number,
 *   message: string,
 *   data: any (optional),
 *   errors: array (optional)
 * }
 */

export class ApiResponse {
  constructor(statusCode, message, data = null, errors = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    
    if (data !== null) {
      this.data = data;
    }
    
    if (errors && errors.length > 0) {
      this.errors = errors;
    }
  }
}

export class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'ApiError';
  }
}

/**
 * Helper function to send standardized success response
 */
export const sendSuccess = (res, message, data = null, statusCode = HTTP_STATUS.OK) => {
  const response = new ApiResponse(statusCode, message, data);
  return res.status(statusCode).json(response);
};

/**
 * Helper function to send standardized error response
 */
export const sendError = (res, statusCode, message, errors = null) => {
  const response = new ApiResponse(statusCode, message, null, errors);
  return res.status(statusCode).json(response);
};

/**
 * Validation error formatter
 */
export const formatValidationError = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(err => ({
      field: err.param || err.field,
      message: err.msg || err.message
    }));
  }
  return [];
};
