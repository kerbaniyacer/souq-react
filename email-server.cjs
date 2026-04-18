/**
 * سيرفر البريد الإلكتروني - يعمل على المنفذ 3002
 * يستخدم Nodemailer + Gmail SMTP
 * شغّله بـ: node email-server.cjs
 */

require('dotenv').config();
const http       = require('http');
const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');

const app  = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// ─── إعداد Nodemailer مع Gmail ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

// التحقق من الاتصال عند بدء التشغيل
transporter.verify((error) => {
  if (error) {
    console.error('❌ فشل الاتصال بـ Gmail SMTP:', error.message);
  } else {
    console.log('✅ Gmail SMTP متصل بنجاح -', process.env.EMAIL_HOST_USER);
  }
});

// ─── قوالب HTML البريد الإلكتروني ─────────────────────────────────────────

function baseTemplate(title, bodyContent) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F6F2;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8F6F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#5C8A6E,#4a7359);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;">🛍 سوق</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">متجرك الإلكتروني الموثوق</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">${bodyContent}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f6f2;padding:24px 40px;text-align:center;border-top:1px solid #e8e3db;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2026 سوق - جميع الحقوق محفوظة</p>
            <p style="margin:4px 0 0;color:#9ca3af;font-size:12px;">contact@souq.dz | الجزائر العاصمة، الجزائر</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const templates = {
  welcome: ({ username }) => ({
    subject: 'مرحباً بك في سوق! 🎉',
    html: baseTemplate('مرحباً بك في سوق', `
      <h2 style="color:#5C8A6E;font-size:22px;margin:0 0 16px;">أهلاً وسهلاً ${username}! 🎉</h2>
      <p style="color:#4b5563;line-height:1.8;margin:0 0 20px;">يسعدنا انضمامك إلى عائلة <strong>سوق</strong>. حسابك جاهز الآن للتسوق!</p>
      <div style="background:#f0f7f3;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#5C8A6E;font-weight:700;">ما يمكنك فعله الآن:</p>
        <ul style="margin:0;padding-right:20px;color:#4b5563;line-height:2;">
          <li>تصفح آلاف المنتجات</li>
          <li>أضف منتجاتك المفضلة للسلة</li>
          <li>تتبع طلباتك بسهولة</li>
        </ul>
      </div>
      <a href="http://localhost:5173/products" style="display:inline-block;background:#5C8A6E;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-top:8px;">ابدأ التسوق الآن ←</a>
    `),
  }),

  'password-reset': ({ resetUrl }) => ({
    subject: 'إعادة تعيين كلمة المرور - سوق 🔐',
    html: baseTemplate('إعادة تعيين كلمة المرور', `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🔐</div>
      </div>
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;text-align:center;">نسيت كلمة المرور؟</h2>
      <p style="color:#4b5563;line-height:1.8;text-align:center;">استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="display:inline-block;background:#5C8A6E;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">إعادة تعيين كلمة المرور ←</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;">الرابط صالح لمدة ساعة واحدة فقط.<br>إذا لم تطلب ذلك، تجاهل هذا البريد.</p>
    `),
  }),

  'password-changed': ({ username }) => ({
    subject: 'تم تغيير كلمة المرور بنجاح - سوق ✅',
    html: baseTemplate('تم تغيير كلمة المرور', `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✅</div>
      </div>
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;text-align:center;">تم تغيير كلمة المرور</h2>
      <p style="color:#4b5563;line-height:1.8;text-align:center;">مرحباً <strong>${username}</strong>، تم تغيير كلمة مرور حسابك بنجاح.</p>
      <div style="background:#fef3c7;border-radius:10px;padding:16px;margin:20px 0;text-align:center;">
        <p style="margin:0;color:#92400e;font-size:14px;">⚠️ إذا لم تكن أنت من قام بهذا التغيير، تواصل معنا فوراً.</p>
      </div>
    `),
  }),

  'security-alert': ({ ip }) => ({
    subject: 'تنبيه أمني: تسجيل دخول من جهاز جديد - سوق 🔔',
    html: baseTemplate('تنبيه أمني', `
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🔔</div>
      </div>
      <h2 style="color:#dc2626;font-size:22px;margin:0 0 16px;text-align:center;">تسجيل دخول من عنوان IP جديد</h2>
      <p style="color:#4b5563;line-height:1.8;text-align:center;">تم تسجيل الدخول لحسابك من عنوان IP جديد.</p>
      <div style="background:#f8f6f2;border-radius:10px;padding:16px;margin:20px 0;">
        <table width="100%">
          <tr><td style="color:#6b7280;padding:4px 0;">عنوان IP:</td><td style="font-weight:700;color:#1f2937;font-family:monospace;">${ip}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">التاريخ:</td><td style="font-weight:700;color:#1f2937;">${new Date().toLocaleString('ar-DZ')}</td></tr>
        </table>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;">إذا كنت أنت، تجاهل هذا البريد. إذا لم تكن أنت، غيّر كلمة مرورك فوراً.</p>
    `),
  }),

  'merchant-order': ({ orderNumber, total, items }) => ({
    subject: `طلب جديد ${orderNumber} - سوق 🛒`,
    html: baseTemplate('طلب جديد', `
      <h2 style="color:#5C8A6E;font-size:22px;margin:0 0 16px;">طلب جديد! 🛒</h2>
      <p style="color:#4b5563;margin:0 0 20px;">لديك طلب جديد <strong>${orderNumber}</strong> بإجمالي <strong>${Number(total).toLocaleString('ar-DZ')} دج</strong>.</p>
      <table width="100%" style="border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f0f7f3;">
            <th style="padding:10px;text-align:right;color:#5C8A6E;font-size:13px;">المنتج</th>
            <th style="padding:10px;text-align:center;color:#5C8A6E;font-size:13px;">الكمية</th>
            <th style="padding:10px;text-align:left;color:#5C8A6E;font-size:13px;">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${(items || []).map(i => `<tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px;color:#1f2937;">${i.product_name || i.name || '-'}</td>
            <td style="padding:10px;text-align:center;color:#6b7280;">×${i.quantity}</td>
            <td style="padding:10px;text-align:left;color:#5C8A6E;font-weight:700;">${Number(i.subtotal || 0).toLocaleString('ar-DZ')} دج</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <a href="http://localhost:5173/merchant/orders" style="display:inline-block;background:#5C8A6E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:12px;">عرض الطلب في لوحة التحكم ←</a>
    `),
  }),

  newsletter: () => ({
    subject: 'أهلاً بك في نشرة سوق البريدية 📧',
    html: baseTemplate('النشرة البريدية', `
      <h2 style="color:#5C8A6E;font-size:22px;margin:0 0 16px;">اشتراكك ناجح! 📧</h2>
      <p style="color:#4b5563;line-height:1.8;">شكراً لاشتراكك في نشرة <strong>سوق</strong> البريدية. ستصلك أحدث العروض والمنتجات مباشرة في بريدك.</p>
      <div style="background:#f0f7f3;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0;color:#5C8A6E;font-weight:700;">ما ستحصل عليه:</p>
        <ul style="margin:8px 0 0;padding-right:20px;color:#4b5563;line-height:2;">
          <li>عروض حصرية للمشتركين</li>
          <li>إشعارات المنتجات الجديدة</li>
          <li>نصائح التسوق الذكي</li>
        </ul>
      </div>
    `),
  }),

  otp: ({ otp }) => ({
    subject: `رمز التحقق: ${otp} - سوق`,
    html: baseTemplate('رمز التحقق', `
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;">رمز التحقق الخاص بك</h2>
        <div style="display:inline-block;background:#f0f7f3;border:2px solid #5C8A6E;border-radius:12px;padding:20px 40px;">
          <span style="font-size:40px;font-weight:900;color:#5C8A6E;font-family:monospace;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px;">الرمز صالح لمدة 10 دقائق فقط.</p>
      </div>
    `),
  }),
};

// ─── Endpoint الرئيسي ──────────────────────────────────────────────────────
app.post('/send-email', async (req, res) => {
  const { type, to, data = {} } = req.body;

  if (!type || !to) {
    return res.status(400).json({ error: 'type و to مطلوبان' });
  }

  const builder = templates[type];
  if (!builder) {
    return res.status(400).json({ error: `نوع القالب "${type}" غير معروف` });
  }

  try {
    const { subject, html } = builder(data);
    const fromName = process.env.EMAIL_FROM_NAME || 'سوق';
    const fromEmail = process.env.EMAIL_HOST_USER;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 [${type}] → ${to} ✅`);
    res.json({ success: true });
  } catch (err) {
    console.error(`📧 [${type}] → ${to} ❌`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', user: process.env.EMAIL_HOST_USER }));

// استخدام http.createServer مباشرة لضمان بقاء السيرفر يعمل (Express 5 compat)
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`📧 Email Server يعمل على http://localhost:${PORT}`);
  console.log(`   المستخدم: ${process.env.EMAIL_HOST_USER}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    // تحقق إذا كان سيرفر البريد يعمل بالفعل
    const http2 = require('http');
    const req = http2.get(`http://localhost:${PORT}/health`, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.status === 'ok') {
            console.log(`✅ سيرفر البريد يعمل بالفعل على http://localhost:${PORT}`);
            console.log(`   المستخدم: ${data.user}`);
            process.exit(0);
          }
        } catch { killAndRestart(); }
      });
    });
    req.on('error', () => killAndRestart());
    req.end();
  } else {
    console.error('❌ خطأ في السيرفر:', err.message);
    process.exit(1);
  }
});

function killAndRestart() {
  const { execSync } = require('child_process');
  console.log(`⚠️  المنفذ ${PORT} مشغول — جاري التحرير...`);
  try {
    // Windows
    execSync(
      `FOR /F "tokens=5" %a IN ('netstat -aon ^| findstr ":${PORT} "') DO taskkill /F /PID %a`,
      { shell: 'cmd.exe', stdio: 'ignore' }
    );
  } catch { /* تجاهل */ }
  setTimeout(() => {
    server.listen(PORT, () => {
      console.log(`📧 Email Server يعمل على http://localhost:${PORT}`);
      console.log(`   المستخدم: ${process.env.EMAIL_HOST_USER}`);
    });
  }, 1000);
}

// إبقاء العملية حيّة
process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason));
