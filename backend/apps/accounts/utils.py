def get_base_email_html(title, body_content):
    return f"""<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
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
        <tr><td style="padding:40px;">{body_content}</td></tr>
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
</html>"""

def get_otp_email_html(otp):
    body = f"""
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;">رمز التحقق الخاص بك</h2>
        <div style="display:inline-block;background:#f0f7f3;border:2px solid #5C8A6E;border-radius:12px;padding:20px 40px;">
          <span style="font-size:40px;font-weight:900;color:#5C8A6E;font-family:monospace;letter-spacing:8px;">{otp}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin-top:16px;">الرمز صالح لمدة 10 دقائق فقط.</p>
      </div>
    """
    return get_base_email_html('رمز التحقق', body)

def get_welcome_email_html(username):
    body = f"""
      <h2 style="color:#5C8A6E;font-size:22px;margin:0 0 16px;">أهلاً وسهلاً {username}! 🎉</h2>
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
    """
    return get_base_email_html('مرحباً بك في سوق', body)

def get_password_reset_email_html(reset_url):
    body = f"""
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#fef3c7;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🔐</div>
      </div>
      <h2 style="color:#1f2937;font-size:22px;margin:0 0 16px;text-align:center;">نسيت كلمة المرور؟</h2>
      <p style="color:#4b5563;line-height:1.8;text-align:center;">استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
      <div style="text-align:center;margin:28px 0;">
        <a href="{reset_url}" style="display:inline-block;background:#5C8A6E;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">إعادة تعيين كلمة المرور ←</a>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;">الرابط صالح لفترة محدودة فقط.<br>إذا لم تطلب ذلك، تجاهل هذا البريد.</p>
    """
    return get_base_email_html('إعادة تعيين كلمة المرور', body)

def get_order_email_html(is_merchant, order_number, total, items):
    title = 'طلب جديد' if is_merchant else 'تأكيد طلبك'
    header = 'لديك طلب جديد! 🛒' if is_merchant else 'شكراً لطلبك من سوق! 🎉'
    subheader = (
        f'لديك طلب جديد <strong>{order_number}</strong> بإجمالي <strong>{total:,.2f} دج</strong>.'
        if is_merchant else
        f'تم استلام طلبك رقم <strong>{order_number}</strong> بنجاح. سنقوم بتجهيزه لك في أقرب وقت.'
    )
    
    table_rows = ""
    for item in items:
        # Handling different object/dict shapes
        p_name = item.get('product_name') or item.get('name') or '-'
        qty = item.get('quantity') or 1
        subt = item.get('subtotal') or 0
        table_rows += f"""
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:10px;color:#1f2937;">{p_name}</td>
            <td style="padding:10px;text-align:center;color:#6b7280;">×{qty}</td>
            <td style="padding:10px;text-align:left;color:#5C8A6E;font-weight:700;">{subt:,.2f} دج</td>
          </tr>
        """

    body = f"""
      <h2 style="color:#5C8A6E;font-size:22px;margin:0 0 16px;">{header}</h2>
      <p style="color:#4b5563;margin:0 0 20px;">{subheader}</p>
      <table width="100%" style="border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f0f7f3;">
            <th style="padding:10px;text-align:right;color:#5C8A6E;font-size:13px;">المنتج</th>
            <th style="padding:10px;text-align:center;color:#5C8A6E;font-size:13px;">الكمية</th>
            <th style="padding:10px;text-align:left;color:#5C8A6E;font-size:13px;">المبلغ</th>
          </tr>
        </thead>
        <tbody>
          {table_rows}
        </tbody>
      </table>
      <a href="http://localhost:5173/orders" style="display:inline-block;background:#5C8A6E;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:12px;">
        {'عرض الطلبات في لوحة التحكم ←' if is_merchant else 'تتبع طلبك ←'}
      </a>
    """
    return get_base_email_html(title, body)

def get_security_alert_email_html(ip):
    body = f"""
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:#fee2e2;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">🔔</div>
      </div>
      <h2 style="color:#dc2626;font-size:22px;margin:0 0 16px;text-align:center;">تنبيه أمني: دخول من جهاز جديد</h2>
      <p style="color:#4b5563;line-height:1.8;text-align:center;">تم اكتشاف تسجيل دخول لحسابك من عنوان IP جديد.</p>
      <div style="background:#f8f6f2;border-radius:10px;padding:20px;margin:20px 0;">
        <table width="100%">
          <tr><td style="color:#6b7280;padding:4px 0;">عنوان IP:</td><td style="font-weight:700;color:#1f2937;font-family:monospace;">{ip}</td></tr>
        </table>
      </div>
      <p style="color:#9ca3af;font-size:13px;text-align:center;">إذا كنت أنت، يمكنك تجاهل هذا التنبيه. إذا لم تكن أنت، يرجى تغيير كلمة المرور فوراً.</p>
    """
    return get_base_email_html('تنبيه أمني', body)


