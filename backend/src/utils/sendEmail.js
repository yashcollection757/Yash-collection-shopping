import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  console.log('[sendEmail] Sending to:', options.email);
  console.log('[sendEmail] EMAIL_USER:', process.env.EMAIL_USER);
  console.log('[sendEmail] EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Verify connection before sending
  await transporter.verify();
  console.log('[sendEmail] ✅ Gmail SMTP connection verified');

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
