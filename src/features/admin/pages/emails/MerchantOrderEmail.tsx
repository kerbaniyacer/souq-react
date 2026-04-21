import EmailPreviewWrapper from './EmailPreviewWrapper';
import { useEmailContent } from '@shared/data/useEmailContent';

export default function MerchantOrderEmail() {
  const content = useEmailContent('merchant-order');

  return (
    <EmailPreviewWrapper title={content.subject} type="merchant-order">
      <div dir="rtl" lang="ar" style={{ margin: 0, padding: 0, backgroundColor: '#F8F6F2', fontFamily: 'Arial, sans-serif' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: '#F8F6F2', padding: '40px 20px' }}>
          <tbody><tr><td align="center">
            <table width="560" cellPadding={0} cellSpacing={0} style={{ background: '#fff', borderRadius: 16, border: '1px solid #E8E2D9', overflow: 'hidden', maxWidth: '100%' }}>
              <tbody>
                <tr>
                  <td align="center" style={{ background: 'linear-gradient(135deg,#5C8A6E,#4a7059)', padding: 40 }}>
                    <h1 style={{ margin: 0, color: '#fff', fontSize: 36, letterSpacing: 2 }}>سوق</h1>
                    <p style={{ margin: '10px 0 0', color: '#C8E0D4', fontSize: 15 }}>منصة التاجر</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ padding: '35px 40px 10px' }}>
                    <div style={{ fontSize: 60, lineHeight: 1 }}>📦</div>
                    <h2 style={{ margin: '15px 0 0', color: '#2D2D2D', fontSize: 22 }}>عزيزي التاجر، لديك طلب جديد!</h2>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '20px 40px 40px' }}>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 15, lineHeight: 1.8, textAlign: 'center' }}>
                      لقد قام أحد العملاء بطلب بعض المنتجات المتوفرة في متجرك. يرجى الاطلاع على التفاصيل وتجهيز الطلب في أقرب وقت.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: 30 }}>
                      <tbody><tr>
                        <td style={{ background: '#EAF2EE', borderRadius: 10, padding: 20 }}>
                          <p style={{ margin: '0 0 10px', color: '#2D2D2D', fontSize: 15 }}><strong>رقم الطلب:</strong> ORD-87654321</p>
                          <p style={{ margin: 0, color: '#2D2D2D', fontSize: 15 }}><strong>تاريخ ووقت الطلب:</strong> {new Date().toLocaleString('ar-DZ')}</p>
                        </td>
                      </tr></tbody>
                    </table>
                    <p style={{ margin: '0 0 25px', color: '#7A7169', fontSize: 14, textAlign: 'center' }}>
                      يمكنك متابعة كافة البيانات وتغيير حالة الطلب عن طريق لوحة التحكم الخاصة بك.
                    </p>
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tbody><tr><td align="center">
                        <a href={`${window.location.origin}/merchant/orders`} style={{ display: 'inline-block', background: '#5C8A6E', color: '#fff', textDecoration: 'none', padding: '14px 40px', borderRadius: 10, fontSize: 16, fontWeight: 'bold' }}>
                          التوجه إلى الطلبات
                        </a>
                      </td></tr></tbody>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style={{ background: '#F8F6F2', padding: '20px 40px', borderTop: '1px solid #E8E2D9' }}>
                    <p style={{ margin: 0, color: '#B5AFA8', fontSize: 12 }}>© 2024 سوق — جميع الحقوق محفوظة لشركائنا التجار</p>
                    <p style={{ margin: '6px 0 0', color: '#B5AFA8', fontSize: 11 }}>هذا بريد إشعار تلقائي من منصة سوق.</p>
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
