import EmailPreviewWrapper from './EmailPreviewWrapper';

const SITE = 'https://chan-greasier-olympia.ngrok-free.dev';

export default function WelcomeEmail() {
  return (
    <EmailPreviewWrapper title="مرحباً بك في سوق!">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                {/* Header */}
                <tr>
                  <td align="center" style={{ background: 'linear-gradient(135deg,#5C8A6E,#4a7059)', padding: '40px' }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 36, letterSpacing: 2 }}>سوق</h1>
                    <p style={{ margin: '10px 0 0', color: '#C8E0D4', fontSize: 15 }}>منصة التسوق الإلكتروني</p>
                  </td>
                </tr>
                {/* Icon */}
                <tr>
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 60, lineHeight: 1 }}>🎉</div>
                    <h2 style={{ margin: '15px 0 0', color: '#2D2D2D', fontSize: 22 }}>أهلاً وسهلاً، محمد!</h2>
                  </td>
                </tr>
                {/* Body */}
                <tr>
                  <td style={{ padding: '20px 40px 40px' }}>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 15, lineHeight: 1.8, textAlign: 'center' }}>
                      يسعدنا انضمامك إلى مجتمع سوق! حسابك جاهز الآن وبإمكانك الاستمتاع بتجربة تسوق مميزة.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 30 }}>
                      <tbody>
                        {[
                          '🛍️ \u00a0تسوق بسهولة — آلاف المنتجات في مكان واحد',
                          '🔒 \u00a0دفع آمن — حماية كاملة لبياناتك',
                          '🚚 \u00a0توصيل سريع — شحن مجاني عند الطلبات فوق 5000 دج',
                        ].map((item, i) => (
                          <tr key={i}>
                            <td style={{ background: '#EAF2EE', borderRadius: 10, padding: '15px 20px', marginBottom: 8, display: 'block' }}>
                              <p style={{ margin: 0, color: '#2D2D2D', fontSize: 14 }} dangerouslySetInnerHTML={{ __html: item.replace('تسوق بسهولة', '<strong>تسوق بسهولة</strong>').replace('دفع آمن', '<strong>دفع آمن</strong>').replace('توصيل سريع', '<strong>توصيل سريع</strong>') }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr><td align="center">
                        <a href={SITE} style={{ display: 'inline-block', background: '#5C8A6E', color: '#fff', textDecoration: 'none', padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
                          ابدأ التسوق الآن
                        </a>
                      </td></tr></tbody>
                    </table>
                  </td>
                </tr>
                {/* Footer */}
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
