import Contact from '../models/Contact.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';
import sendEmail from '../utils/sendEmail.js';

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

    // ✅ Step 5: Send Email to Admin
    const adminEmail = process.env.EMAIL_USER || 'yashcollection757@gmail.com';
    const userEmail = contact.email;

    // Email HTML template for admin
    const adminEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1dbbcc 0%, #0ea5e9 100%); padding: 30px; color: white; text-align: center; border-radius: 8px;">
          <h1 style="margin: 0;">New Contact Form Submission</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <h2 style="color: #1b2f3e; margin-top: 0;">Message Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <p style="margin: 10px 0;"><strong>Name:</strong> ${contact.name}</p>
            <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${contact.email}">${contact.email}</a></p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> <a href="tel:${contact.phone}">${contact.phone}</a></p>
            <p style="margin: 10px 0;"><strong>Submitted At:</strong> ${new Date(contact.createdAt).toLocaleString('en-IN')}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #1dbbcc;">
            <h3 style="color: #1b2f3e; margin-top: 0;">Message:</h3>
            <p style="color: #475569; line-height: 1.6;">${contact.message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #70a0b5; font-size: 12px;">This is an automated message from Yash Collections contact form.</p>
        </div>
      </div>
    `;

    // Email HTML template for user
    const userEmailHTML = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1dbbcc 0%, #0ea5e9 100%); padding: 30px; color: white; text-align: center; border-radius: 8px;">
          <h1 style="margin: 0;">Thank You for Reaching Out!</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-top: 20px;">
          <p style="color: #1b2f3e; font-size: 16px;">Hi <strong>${contact.name}</strong>,</p>
          
          <p style="color: #475569; line-height: 1.6;">
            Thank you for contacting Yash Collections! We have received your message and our team will get back to you shortly.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #1dbbcc;">
            <h3 style="color: #1b2f3e; margin-top: 0;">Your Message Details:</h3>
            <p style="margin: 10px 0;"><strong>Email:</strong> ${contact.email}</p>
            <p style="margin: 10px 0;"><strong>Phone:</strong> ${contact.phone}</p>
            <p style="margin: 10px 0; color: #70a0b5; font-size: 12px;">Reference ID: ${contact._id}</p>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            If you have any urgent queries, feel free to call us or reach out directly to <strong>yashcollection757@gmail.com</strong>.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #70a0b5; font-size: 12px;">© 2026 Yash Collections. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send email to admin
    const adminEmailSent = await sendEmail({
      email: adminEmail,
      subject: `New Contact Form Submission from ${contact.name}`,
      html: adminEmailHTML,
    });

    // Send confirmation email to user
    const userEmailSent = await sendEmail({
      email: userEmail,
      subject: 'We received your message - Yash Collections',
      html: userEmailHTML,
    });

    if (!adminEmailSent || !userEmailSent) {
      logger.warn('Email sending failed for contact submission', {
        contactId: contact._id,
        adminEmailSent,
        userEmailSent,
      });
      // Don't fail the request, message is already saved in DB
    }

    logger.info('Emails sent successfully for contact submission', {
      contactId: contact._id,
      adminEmailSent,
      userEmailSent,
    });

    // ✅ Step 6: Success message to user
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
