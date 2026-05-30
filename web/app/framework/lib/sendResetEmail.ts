// src/lib/sendEmail.ts
import { Resend } from 'resend';
import Mailgen from 'mailgen';
import path from 'path';

const SENDER_EMAIL = "kopotitore@souvlaki.info";

const mailGenerator = new Mailgen({
  theme: {
    path: path.resolve('public/assets/default.html'),
    plaintextPath: path.resolve('public/assets/theme.txt'),
  },
  product: { name: 'Sizo Develops', link: `${process.env.DOMAIN}` },
});

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send a password reset email
 * @param email recipient email
 * @param name recipient name
 * @param resetToken token to reset password
 */
export async function sendPasswordResetEmail({
  email,
  name,
  resetToken,
}: {
  email: string;
  name?: string;
  resetToken: string;
}) {
  try {
    const resetUrl = `${process.env.DOMAIN}/auth/reset-password/${resetToken}`;

    const emailContent = {
      body: {
        name: name || email.split('@')[0],
        intro: 'You requested a password reset.',
        action: {
          instructions: 'Click the button below to reset your password:',
          button: {
            color: '#22BC66',
            text: 'Reset Password',
            link: resetUrl,
          },
        },
        outro: 'If you did not request this, please ignore this email.',
      },
    };

    const htmlBody = mailGenerator.generate(emailContent);

    const message = {
      from: `ScanA Team <${SENDER_EMAIL}>`, // verified domain/email
      to: email,
      subject: 'Password Reset Request',
      html: htmlBody,
    };

    const result = await resend.emails.send(message);
    return result;
  } catch (err: unknown) {
    console.error('sendPasswordResetEmail failed:', err);
    throw err;
  }
}
