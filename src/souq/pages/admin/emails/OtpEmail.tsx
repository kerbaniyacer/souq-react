import EmailPreviewWrapper from './EmailPreviewWrapper';

export default function OtpEmail() {
  return (
    <EmailPreviewWrapper title="رمز التحقق - سوق">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ background: '#5C8A6E', padding: '30px 40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 32, letterSpacing: 2 }}>سوق</h1>
                    <p style={{ margin: '8px 0 0', color: '#C8E0D4', fontSize: 14 }}>منصة التسوق الإلكتروني</p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 40 }}>
                    <p style={{ margin: '0 0 10px', color: '#2D2D2D', fontSize: 16 }}>مرحباً <strong>محمد</strong>،</p>
                    <p style={{ margin: '0 0 30px', color: '#7A7169', fontSize: 15, lineHeight: 1.7 }}>
                      تلقينا طلب تسجيل دخول إلى حسابك في سوق. استخدم رمز التحقق أدناه لإتمام عملية تسجيل الدخول.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr>
                        <td align="center" style={{ background: '#EAF2EE', borderRadius: 12, padding: 30, border: '2px dashed #5C8A6E' }}>
                          <p style={{ margin: '0 0 8px', color: '#7A7169', fontSize: 13 }}>رمز التحقق الخاص بك</p>
                          <p style={{ margin: 0, fontSize: 42, fontWeight: 'bold', color: '#5C8A6E', letterSpacing: 12, fontFamily: 'Courier New, monospace' }}>
                            847291
                          </p>
                        </td>
                      </tr></tbody>
                    </table>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: 25 }}>
                      <tbody><tr>
                        <td style={{ background: '#FFF8E7', borderRight: '4px solid #F0A500', borderRadius: 8, padding: '15px 20px' }}>
                          <p style={{ margin: 0, color: '#7A5C00', fontSize: 13, lineHeight: 1.7 }}>
                            ⏱ هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.<br />
                            🔒 لا تشارك هذا الرمز مع أي شخص آخر.<br />
                            ❌ إذا لم تطلب هذا الرمز، تجاهل هذا البريد.
                          </p>
                        </td>
                      </tr></tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ background: '#F8F6F2', padding: '20px 40px', borderTop: '1px solid #E8E2D9' }}>
                    <p style={{ margin: 0, color: '#B5AFA8', fontSize: 12 }}>© 2024 سوق — جميع الحقوق محفوظة</p>
                    <p style={{ margin: '6px 0 0', color: '#B5AFA8', fontSize: 11 }}>هذا بريد تلقائي، يرجى عدم الرد عليه.</p>
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
