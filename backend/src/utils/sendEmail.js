import { Resend } from 'resend';

const sendEmail = async (options) => {
  console.log('[sendEmail] Sending via Resend to:', options.email);
  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: 'Yash Collections <noreply@yashcollection.app>',
    to: [options.email],
    subject: options.subject,
    html: options.html,
  });

  if (error) {
    console.error('[sendEmail] ❌ Resend error:', JSON.stringify(error));
    throw new Error(error.message || 'Failed to send email');
  }

  console.log('[sendEmail] ✅ Email sent via Resend! ID:', data?.id, '→', options.email);
  return true;
};

export default sendEmail;
