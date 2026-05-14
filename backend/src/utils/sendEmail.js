import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const sendEmail = async (options) => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    // Debug logs
    console.log('[sendEmail] Starting email send...');
    console.log('[sendEmail] To:', options.email);
    console.log('[sendEmail] Subject:', options.subject);
    console.log('[sendEmail] From:', emailUser);
    console.log('[sendEmail] Email User exists:', !!emailUser);
    console.log('[sendEmail] Email Pass exists:', !!emailPass);
    console.log('[sendEmail] Email Pass length:', emailPass?.length);

    if (!emailUser || !emailPass) {
      throw new Error('Email credentials not configured in .env (EMAIL_USER or EMAIL_PASS missing)');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    // Test connection
    console.log('[sendEmail] Testing SMTP connection...');
    await transporter.verify();
    console.log('[sendEmail] SMTP connection verified! ✅');

    const mailOptions = {
      from: `"Yash Collections B2B" <${emailUser}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    };

    console.log('[sendEmail] Sending mail with options:', { to: mailOptions.to, subject: mailOptions.subject });
    const info = await transporter.sendMail(mailOptions);
    console.log('[sendEmail] ✅ Email sent successfully!');
    console.log('[sendEmail] MessageId:', info.messageId);
    logger.info('Email sent successfully', { to: options.email, messageId: info.messageId });
    return true;
  } catch (error) {
    console.error('[sendEmail] ❌ ERROR:', error.message);
    console.error('[sendEmail] Full error:', error);
    logger.error('Email send failed', { error: error.message, stack: error.stack });
    throw error;
  }
};

export default sendEmail;
