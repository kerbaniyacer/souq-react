import EmailPreviewWrapper from './EmailPreviewWrapper';
import { useEmailContent } from '@souq/data/useEmailContent';

export default function BuyerOrderEmail() {
  const content = useEmailContent('buyer-order');

  return (
    <EmailPreviewWrapper title={content.subject} type="buyer-order">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                {/* Header */}
                <tr>
                  <td align="center" style={{ background: 'linear-gradient(135deg,#5C8A6E,#4a7059)', padding: '40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 36, letterSpacing: 2 }}>سوق</h1>
                  </td>
                </tr>
                {/* Icon */}
                <tr>
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 60, lineHeight: 1 }}>🛍️</div>
                    <h2 style={{ margin: '15px 0 0', color: '#2D2D2D', fontSize: 22 }}>{content.header}</h2>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ padding: '20px 40px 40px' }}>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 16, lineHeight: 1.8, textAlign: 'center' }}>
                      {content.subheader}
                      <br />
                      {content.bodyText}
                    </p>
                    
                    <div style={{ background: '#F8F6F2', borderRadius: 12, padding: '20px', marginBottom: '30px' }}>
                      <p style={{ margin: '0 0 10px', color: '#2D2D2D', fontSize: 14, fontWeight: 'bold' }}>تفاصيل الطلب:</p>
                      <table width="100%" cellPadding={0} cellSpacing={0} style={{ fontSize: 14 }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '5px 0', color: '#7A7169' }}>رقم الطلب:</td>
                            <td align="left" style={{ fontWeight: 'bold' }}>#ORD-123456</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '5px 0', color: '#7A7169' }}>الإجمالي:</td>
                            <td align="left" style={{ fontWeight: 'bold', color: '#5C8A6E' }}>7,300.00 دج</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr><td align="center">
                        <a href="#" style={{ display: 'inline-block', background: '#5C8A6E', color: '#fff', textDecoration: 'none', padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
                          {content.buttonLabel}
                        </a>
                      </td></tr></tbody>
                    </table>
                  </td>
                </tr>
                {/* Footer */}
                <tr>
                  <td align="center" style={{ background: '#F8F6F2', padding: '20px 40px', borderTop: '1px solid #E8E2D9' }}>
                    <p style={{ margin: 0, color: '#B5AFA8', fontSize: 12 }}>© 2026 سوق — جميع الحقوق محفوظة</p>
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
