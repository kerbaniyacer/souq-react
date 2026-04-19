import EmailPreviewWrapper from './EmailPreviewWrapper';

export default function SupportEmail() {
  return (
    <EmailPreviewWrapper title="طلب مساعدة جديد - سوق">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ background: '#5C8A6E', padding: '30px 40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 32, letterSpacing: 2 }}>سوق</h1>
                    <p style={{ margin: '8px 0 0', color: '#C8E0D4', fontSize: 14 }}>الدعم الفني</p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: 40 }}>
                    <h2 style={{ margin: '0 0 25px', color: '#2D2D2D', fontSize: 20 }}>📩 طلب مساعدة جديد</h2>
                    <div style={{ background: '#F8F6F2', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                      <p style={{ margin: '0 0 12px', color: '#4A4A4A', fontSize: 14 }}><strong>👤 الاسم:</strong> محمد علي</p>
                      <p style={{ margin: '0 0 12px', color: '#4A4A4A', fontSize: 14 }}><strong>📧 البريد:</strong> user@example.com</p>
                      <p style={{ margin: '0 0 12px', color: '#4A4A4A', fontSize: 14 }}><strong>⚠️ نوع المشكلة:</strong> مشكلة في الدفع</p>
                    </div>
                    <p style={{ margin: '0 0 8px', color: '#4A4A4A', fontSize: 14 }}><strong>📝 الوصف:</strong></p>
                    <p style={{ margin: '0 0 20px', background: '#f5f5f5', padding: 15, borderRadius: 8, color: '#555', fontSize: 14, lineHeight: 1.7 }}>
                      لم أتمكن من إتمام عملية الدفع عند الشراء. ظهرت رسالة خطأ عند الضغط على زر "تأكيد الطلب". أرجو المساعدة.
                    </p>
                    <p style={{ margin: 0, color: '#4A4A4A', fontSize: 14 }}><strong>🌐 الصفحة:</strong> /checkout</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ background: '#F8F6F2', padding: '20px 40px', borderTop: '1px solid #E8E2D9' }}>
                    <p style={{ margin: 0, color: '#B5AFA8', fontSize: 12 }}>© 2024 سوق — فريق الدعم الفني</p>
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
