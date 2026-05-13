import jwt from 'jsonwebtoken';
import { sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES, USER_ROLES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to protect routes - requires valid JWT token
 */
export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error.message });
    return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
  }
};

/**
 * Middleware to check if user is admin
 */
export const admin = (req, res, next) => {
  if (!req.user || req.user.role !== USER_ROLES.ADMIN) {
    return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ADMIN_ONLY);
  }
  next();
};

/**
 * Middleware to check if user has specific role
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, HTTP_STATUS.FORBIDDEN, ERROR_MESSAGES.ADMIN_ONLY);
    }
    next();
  };
};

/**
 * Global error handling middleware
 * Should be the last middleware in the stack
 * IMPORTANT: Must have 4 parameters (err, req, res, next) for Express to recognize it as error handler
 */
export const errorHandler = (err, req, res, next) => {
  try {
    const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_ERROR;
    const message = err.message || ERROR_MESSAGES.SERVER_ERROR;
    const errors = err.errors || null;

    logger.error('Request error', { 
      statusCode, 
      message, 
      path: req.path,
      method: req.method,
      error: err.stack?.split('\n')[0]
    });

    // Make sure we haven't already sent a response
    if (res.headersSent) {
      return next(err);
    }

    return sendError(res, statusCode, message, errors);
  } catch (handlerError) {
    logger.error('Error handler crashed', { error: handlerError.message });
    
    // Fallback response if error handler itself fails
    if (!res.headersSent) {
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        statusCode: HTTP_STATUS.INTERNAL_ERROR,
        message: ERROR_MESSAGES.SERVER_ERROR
      });
    }
  }
};
