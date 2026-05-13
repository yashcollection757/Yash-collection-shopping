import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  forgotPassword,
  resetPassword,
  forgotPasswordOtp,
  verifyOtp,
  verifyOtpAndResetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password/:token', asyncHandler(resetPassword));
router.post('/forgot-password-otp', asyncHandler(forgotPasswordOtp));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.post('/verify-otp-reset-password', asyncHandler(verifyOtpAndResetPassword));
router.get('/profile', protect, asyncHandler(getProfile));
router.put('/profile', protect, asyncHandler(updateProfile));
router.get('/users', asyncHandler(getAllUsers));
router.put('/users/:id/status', asyncHandler(updateUserStatus));
router.delete('/users/:id', asyncHandler(deleteUser));

export default router;
