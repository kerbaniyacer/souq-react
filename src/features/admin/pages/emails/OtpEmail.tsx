import EmailPreviewWrapper from './EmailPreviewWrapper';
import { useEmailContent } from '@shared/data/useEmailContent';

export default function OtpEmail() {
  const content = useEmailContent('otp');

  return (
    <EmailPreviewWrapper title={content.subject} type="otp">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                {/* Icon */}
                <tr>
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 60, lineHeight: 1 }}>🔢</div>
                    <h2 style={{ margin: '15px 0 0', color: '#2D2D2D', fontSize: 22 }}>{content.header}</h2>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ padding: '20px 40px 40px' }}>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 16, lineHeight: 1.8, textAlign: 'center' }}>
                      {content.subheader}
                    </p>
                    <div style={{ textAlign: 'center', marginBottom: 30 }}>
                      <div style={{ display: 'inline-block', background: '#F0F7F3', border: '2px solid #5C8A6E', borderRadius: 12, padding: '15px 30px' }}>
                        <span style={{ fontSize: 32, fontWeight: 'bold', color: '#5C8A6E', letterSpacing: 8 }}>123456</span>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 13, lineHeight: 1.8, textAlign: 'center' }}>
                      {content.bodyText}
                    </p>
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
