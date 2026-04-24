import { Link } from 'react-router-dom';
import { Shield, Eye, Lock, Database, Bell, UserCheck, Mail, ArrowRight } from 'lucide-react';

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">{title}</h2>
    </div>
    <div className="pr-12 text-gray-600 dark:text-gray-400 font-arabic leading-relaxed space-y-3 text-sm">
      {children}
    </div>
  </section>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
    <span>{children}</span>
  </li>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-page-bg dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-arabic mb-4 transition-colors">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 font-arabic">سياسة الخصوصية</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-0.5">آخر تحديث: أبريل 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Intro card */}
        <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-5 mb-10">
          <p className="text-sm text-primary-800 dark:text-primary-300 font-arabic leading-relaxed">
            نحن في <strong>سوق</strong> نلتزم بحماية خصوصيتك وبياناتك الشخصية. توضح هذه السياسة كيفية جمعنا
            للمعلومات واستخدامها وحمايتها عند استخدامك لمنصتنا. باستخدامك للمنصة فأنت توافق على هذه السياسة.
          </p>
        </div>

        <Section icon={Database} title="المعلومات التي نجمعها">
          <p>نجمع المعلومات التالية عند تسجيلك واستخدامك للمنصة:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>بيانات التسجيل: الاسم، البريد الإلكتروني، رقم الهاتف، الولاية والبلدية.</Bullet>
            <Bullet>بيانات الملف الشخصي: صورة الحساب، بيانات المتجر (للتجار)، معلومات الدفع (اختياري).</Bullet>
            <Bullet>بيانات الطلبات والمعاملات: تاريخ الشراء، عناوين التوصيل، حالة الطلبات.</Bullet>
            <Bullet>بيانات الاستخدام: عنوان IP، نوع المتصفح، صفحات الزيارة، وقت الجلسة.</Bullet>
            <Bullet>المحتوى الذي تُنشئه: تقييمات المنتجات، رسائل الدردشة مع التجار.</Bullet>
          </ul>
        </Section>

        <Section icon={Eye} title="كيف نستخدم معلوماتك">
          <ul className="space-y-2">
            <Bullet>تقديم خدمات المنصة وإدارة حسابك وطلباتك.</Bullet>
            <Bullet>التحقق من هويتك وضمان أمان حسابك (مثل التحقق عبر OTP).</Bullet>
            <Bullet>إرسال إشعارات تتعلق بطلباتك، دفعاتك، ورسائل التجار.</Bullet>
            <Bullet>تحسين تجربة الاستخدام وتطوير ميزات جديدة بناءً على بيانات مجمّعة.</Bullet>
            <Bullet>الامتثال للمتطلبات القانونية في الجزائر.</Bullet>
            <Bullet>الرد على استفساراتك وطلبات الدعم الفني.</Bullet>
          </ul>
        </Section>

        <Section icon={UserCheck} title="مشاركة المعلومات">
          <p>نحن لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك المعلومات في الحالات التالية فقط:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>مع التجار: يتلقى التاجر معلومات التوصيل الضرورية لإتمام طلبك فقط.</Bullet>
            <Bullet>مع مزودي الخدمة: شركاء تقنيون يساعدوننا في تشغيل المنصة (الخوادم، البريد الإلكتروني) مع الالتزام بالسرية.</Bullet>
            <Bullet>بموجب القانون: عند الطلب من الجهات القضائية أو الأمنية المختصة في الجزائر.</Bullet>
            <Bullet>في حالة الدمج أو الاستحواذ: مع إخطارك مسبقاً.</Bullet>
          </ul>
        </Section>

        <Section icon={Lock} title="أمان البيانات">
          <p>نتخذ إجراءات تقنية وتنظيمية صارمة لحماية بياناتك:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>تشفير البيانات أثناء النقل باستخدام بروتوكول HTTPS.</Bullet>
            <Bullet>تخزين كلمات المرور مشفرة (لا يمكن لأحد قراءتها بما فيهم فريقنا).</Bullet>
            <Bullet>نظام جلسات آمن (JWT مع تحديث تلقائي) وإشعارات تسجيل الدخول من أجهزة جديدة.</Bullet>
            <Bullet>الوصول المحدود للبيانات: لا يصل إلى بياناتك إلا الموظفون المخوّلون حسب الضرورة.</Bullet>
            <Bullet>مراقبة الأنشطة المشبوهة ونظام بلاغات للحماية من الاحتيال.</Bullet>
          </ul>
        </Section>

        <Section icon={Bell} title="ملفات تعريف الارتباط (Cookies)">
          <p>نستخدم ملفات تعريف الارتباط لـ:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>الحفاظ على جلسة تسجيل دخولك بأمان.</Bullet>
            <Bullet>تذكر تفضيلاتك (مثل وضع الليل/النهار).</Bullet>
            <Bullet>تحليل استخدام المنصة لتحسين الأداء.</Bullet>
          </ul>
          <p className="mt-3">يمكنك إيقاف تشغيل ملفات الارتباط من إعدادات متصفحك، لكن بعض ميزات المنصة قد لا تعمل بشكل صحيح.</p>
        </Section>

        <Section icon={UserCheck} title="حقوقك">
          <p>بموجب القوانين المعمول بها، لك الحق في:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>الاطلاع على بياناتك الشخصية التي نحتفظ بها.</Bullet>
            <Bullet>تصحيح أو تحديث بياناتك من خلال صفحة الملف الشخصي.</Bullet>
            <Bullet>طلب حذف حسابك وبياناتك (تواصل مع الدعم).</Bullet>
            <Bullet>الاعتراض على معالجة بياناتك في حالات معينة.</Bullet>
          </ul>
        </Section>

        <Section icon={Mail} title="التواصل معنا">
          <p>إذا كان لديك أي استفسار حول سياسة الخصوصية أو ممارساتنا في التعامل مع البيانات، تواصل معنا عبر:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>البريد الإلكتروني: <span className="text-primary-600 font-mono">privacy@souq.dz</span></Bullet>
            <Bullet>من خلال نموذج التواصل في المنصة.</Bullet>
          </ul>
        </Section>

        {/* Footer note */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
          <p className="text-xs text-gray-400 font-arabic text-center">
            نحتفظ بحق تعديل هذه السياسة في أي وقت. سيتم إخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.
          </p>
          <div className="flex justify-center mt-4">
            <Link to="/terms-of-service" className="text-sm text-primary-600 hover:underline font-arabic">
              اقرأ أيضاً: شروط الاستخدام
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
