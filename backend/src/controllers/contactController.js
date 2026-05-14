import Contact from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';


/**
 * Submit Contact Form
 * POST /api/contact/submit
 */
export const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, message } = req.body;

    // ✅ Step 1: Frontend Validation (basic check)
    if (!name || !email || !phone || !message) {
      logger.warn('Contact form submission with missing fields', { email });
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_INPUT,
        ['All fields are required']
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_INPUT,
        ['Please provide a valid email address']
      );
    }

    // Validate phone format (basic)
    const phoneRegex = /^(\+91[\-\s]?)?[6789]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_INPUT,
        ['Please provide a valid 10-digit Indian phone number']
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_INPUT,
        ['Message must be at least 10 characters']
      );
    }

    if (message.length > 300) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.INVALID_INPUT,
        ['Message cannot exceed 300 characters']
      );
    }

    // ✅ Step 4: Save message in MongoDB
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      message: message.trim(),
      status: 'new',
    });

    logger.info('Contact form submitted successfully', {
      contactId: contact._id,
      email: contact.email,
      name: contact.name,
    });

    // ✅ Step 5: Success message to user
    return sendSuccess(
      res,
      SUCCESS_MESSAGES.REQUEST_SUCCESSFUL || 'Your message has been received successfully!',
      {
        contactId: contact._id,
        message: 'We will get back to you shortly at ' + contact.email,
      },
      HTTP_STATUS.CREATED
    );
  } catch (error) {
    logger.error('Contact form submission error', { error: error.message });
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Get all contact messages (Admin only)
 * GET /api/contact/messages
 */
export const getContactMessages = async (req, res, next) => {
  try {
    // Check if user is admin (you'd need to add this logic)
    const messages = await Contact.find().sort({ createdAt: -1 });

    return sendSuccess(res, 'Contact messages retrieved successfully', {
      total: messages.length,
      messages,
    });
  } catch (error) {
    logger.error('Error fetching contact messages', { error: error.message });
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.INTERNAL_SERVER_ERROR
    );
  }
};
