import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Try Resend first (faster)
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: 'Yash Collections B2B <onboarding@resend.dev>',
        to: options.email,
        subject: options.subject,
        html: options.html,
      });

      if (!error) {
        console.log('Email sent via Resend:', data?.id, '→', options.email);
        return true;
      }
      console.warn('Resend failed, falling back to Gmail:', error.message);
    } catch (err) {
      console.warn('Resend error, falling back to Gmail:', err.message);
    }
  }

  // Fallback: Gmail SMTP
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Yash Collections B2B" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  console.log('Email sent via Gmail:', info.messageId, '→', options.email);
  return true;
};

export default sendEmail;
