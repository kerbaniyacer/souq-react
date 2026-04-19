import EmailPreviewWrapper from './EmailPreviewWrapper';

const SITE = 'https://chan-greasier-olympia.ngrok-free.dev';

export default function SecurityAlertEmail() {
  return (
    <EmailPreviewWrapper title="تنبيه أمني - سوق">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ background: '#B57A6A', padding: '30px 40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 32, letterSpacing: 2 }}>سوق</h1>
                    <p style={{ margin: '8px 0 0', color: '#EBD9D4', fontSize: 14 }}>تنبيه أمني هام</p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 40 }}>
                    <p style={{ margin: '0 0 10px', color: '#2D2D2D', fontSize: 16 }}>مرحباً <strong>محمد</strong>،</p>
                    <p style={{ margin: '0 0 30px', color: '#7A7169', fontSize: 15, lineHeight: 1.7 }}>
                      تم اكتشاف محاولة تسجيل دخول ناجحة إلى حسابك في متجر "سوق" من عنوان IP جديد أو لم يسبق استخدامه من قبل.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr>
                        <td style={{ background: '#FDF2F0', borderRadius: 12, padding: 25, border: '1px solid #F1D4CE' }}>
                          <h3 style={{ margin: '0 0 15px', color: '#B57A6A', fontSize: 16 }}>تفاصيل تسجيل الدخول:</h3>
                          <p style={{ margin: '5px 0', color: '#4A4A4A', fontSize: 14 }}><strong>عنوان الـ IP:</strong> 41.102.45.88</p>
                          <p style={{ margin: '5px 0', color: '#4A4A4A', fontSize: 14 }}><strong>الوقت:</strong> {new Date().toLocaleString('ar-DZ')}</p>
                        </td>
                      </tr></tbody>
                    </table>
                    <p style={{ margin: '25px 0 10px', color: '#2D2D2D', fontSize: 15, lineHeight: 1.7 }}>
                      <strong>هل كنت أنت من قام بهذا الدخول؟</strong>
                    </p>
                    <p style={{ margin: '0 0 20px', color: '#7A7169', fontSize: 14, lineHeight: 1.7 }}>
                      إذا كنت أنت من قام بذلك، فلا داعي لاتخاذ أي إجراء إضافي.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 25, marginBottom: 35 }}>
                      <tbody><tr>
                        <td style={{ background: '#FFF8E7', borderRight: '4px solid #F0A500', borderRadius: 8, padding: '15px 20px' }}>
                          <p style={{ margin: 0, color: '#7A5C00', fontSize: 14, lineHeight: 1.7 }}>
                            🚨 <strong>إذا لم تكن أنت:</strong><br />
                            يرجى تغيير كلمة المرور فوراً والتأكد من عدم وجود نشاط غير مصرح به.
                          </p>
                        </td>
                      </tr></tbody>
                    </table>
                    <div style={{ textAlign: 'center' }}>
                      <a href={`${SITE}/profile`} style={{ background: '#5C8A6E', color: '#fff', padding: '12px 30px', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold', fontSize: 14 }}>
                        تأمين حسابي الآن
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ background: '#F8F6F2', padding: '20px 40px', borderTop: '1px solid #E8E2D9' }}>
                    <p style={{ margin: 0, color: '#B5AFA8', fontSize: 12 }}>© 2024 سوق — جميع الحقوق محفوظة</p>
                    <p style={{ margin: '6px 0 0', color: '#B5AFA8', fontSize: 11 }}>هذا بريد أمني تلقائي، يرجى عدم الرد عليه.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td></tr></tbody>
        </table>
      </div>
    </EmailPreviewWrapper>
  );
}
