import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a premium verification email to the user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient username
 * @param {string} verificationToken - Verification token
 */
export const sendVerificationEmail = async (email, name, verificationToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationLink = `${clientUrl}/verify-email?token=${verificationToken}`;

  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your SyncTube Account</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #09090b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: rgba(18, 18, 22, 0.95);
          border: 1px solid #1f1f23;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .header {
          background-color: #ef4444;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 20px;
        }
        .text {
          font-size: 14px;
          color: #a1a1aa;
          margin-bottom: 30px;
        }
        .btn-container {
          text-align: center;
          margin: 35px 0;
        }
        .btn {
          display: inline-block;
          background-color: #ef4444;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 30px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #dc2626;
        }
        .warning {
          font-size: 11px;
          color: #71717a;
          border-top: 1px solid #1f1f23;
          padding-top: 20px;
          margin-top: 40px;
        }
        .footer {
          background-color: #121214;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #52525b;
          border-top: 1px solid #1f1f23;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SyncTube</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${name}!</div>
          <div class="text">
            Thank you for creating an account on SyncTube. To start hosting watch parties and streaming synchronized video content live with your friends, please verify your email address by clicking the button below.
          </div>
          <div class="btn-container">
            <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
          </div>
          <div class="text">
            If the button doesn't work, copy and paste the following link directly into your browser:
            <br>
            <a href="${verificationLink}" style="color: #ef4444; word-break: break-all;">${verificationLink}</a>
          </div>
          <div class="warning">
            Note: This link is secure and will expire in 24 hours. If you did not register for a SyncTube account, please ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 SyncTube WatchParty Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: `SyncTube <${senderEmail}>`,
      to: email,
      subject: 'Verify your SyncTube Account',
      html: htmlContent,
    });
    console.log(`Verification email sent successfully to ${email}. ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending verification email via Resend:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a premium OTP verification email to the user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient username
 * @param {string} otp - 6-digit verification code
 */
export const sendOtpEmail = async (email, name, otp) => {
  if (process.env.NODE_ENV === 'test' || (email && email.endsWith('@example.com'))) {
    console.log(`[TEST MODE] Bypassing Resend email. OTP Code for ${email} is: ${otp}`);
    return { success: true, id: 'test-email-id' };
  }

  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SyncTube Verification Code</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #09090b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: rgba(18, 18, 22, 0.95);
          border: 1px solid #1f1f23;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .header {
          background-color: #ef4444;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 20px;
        }
        .text {
          font-size: 14px;
          color: #a1a1aa;
          margin-bottom: 30px;
        }
        .otp-container {
          text-align: center;
          margin: 35px 0;
        }
        .otp-code {
          display: inline-block;
          background-color: #121214;
          border: 1px solid #27272a;
          color: #ef4444;
          padding: 16px 32px;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 6px;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          font-family: 'Courier New', Courier, monospace;
        }
        .warning {
          font-size: 11px;
          color: #71717a;
          border-top: 1px solid #1f1f23;
          padding-top: 20px;
          margin-top: 40px;
        }
        .footer {
          background-color: #121214;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #52525b;
          border-top: 1px solid #1f1f23;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SyncTube</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, ${name || 'there'}!</div>
          <div class="text">
            Thank you for registering on SyncTube. To verify your email address and complete your signup, please use the following 6-digit one-time password (OTP):
          </div>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <div class="text" style="text-align: center;">
            This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
          </div>
          <div class="warning">
            Note: If you did not initiate this request, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 SyncTube WatchParty Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: `SyncTube <${senderEmail}>`,
      to: email,
      subject: 'Your SyncTube Verification Code',
      html: htmlContent,
    });
    console.log(`OTP verification email sent successfully to ${email}. ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending OTP verification email via Resend:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Sends a premium password reset email to the user
 * @param {string} email - Recipient email
 * @param {string} name - Recipient username
 * @param {string} resetToken - Secure reset token
 */
export const sendPasswordResetEmail = async (email, name, resetToken) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetLink = `${clientUrl}/reset-password/${resetToken}`;

  if (process.env.NODE_ENV === 'test' || (email && email.endsWith('@example.com'))) {
    console.log(`[TEST MODE] Bypassing Resend email. Password reset link for ${email} is: ${resetLink}`);
    return { success: true, id: 'test-reset-email-id', link: resetLink };
  }

  const senderEmail = process.env.RESEND_SENDER_EMAIL || 'onboarding@resend.dev';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your SyncTube Password</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #09090b;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f4f4f5;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: rgba(18, 18, 22, 0.95);
          border: 1px solid #1f1f23;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .header {
          background-color: #ef4444;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          color: #ffffff;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .content {
          padding: 40px 30px;
          line-height: 1.6;
        }
        .greeting {
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 20px;
        }
        .text {
          font-size: 14px;
          color: #a1a1aa;
          margin-bottom: 30px;
        }
        .btn-container {
          text-align: center;
          margin: 35px 0;
        }
        .btn {
          display: inline-block;
          background-color: #ef4444;
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 30px;
          font-size: 14px;
          font-weight: 700;
          border-radius: 8px;
          box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.3);
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #dc2626;
        }
        .warning {
          font-size: 11px;
          color: #71717a;
          border-top: 1px solid #1f1f23;
          padding-top: 20px;
          margin-top: 40px;
        }
        .footer {
          background-color: #121214;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #52525b;
          border-top: 1px solid #1f1f23;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SyncTube</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello, \${name}!</div>
          <div class="text">
            We received a request to reset your password for your SyncTube account. If you did not make this request, you can ignore this email. Otherwise, you can reset your password by clicking the button below.
          </div>
          <div class="btn-container">
            <a href="\${resetLink}" class="btn" target="_blank">Reset Password</a>
          </div>
          <div class="text">
            If the button doesn't work, copy and paste the following link directly into your browser:
            <br>
            <a href="\${resetLink}" style="color: #ef4444; word-break: break-all;">\${resetLink}</a>
          </div>
          <div class="warning">
            Note: This reset link is secure and will expire in 1 hour.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 SyncTube WatchParty Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: `SyncTube <\${senderEmail}>`,
      to: email,
      subject: 'Reset your SyncTube Password',
      html: htmlContent,
    });
    console.log(`Password reset email sent successfully to \${email}. ID: \${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error sending password reset email via Resend:', error.message);
    return { success: false, error: error.message };
  }
};
