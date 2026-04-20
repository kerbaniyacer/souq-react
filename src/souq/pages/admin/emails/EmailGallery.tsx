import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';

const EMAIL_TEMPLATES = [
  { id: 'welcome',                 title: 'بريد الترحيب',                icon: '🎉', desc: 'يُرسَل عند تسجيل مستخدم جديد' },
  { id: 'otp',                     title: 'رمز التحقق (OTP)',             icon: '🔢', desc: 'رمز التحقق عند تسجيل الدخول' },
  { id: 'password-reset',          title: 'إعادة تعيين كلمة المرور',     icon: '🔑', desc: 'رابط إعادة التعيين عبر البريد' },
  { id: 'password-changed',        title: 'إشعار تغيير كلمة المرور',     icon: '🔒', desc: 'إشعار بعد تغيير كلمة المرور' },
  { id: 'password-reset-success',  title: 'نجاح تغيير كلمة المرور',      icon: '✅', desc: 'تأكيد بعد إعادة التعيين الناجحة' },
  { id: 'merchant-order',          title: 'إشعار طلب جديد للتاجر',       icon: '📦', desc: 'يُرسَل للتاجر عند ورود طلب جديد' },
  { id: 'security-alert',          title: 'تنبيه أمني',                  icon: '🚨', desc: 'تنبيه عند تسجيل دخول مشبوه' },
  { id: 'newsletter',              title: 'النشرة البريدية',              icon: '📩', desc: 'بريد تأكيد الاشتراك في النشرة' },
  { id: 'support',                 title: 'طلب دعم فني',                 icon: '🛠️', desc: 'إشعار للإدارة بطلب دعم جديد' },
  { id: 'buyer-order',             title: 'تأكيد الطلب (للمشتري)',       icon: '🧾', desc: 'تأكيد الطلب بنجاح للعميل' },
  { id: 'product-deleted',         title: 'حذف منتج من المتجر',         icon: '🗑️', desc: 'إشعار للتاجر بحذف منتجه' },
  { id: 'account-deleted',         title: 'إغلاق الحساب',                icon: '👋', desc: 'إشعار بإغلاق حساب المستخدم' },
  { id: 'report-notification',     title: 'بلاغ جديد للإدارة',          icon: '🚩', desc: 'تنبيه للإدارة بوجود بلاغ جديد' },
];

export default function EmailGallery() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 mb-6">
        <Link to="/admin-panel" className="hover:text-primary-600 transition-colors">لوحة التحكم</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-700">قوالب البريد الإلكتروني</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <Mail className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-arabic">قوالب البريد الإلكتروني</h1>
          <p className="text-sm text-gray-500 font-arabic mt-0.5">{EMAIL_TEMPLATES.length} قالب — انقر على أي قالب لمعاينته</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMAIL_TEMPLATES.map((t) => (
          <Link
            key={t.id}
            to={`/admin/emails/${t.id}`}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-primary-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none mt-0.5">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 font-arabic text-sm group-hover:text-primary-600 transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-400 font-arabic mt-1 leading-relaxed">{t.desc}</p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">{t.id}.html</span>
              <span className="text-xs text-primary-500 font-arabic group-hover:underline">معاينة ←</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
