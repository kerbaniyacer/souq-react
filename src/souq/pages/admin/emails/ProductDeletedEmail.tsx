import EmailPreviewWrapper from './EmailPreviewWrapper';
import { useEmailContent } from '@souq/data/useEmailContent';

export default function ProductDeletedEmail() {
  const content = useEmailContent('product-deleted');

  return (
    <EmailPreviewWrapper title={content.subject} type="product-deleted">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                {/* Header */}
                <tr>
                  <td align="center" style={{ background: 'linear-gradient(135deg,#dc2626,#991b1b)', padding: '40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 36, letterSpacing: 2 }}>سوق</h1>
                  </td>
                </tr>
                {/* Icon */}
                <tr>
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 60, lineHeight: 1 }}>📦</div>
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
                    
                    <div style={{ background: '#fef2f2', borderRight: '4px solid #ef4444', padding: '20px', marginBottom: '30px' }}>
                      <p style={{ margin: '0 0 8px', color: '#b91c1c', fontWeight: 'bold' }}>المنتج المحذوف:</p>
                      <p style={{ margin: 0, color: '#4b5563' }}>آيفون 15 بروميوم - نسخة 256 جيجابايت</p>
                    </div>

                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr><td align="center">
                        <a href="#" style={{ display: 'inline-block', background: '#dc2626', color: '#fff', textDecoration: 'none', padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
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
