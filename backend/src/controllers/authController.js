import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError, sendSuccess, sendError } from '../utils/apiResponse.js';
import { validateSignupInput, validateLoginInput } from '../utils/validators.js';
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES, API_CONSTANTS } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';
import sendEmail from '../utils/sendEmail.js';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role }, 
    process.env.JWT_SECRET, 
    { expiresIn: API_CONSTANTS.JWT_EXPIRE }
  );
};

/**
 * Register/Signup user
 * POST /api/auth/signup
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate input
    const errors = validateSignupInput({ name, email, password });
    if (errors.length > 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT, errors);
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn('Signup attempt with existing email', { email });
      return sendError(res, HTTP_STATUS.CONFLICT, ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Create new user (pending admin approval)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone || undefined,
      isVerified: false,
    });

    logger.info('User registered successfully, pending admin approval', { userId: user._id, email: user.email });

    // Send response IMMEDIATELY — don't wait for email
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      data: { email: user.email },
    });

    // Send welcome email in background (non-blocking)
    sendEmail({
      email: user.email,
      subject: 'Welcome to Yash Collections – Registration Received!',
      html: `
        <div style="font-family:'Inter','Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fbfc;border:1px solid #e5edf2;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1b2f3e,#0d3d4a);padding:36px 32px;text-align:center;">
            <h1 style="color:#1dbbcc;margin:0;font-size:28px;letter-spacing:-0.5px;">Yash Collections</h1>
            <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">B2B Wholesale Portal</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#1b2f3e;margin:0 0 16px;">Welcome, ${user.name}! 🎉</h2>
            <p style="color:#3e6b82;font-size:15px;line-height:1.7;margin:0 0 16px;">Thank you for registering on <strong>Yash Collections</strong>. Your account has been created successfully!</p>
            <div style="background:rgba(29,187,204,0.08);border:1px solid rgba(29,187,204,0.2);border-radius:12px;padding:20px;margin:20px 0;">
              <p style="margin:0;color:#1b2f3e;font-size:14px;font-weight:600;">📋 Registration Details</p>
              <p style="margin:8px 0 0;color:#3e6b82;font-size:14px;">Email: <strong>${user.email}</strong></p>
            </div>
            <div style="background:rgba(229,138,62,0.08);border:1px solid rgba(229,138,62,0.2);border-radius:12px;padding:20px;margin:20px 0;">
              <p style="margin:0;color:#1b2f3e;font-size:14px;font-weight:600;">⏳ Pending Admin Approval</p>
              <p style="margin:8px 0 0;color:#3e6b82;font-size:14px;line-height:1.6;">Your account is currently under review by our team. You will receive another email as soon as your account has been <strong>approved</strong> and you can start placing orders.</p>
            </div>
            <p style="color:#70a0b5;font-size:13px;line-height:1.6;margin:16px 0 0;">If you have any questions, feel free to contact us. We typically review new registrations within 24 hours.</p>
          </div>
          <div style="background:#f0f5f8;padding:20px 32px;border-top:1px solid #e5edf2;text-align:center;">
            <p style="margin:0;color:#70a0b5;font-size:12px;">© 2024 Yash Collections. All rights reserved.</p>
          </div>
        </div>
      `,
    }).then(() => {
      logger.info('Welcome email sent to new user', { email: user.email });
    }).catch(emailErr => {
      logger.error('Failed to send welcome email', { error: emailErr.message });
    });

  } catch (error) {
    logger.error('Signup error', { error: error.message });
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendError(res, HTTP_STATUS.CONFLICT, `${field} already exists`);
    }
    
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = validateLoginInput({ email, password });
    if (errors.length > 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT, errors);
    }

    // --- Admin Login (only ADMIN_EMAIL is allowed) ---
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    
    if (!adminEmail || !adminPassword) {
      logger.error('Admin credentials not configured in environment variables');
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Admin authentication not configured');
    }

    if (email.toLowerCase().trim() === adminEmail) {
      // Upsert admin user in DB to ensure they have a valid _id for references
      let adminUser = await User.findOne({ email: adminEmail }).select('+password');
      if (!adminUser) {
        // First login — create admin from env credentials
        adminUser = await User.create({
          name: 'Admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          isVerified: true,
          phone: '0000000000'
        });
        adminUser = await User.findOne({ email: adminEmail }).select('+password');
      } else {
        let needsSave = false;
        if (adminUser.role !== 'admin' || !adminUser.isVerified) {
          adminUser.role = 'admin';
          adminUser.isVerified = true;
          needsSave = true;
        }
        if (adminUser.name === 'Super Admin') {
          adminUser.name = 'Admin';
          needsSave = true;
        }
        if (needsSave) {
          await adminUser.save({ validateBeforeSave: false });
        }
      }

      // Check: env plain-text password OR DB-stored hashed password (after reset)
      const envPasswordMatch = (password === adminPassword);
      const dbPasswordMatch = await adminUser.matchPassword(password);

      if (!envPasswordMatch && !dbPasswordMatch) {
        logger.warn('Admin login failed: wrong password', { email: adminEmail });
        return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const token = generateToken(adminUser._id, adminUser.role);
      logger.info('Admin logged in successfully', { email: adminEmail });
      
      return sendSuccess(res, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
        token: `${API_CONSTANTS.TOKEN_PREFIX}${token}`,
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          phone: adminUser.phone,
          createdAt: adminUser.createdAt,
        },
      });
    }
    // ------------------------------------


    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      logger.warn('Login attempt with wrong password', { email });
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isVerified) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Your account is pending admin approval. You will be able to log in once approved.');
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    return sendSuccess(res, SUCCESS_MESSAGES.LOGIN_SUCCESS, {
      token: `${API_CONSTANTS.TOKEN_PREFIX}${token}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    logger.error('Login error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get user profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      logger.warn('Profile fetch for non-existent user', { userId: req.user.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return sendSuccess(res, 'Profile retrieved successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    logger.error('Profile fetch error', { error: error.message, userId: req.user.id });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update user profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, addresses } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (addresses !== undefined) updateData.addresses = addresses;

    if (Object.keys(updateData).length === 0) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'No fields to update');
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      logger.warn('User not found for profile update', { userId: req.user.id });
      return sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
    }

    logger.info('User profile updated', { userId: user._id });

    return sendSuccess(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        addresses: user.addresses || [],
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    logger.error('Profile update error', { error: error.message, userId: req.user.id });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Get all users (Admin)
 * GET /api/auth/users
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 'Users retrieved successfully', {
      count: users.length,
      users,
    });
  } catch (error) {
    logger.error('Fetch users error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Update User Status (Approve/Suspend)
 * PUT /api/auth/users/:id/status
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { isVerified, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const isBeingApproved = (isVerified === true && user.isVerified === false);

    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    if (isBeingApproved) {
      try {
        await sendEmail({
          email: user.email,
          subject: '✅ Account Approved – You can now log in to Yash Collections!',
          html: `
            <div style="font-family:'Inter','Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#f8fbfc;border:1px solid #e5edf2;border-radius:16px;overflow:hidden;">
              <div style="background:linear-gradient(135deg,#1b2f3e,#0d3d4a);padding:36px 32px;text-align:center;">
                <h1 style="color:#1dbbcc;margin:0;font-size:28px;letter-spacing:-0.5px;">Yash Collections</h1>
                <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">B2B Wholesale Portal</p>
              </div>
              <div style="padding:32px;text-align:center;">
                <div style="width:70px;height:70px;background:rgba(34,197,94,0.15);border:2px solid rgba(34,197,94,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
                  <span style="font-size:32px;">✅</span>
                </div>
                <h2 style="color:#1b2f3e;margin:0 0 12px;">Account Approved!</h2>
                <p style="color:#3e6b82;font-size:15px;line-height:1.7;margin:0 0 24px;">Hi <strong>${user.name}</strong>, great news! Your account on <strong>Yash Collections</strong> has been reviewed and approved by our team.</p>
                <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:12px;padding:20px;margin:0 0 24px;text-align:left;">
                  <p style="margin:0;color:#1b2f3e;font-size:14px;font-weight:600;">🎊 You can now:</p>
                  <ul style="margin:10px 0 0;padding-left:20px;color:#3e6b82;font-size:14px;line-height:2;">
                    <li>Browse our exclusive B2B catalog</li>
                    <li>Place wholesale orders</li>
                    <li>Manage your account & addresses</li>
                  </ul>
                </div>
              </div>
              <div style="background:#f0f5f8;padding:20px 32px;border-top:1px solid #e5edf2;text-align:center;">
                <p style="margin:0;color:#70a0b5;font-size:12px;">© 2024 Yash Collections. All rights reserved.</p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        logger.error('Failed to send approval email', { userId: user._id, error: err.message });
      }
    }

    logger.info('User status updated', { userId: user._id, isVerified: user.isVerified, isActive: user.isActive });
    
    return sendSuccess(res, 'User status updated successfully', { user });
  } catch (error) {
    logger.error('Update user status error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Forgot Password - Send reset email
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide an email address');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@yashcollections.com').toLowerCase().trim();

    // Only allow admin email for forgot password on admin panel
    if (email.toLowerCase().trim() !== adminEmail) {
      // Return generic message so we don't expose which emails exist
      return sendSuccess(res, 'If this email is registered, a reset link has been sent.', {});
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      // Admin might not exist in DB yet — still return success to avoid leaking info
      return sendSuccess(res, 'If this email is registered, a reset link has been sent.', {});
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    adminUser.resetPasswordToken = hashedToken;
    adminUser.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await adminUser.save({ validateBeforeSave: false });

    const adminDashboardUrl = process.env.ADMIN_URL || 'https://yash-colleciton.vercel.app';
    const resetUrl = `${adminDashboardUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: adminEmail,
        subject: 'Admin Password Reset - Yash Collections',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5edf2; border-radius: 16px; background: #f8fbfc;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 56px; height: 56px; background: rgba(29,187,204,0.15); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🔐</span>
              </div>
            </div>
            <h2 style="color: #1b2f3e; text-align: center; margin: 0 0 8px;">Password Reset Request</h2>
            <p style="color: #3e6b82; text-align: center; font-size: 14px; margin: 0 0 24px;">Yash Collections Admin Portal</p>
            <p style="color: #1b2f3e; font-size: 15px; line-height: 1.6;">You requested a password reset for the admin account. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" style="background: linear-gradient(135deg, #1dbbcc, #0f9aab); color: white; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">Reset My Password</a>
            </div>
            <p style="color: #70a0b5; font-size: 13px; line-height: 1.5;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <div style="border-top: 1px solid #e5edf2; margin-top: 24px; padding-top: 16px;">
              <p style="color: #70a0b5; font-size: 12px; margin: 0;">Or copy this link: <span style="color: #1dbbcc; word-break: break-all;">${resetUrl}</span></p>
            </div>
          </div>
        `,
      });
      logger.info('Password reset email sent', { email: adminEmail });
      return sendSuccess(res, 'If this email is registered, a reset link has been sent.', {});
    } catch (emailErr) {
      adminUser.resetPasswordToken = undefined;
      adminUser.resetPasswordExpire = undefined;
      await adminUser.save({ validateBeforeSave: false });
      logger.error('Failed to send reset email', { error: emailErr.message });
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Email could not be sent. Please try again.');
    }
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Reset Password - Set new password using token
 * POST /api/auth/reset-password/:token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Token and new password are required');
    }
    if (password.length < 6) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 6 characters');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire +password');

    if (!user) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid or expired reset token. Please request a new one.');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    // Also update ADMIN_PASSWORD env reference isn't practical at runtime,
    // so we make admin login also support DB-stored hashed password
    await user.save();

    logger.info('Admin password reset successfully', { userId: user._id });
    return sendSuccess(res, 'Password has been reset successfully. You can now log in.', {});
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Forgot Password OTP - Send OTP to admin email
 * POST /api/auth/forgot-password-otp
 */
