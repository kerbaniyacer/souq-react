import EmailPreviewWrapper from './EmailPreviewWrapper';

const RESET_URL = 'https://chan-greasier-olympia.ngrok-free.dev/reset-password?token=abc123';

export default function PasswordResetEmail() {
  return (
    <EmailPreviewWrapper title="إعادة تعيين كلمة المرور - سوق">
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
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 50, lineHeight: 1 }}>🔑</div>
                    <h2 style={{ margin: '15px 0 5px', color: '#2D2D2D', fontSize: 20 }}>إعادة تعيين كلمة المرور</h2>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 40px 40px' }}>
                    <p style={{ margin: '0 0 10px', color: '#2D2D2D', fontSize: 16 }}>مرحباً <strong>محمد</strong>،</p>
                    <p style={{ margin: '0 0 30px', color: '#7A7169', fontSize: 15, lineHeight: 1.7 }}>
                      تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. انقر على الزر أدناه لإنشاء كلمة مرور جديدة.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 30 }}>
                      <tbody><tr><td align="center">
                        <a href={RESET_URL} style={{ display: 'inline-block', background: '#5C8A6E', color: '#fff', textDecoration: 'none', padding: '16px 45px', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
                          إعادة تعيين كلمة المرور
                        </a>
                      </td></tr></tbody>
                    </table>
                    <p style={{ margin: '0 0 5px', color: '#7A7169', fontSize: 12 }}>أو انسخ هذا الرابط في متصفحك:</p>
                    <p style={{ margin: '0 0 25px', wordBreak: 'break-all' }}>
                      <a href={RESET_URL} style={{ color: '#5C8A6E', fontSize: 12 }}>{RESET_URL}</a>
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr>
                        <td style={{ background: '#FFF0F0', borderRight: '4px solid #E05555', borderRadius: 8, padding: '15px 20px' }}>
                          <p style={{ margin: 0, color: '#8B0000', fontSize: 13, lineHeight: 1.7 }}>
                            ⏱ هذا الرابط صالح لمدة <strong>ساعة واحدة</strong> فقط.<br />
                            ❌ إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد — حسابك بأمان.
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
