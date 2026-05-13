import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  console.log('[sendEmail] Using EMAIL_USER:', emailUser);
  console.log('[sendEmail] EMAIL_PASS set:', !!emailPass);

  if (!emailUser || !emailPass) {
    throw new Error('EMAIL_USER or EMAIL_PASS not configured in environment');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,       // STARTTLS (port 587) — works on Render free tier
    requireTLS: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: `"Yash Collections" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('[sendEmail] Message sent:', info.messageId, '→', options.email);
  return true;
};

export default sendEmail;