export const forgotPasswordOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Please provide an email address');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    
    if (!adminEmail) {
      logger.error('Admin email not configured');
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Admin authentication not configured');
    }

    // Only allow admin email for forgot password
    if (email.toLowerCase().trim() !== adminEmail) {
      // Return generic message so we don't expose which emails exist
      return sendSuccess(res, 'If this email is registered, an OTP has been sent.', {});
    }

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      // Admin might not exist in DB yet — still return success to avoid leaking info
      return sendSuccess(res, 'If this email is registered, an OTP has been sent.', {});
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    adminUser.otp = otp;
    adminUser.otpExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
    await adminUser.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        email: adminEmail,
        subject: 'Admin Password Reset OTP - Yash Collections',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5edf2; border-radius: 16px; background: #f8fbfc;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="width: 56px; height: 56px; background: rgba(29,187,204,0.15); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🔐</span>
              </div>
            </div>
            <h2 style="color: #1b2f3e; text-align: center; margin: 0 0 8px;">Password Reset OTP</h2>
            <p style="color: #3e6b82; text-align: center; font-size: 14px; margin: 0 0 24px;">Yash Collections Admin Portal</p>
            <p style="color: #1b2f3e; font-size: 15px; line-height: 1.6;">Your One-Time Password (OTP) for admin password reset is:</p>
            <div style="text-align: center; margin: 32px 0; padding: 20px; background: #e8f4f8; border-radius: 10px;">
              <span style="font-size: 36px; font-weight: bold; color: #1dbbcc; letter-spacing: 6px;">${otp}</span>
            </div>
            <p style="color: #1b2f3e; font-size: 15px; line-height: 1.6;">This OTP is valid for <strong>15 minutes</strong> only.</p>
            <p style="color: #70a0b5; font-size: 13px; line-height: 1.5; margin-top: 24px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <div style="border-top: 1px solid #e5edf2; margin-top: 24px; padding-top: 16px;">
              <p style="color: #70a0b5; font-size: 12px; margin: 0;">Do not share this OTP with anyone.</p>
            </div>
          </div>
        `,
      });
      logger.info('Password reset OTP sent', { email: adminEmail });
      return sendSuccess(res, 'If this email is registered, an OTP has been sent.', {});
    } catch (emailErr) {
      adminUser.otp = undefined;
      adminUser.otpExpire = undefined;
      await adminUser.save({ validateBeforeSave: false });
      logger.error('Failed to send OTP email', { error: emailErr.message });
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Email could not be sent. Please try again.');
    }
  } catch (error) {
    logger.error('Forgot password OTP error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Verify OTP and Reset Password
 * POST /api/auth/verify-otp-reset-password
 */
export const verifyOtpAndResetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email, OTP, and new password are required');
    }
    if (newPassword.length < 6) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Password must be at least 6 characters');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    
    if (!adminEmail) {
      logger.error('Admin email not configured');
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Admin authentication not configured');
    }

    // Only allow admin email
    if (email.toLowerCase().trim() !== adminEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid email for admin reset');
    }

    const user = await User.findOne({
      email: adminEmail,
      otp: otp,
      otpExpire: { $gt: Date.now() },
    }).select('+otp +otpExpire +password');

    if (!user) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP. Please request a new one.');
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    logger.info('Admin password reset successfully via OTP', { userId: user._id });
    return sendSuccess(res, 'Password has been reset successfully. You can now log in with your new password.', {});
  } catch (error) {
    logger.error('Verify OTP and reset password error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Verify OTP Only (without resetting password)
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email and OTP are required');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();

    if (!adminEmail) {
      logger.error('Admin email not configured');
      return sendError(res, HTTP_STATUS.INTERNAL_ERROR, 'Admin authentication not configured');
    }

    if (email.toLowerCase().trim() !== adminEmail) {
      return sendError(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid email for admin reset');
    }

    const user = await User.findOne({
      email: adminEmail,
      otp: otp,
      otpExpire: { $gt: Date.now() },
    }).select('+otp +otpExpire');

    if (!user) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid or expired OTP. Please request a new one.');
    }

    logger.info('OTP verified successfully', { userId: user._id });
    return sendSuccess(res, 'OTP verified successfully.', {});
  } catch (error) {
    logger.error('Verify OTP error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};

/**
 * Delete User
 * DELETE /api/auth/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    if (user.role === 'admin') {
      return sendError(res, HTTP_STATUS.FORBIDDEN, 'Cannot delete admin user');
    }

    await User.findByIdAndDelete(req.params.id);

    logger.info('User deleted', { userId: req.params.id });
    return sendSuccess(res, 'User deleted successfully', {});
  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    next(new ApiError(HTTP_STATUS.INTERNAL_ERROR, ERROR_MESSAGES.SERVER_ERROR));
  }
};
