import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  console.log('[sendEmail] Sending to:', options.email);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,        // ← 465 ki jagah 587 (Render pe kaam karta hai)
    secure: false,    // ← STARTTLS (SSL nahi)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: `"Yash Collections B2B" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  });

  console.log('[sendEmail] ✅ Email sent! MessageId:', info.messageId, '→', options.email);
  return true;
};

export default sendEmail;
