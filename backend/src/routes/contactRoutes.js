import express from 'express';
import { submitContact, getContactMessages } from '../controllers/contactController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/contact/submit
 * Submit a contact form
 */
router.post('/submit', protect, submitContact);

/**
 * GET /api/contact/messages
 * Get all contact messages (admin view)
 */
router.get('/messages', protect, admin, getContactMessages);

export default router;
