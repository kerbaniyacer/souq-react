/**
 * خدمة البريد الإلكتروني
 * - ترسل عبر email-server.cjs (Express + Nodemailer + Gmail)
 * - تسجّل أيضاً في JSON Server /sent_emails للمراجعة
 */

const EMAIL_API = '/email-api/send-email?XTransformPort=3002';  // Vite proxy → localhost:3002
const DB        = '/db';

async function sendEmail(type: string, to: string, data: Record<string, unknown> = {}) {
  // 1. إرسال فعلي عبر Gmail
  try {
    const res = await fetch(EMAIL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn(`[emailService] فشل إرسال البريد (${type}):`, err);
    }
  } catch (e) {
    console.warn('[emailService] سيرفر البريد غير متاح، تأكد من تشغيله:', e);
  }

  // 2. تسجيل في JSON Server للسجلات
  try {
    await fetch(`${DB}/sent_emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, to, data, sent_at: new Date().toISOString() }),
    });
  } catch { /* تجاهل */ }
}

export async function sendWelcomeEmail(to: string, username: string) {
  await sendEmail('welcome', to, { username });
}

export async function sendOtpEmail(to: string, otp: string) {
  await sendEmail('otp', to, { otp });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail('password-reset', to, { resetUrl });
}

export async function sendPasswordChangedEmail(to: string, username: string) {
  await sendEmail('password-changed', to, { username });
}

export async function sendPasswordResetSuccessEmail(to: string, username: string) {
  await sendEmail('password-reset-success', to, { username });
}

export async function sendMerchantOrderEmail(
  to: string, orderNumber: string, items: unknown[], total: number
) {
  await sendEmail('merchant-order', to, { orderNumber, items, total });
}

export async function sendSecurityAlertEmail(to: string, ip: string, location?: string) {
  await sendEmail('security-alert', to, { ip, location });
}

export async function sendNewsletterConfirmationEmail(to: string) {
  await sendEmail('newsletter', to, {});
}

export async function sendSupportEmail(
  to: string, name: string, issueType: string, description: string
) {
  await sendEmail('support', to, { name, issueType, description });
}
