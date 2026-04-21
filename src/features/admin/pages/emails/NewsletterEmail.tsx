import EmailPreviewWrapper from './EmailPreviewWrapper';

const SITE = 'https://chan-greasier-olympia.ngrok-free.dev';

export default function NewsletterEmail() {
  return (
    <EmailPreviewWrapper title="مرحباً بك في النشرة اليومية - سوق">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ padding: '40px 20px', backgroundColor: '#F8F6F2' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ background: '#5C8A6E', padding: 40 }}>
                    <h1 style={{ color: '#fff', margin: 0, fontSize: 28 }}>📩 النشرة اليومية</h1>
                    <p style={{ color: '#DDEFE6', marginTop: 10 }}>أفضل العروض والمنتجات يومياً</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ padding: 30 }}>
                    <h2 style={{ margin: 0, color: '#2D2D2D' }}>مرحباً محمد 👋</h2>
                    <p style={{ color: '#777', marginTop: 10 }}>شكراً لاشتراكك في نشرتنا اليومية!</p>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '0 40px 30px', textAlign: 'center' }}>
                    <p style={{ color: '#555', lineHeight: 1.8 }}>ابتداءً من اليوم، ستصلك أحدث:</p>
                    <ul style={{ listStyle: 'none', padding: 0, color: '#333', lineHeight: 2 }}>
                      <li>🔥 عروض حصرية</li>
                      <li>🛍️ منتجات جديدة</li>
                      <li>💡 نصائح تسوق ذكية</li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ paddingBottom: 30 }}>
                    <a href={SITE} style={{ background: '#5C8A6E', color: '#fff', padding: '12px 30px', borderRadius: 8, textDecoration: 'none', fontWeight: 'bold' }}>
                      تصفح الموقع الآن
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ padding: 20, fontSize: 12, color: '#999', borderTop: '1px solid #E8E2D9', background: '#F8F6F2' }}>
                    يمكنك إلغاء الاشتراك في أي وقت
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
