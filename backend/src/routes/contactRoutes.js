import express from 'express';
import { submitContact, getContactMessages } from '../controllers/contactController.js';

const router = express.Router();

/**
 * POST /api/contact/submit
 * Submit a contact form
 */
router.post('/submit', submitContact);

/**
 * GET /api/contact/messages
 * Get all contact messages (admin view)
 */
router.get('/messages', getContactMessages);

export default router;
