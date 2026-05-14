import nodemailer from 'nodemailer';
import { logger } from './logger.js';

/**
 * Send email via Resend HTTP API (works on Render free tier)
 * Domain verified: yashcollection.app
 */
const sendViaResend = async (options, emailUser) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  console.log('[sendEmail] Using Resend HTTP API (verified domain)...');
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Yash Collections B2B <noreply@yashcollection.app>',
      to: [options.email],
      subject: options.subject,
      html: options.html,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Resend API error: ${data.message || JSON.stringify(data)}`);
  }

  console.log('[sendEmail] ✅ Email sent via Resend!');
  console.log('[sendEmail] Resend ID:', data.id);
  logger.info('Email sent via Resend', { to: options.email, resendId: data.id });
  return true;
};

/**
 * Send email via SMTP (Gmail) - fallback for local development
 */
const sendViaSMTP = async (options, emailUser, emailPass) => {
  console.log('[sendEmail] Using SMTP (Gmail)...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    family: 4,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  console.log('[sendEmail] Testing SMTP connection...');
  await transporter.verify();
  console.log('[sendEmail] SMTP connection verified! ✅');

  const mailOptions = {
    from: `"Yash Collections B2B" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  console.log('[sendEmail] Sending mail...');
  const info = await transporter.sendMail(mailOptions);
  console.log('[sendEmail] ✅ Email sent via SMTP!');
  console.log('[sendEmail] MessageId:', info.messageId);
  logger.info('Email sent via SMTP', { to: options.email, messageId: info.messageId });
  return true;
};

/**
 * Main send email function
 * Uses Resend HTTP API in production (Render blocks SMTP ports on free tier)
 * Falls back to SMTP for local development
 */
const sendEmail = async (options) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const resendApiKey = process.env.RESEND_API_KEY;

    console.log('[sendEmail] Starting email send...');
    console.log('[sendEmail] To:', options.email);
    console.log('[sendEmail] Subject:', options.subject);
    console.log('[sendEmail] Resend API Key set:', !!resendApiKey && resendApiKey !== 're_your_api_key_here');
    console.log('[sendEmail] SMTP credentials set:', !!emailUser && !!emailPass);

    // Priority 1: Resend (production - works on Render, domain verified)
    if (resendApiKey && resendApiKey !== 're_your_api_key_here') {
      return await sendViaResend(options, emailUser);
    }

    // Priority 2: SMTP (local development only)
    if (emailUser && emailPass) {
      return await sendViaSMTP(options, emailUser, emailPass);
    }

    throw new Error('No email service configured. Set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS.');
  } catch (error) {
    console.error('[sendEmail] ❌ ERROR:', error.message);
    console.error('[sendEmail] Full error:', error);
    logger.error('Email send failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

export default sendEmail;
