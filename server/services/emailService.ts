import nodemailer from 'nodemailer';

// Store in-memory OTPs: email -> { otp: string, expiresAt: number }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Configure transporter if user supplies SMTP credentials in .env
// Supports Gmail App Passwords, Outlook, or standard SMTP
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
};

let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport(smtpConfig);
}

export function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(recipientEmail: string): Promise<{ success: boolean; otp?: string; message: string }> {
  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity

  otpStore.set(recipientEmail.toLowerCase(), { otp, expiresAt });

  console.log(`\n======================================================`);
  console.log(`📩 [EMAIL VERIFICATION DISPATCH]`);
  console.log(`To: ${recipientEmail}`);
  console.log(`Your 6-Digit One-Time Password (OTP) is: [ ${otp} ]`);
  console.log(`Expires in: 10 minutes`);
  console.log(`======================================================\n`);

  // If real SMTP credentials configured in .env, send real inbox email
  if (transporter && process.env.SMTP_USER) {
    try {
      await transporter.sendMail({
        from: `"CampusResolve AI" <${process.env.SMTP_USER}>`,
        to: recipientEmail,
        subject: 'CampusResolve AI - Verification One-Time Password (OTP)',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #4338ca; margin: 0;">CampusResolve AI</h2>
              <p style="color: #64748b; font-size: 13px;">Campus Grievance & Resolution Platform</p>
            </div>
            <p style="color: #334155; font-size: 14px;">Hello,</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
              Here is your verification code to access your campus account or verify your reported grievance:
            </p>
            <div style="background: #f1f5f9; padding: 18px; border-radius: 10px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      return { success: true, otp, message: `Verification code sent to ${recipientEmail}` };
    } catch (err: any) {
      console.warn('Could not send live SMTP email, provided OTP in console & response:', err.message);
      return { success: true, otp, message: `Code sent (Simulated). Your code is: ${otp}` };
    }
  }

  // Zero-config fallback (automatically provides the OTP in response and prints to server log)
  return { 
    success: true, 
    otp, 
    message: `Verification code sent to ${recipientEmail}. (Demo Mode: Code is ${otp})` 
  };
}

export function verifyOTP(recipientEmail: string, inputOtp: string): { valid: boolean; error?: string } {
  const record = otpStore.get(recipientEmail.toLowerCase());
  if (!record) {
    return { valid: false, error: 'No OTP requested for this email or it has expired.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(recipientEmail.toLowerCase());
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  if (record.otp !== inputOtp.trim()) {
    return { valid: false, error: 'Incorrect OTP. Please enter the valid 6-digit code.' };
  }

  // OTP is verified, delete it to prevent reuse
  otpStore.delete(recipientEmail.toLowerCase());
  return { valid: true };
}
