import EmailPreviewWrapper from './EmailPreviewWrapper';
import { useEmailContent } from '@shared/data/useEmailContent';

export default function ProductDeletedEmail() {
  const content = useEmailContent('product-deleted');

  return (
    <EmailPreviewWrapper title={content.subject} type="product-deleted">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 24, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
              <tbody>
                {/* Header */}
                <tr>
                  <td align="center" style={{ background: '#B91C1C', padding: '40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 32, letterSpacing: 2, fontWeight: 900 }}>سوق</h1>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ padding: '48px 40px' }}>
                     <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ width: 80, height: 80, background: '#f8f9fa', borderRadius: 16, display: 'inline-flex', alignItems:center, justifyContent: 'center', margin: '0 auto 16px' }}>
                          <span style={{ fontSize: 40 }}>📦</span>
                        </div>
                        <h2 style={{ color: '#1f2937', fontSize: 24, margin: '0 0 8px', fontWeight: 800 }}>{content.header}</h2>
                        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, margin: '0 auto', maxWidth: 400 }}>
                          {content.subheader} {content.bodyText}
                        </p>
                     </div>

                     <div style={{ background: '#FEF2F2', borderRight: '4px solid #EF4444', padding: 20, margin: '32px 0', borderRadius: 8 }}>
                        <p style={{ margin: '0 0 4px', color: '#991B1B', fontWeight: 800, fontSize: 14 }}>المنتج المحذوف:</p>
                        <p style={{ margin: 0, color: '#B91C1C', fontSize: 16, fontWeight: 600 }}>أيفون 15 بروميوم - نسخة 256 جيجابايت</p>
                     </div>

                     <div style={{ textAlign: 'center', margin: '32px 0' }}>
                        <a href="#" style={{ display: 'inline-block', background: '#EF4444', color: '#ffffff', padding: '16px 48px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 16, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
                           {content.buttonLabel}
                        </a>
                     </div>
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
