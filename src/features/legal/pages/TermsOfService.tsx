import { Link } from 'react-router-dom';
import { FileText, ShoppingBag, Store, CreditCard, AlertTriangle, Scale, Ban, ArrowRight, CheckCircle } from 'lucide-react';

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

const Rule = ({ bad, children }: { bad?: boolean; children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    {bad
      ? <Ban className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      : <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
    }
    <span>{children}</span>
  </li>
);

export default function TermsOfService() {
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
              <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 font-arabic">شروط الاستخدام</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-0.5">آخر تحديث: أبريل 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Intro */}
        <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-2xl p-5 mb-10">
          <p className="text-sm text-primary-800 dark:text-primary-300 font-arabic leading-relaxed">
            مرحباً بك في <strong>سوق</strong>، منصة التجارة الإلكترونية الجزائرية. يُرجى قراءة هذه الشروط بعناية
            قبل استخدام المنصة. باستخدامك أو تسجيلك في المنصة، فأنت توافق على الالتزام بجميع الشروط التالية.
          </p>
        </div>

        <Section icon={CheckCircle} title="قبول الشروط">
          <p>
            تُعدّ هذه الشروط اتفاقية ملزمة بينك وبين منصة <strong>سوق</strong>. يجب أن يكون عمرك 18 سنة على الأقل
            أو أن تكون تحت إشراف وليّ أمر قانوني لاستخدام المنصة. إذا كنت تستخدم المنصة باسم مؤسسة أو شركة،
            فأنت تضمن أن لديك صلاحية إلزام تلك الجهة بهذه الشروط.
          </p>
        </Section>

        <Section icon={ShoppingBag} title="حساب المستخدم">
          <p>عند إنشاء حسابك، أنت مسؤول عن:</p>
          <ul className="space-y-2 mt-3">
            <Bullet>تقديم معلومات صحيحة ودقيقة وحديثة عند التسجيل وفي كل الأوقات.</Bullet>
            <Bullet>الحفاظ على سرية بيانات تسجيل الدخول الخاصة بك وعدم مشاركتها.</Bullet>
            <Bullet>إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك.</Bullet>
            <Bullet>جميع الأنشطة التي تتم من خلال حسابك.</Bullet>
          </ul>
          <p className="mt-3">
            نحتفظ بحق تعليق أو إلغاء الحساب الذي ينتهك هذه الشروط في أي وقت.
          </p>
        </Section>

        <Section icon={Store} title="قواعد للتجار">
          <p>إذا كنت تاجراً على المنصة، فأنت تلتزم بما يلي:</p>
          <ul className="space-y-2 mt-3">
            <Rule>تقديم منتجات حقيقية وبأوصاف دقيقة وصور واقعية.</Rule>
            <Rule>الالتزام بمواعيد التوصيل المعلنة والرد على رسائل الزبائن خلال 24 ساعة.</Rule>
            <Rule>الامتثال للقوانين التجارية الجزائرية ولوائح حماية المستهلك.</Rule>
            <Rule bad>بيع منتجات مزوّرة أو مقرصنة أو محظورة قانونياً.</Rule>
            <Rule bad>التلاعب بالتقييمات أو محاولة خداع الزبائن.</Rule>
            <Rule bad>نشر معلومات كاذبة أو مضللة عن المنتجات.</Rule>
            <Rule bad>التحايل على منصة الدفع لإجراء معاملات خارج المنصة.</Rule>
          </ul>
          <p className="mt-3">المخالفات تؤدي إلى تجميد المنتجات أو إيقاف الحساب حسب جسامة المخالفة.</p>
        </Section>

        <Section icon={ShoppingBag} title="قواعد للمشترين">
          <ul className="space-y-2">
            <Rule>التعامل باحترام مع التجار والمستخدمين الآخرين.</Rule>
            <Rule>تقديم تقييمات صادقة وبناءة فقط.</Rule>
            <Rule>الالتزام بشروط الإرجاع والاستبدال المعلنة لكل متجر.</Rule>
            <Rule bad>الطلب بنية الإرجاع بدون سبب مشروع بشكل متكرر.</Rule>
            <Rule bad>إساءة استخدام نظام البلاغات لأغراض شخصية.</Rule>
            <Rule bad>انتحال هوية شخص آخر أو استخدام بيانات بطاقة مسروقة.</Rule>
          </ul>
        </Section>

        <Section icon={CreditCard} title="المدفوعات والإرجاع">
          <p><strong>المدفوعات:</strong></p>
          <ul className="space-y-2 mt-2">
            <Bullet>تقبل المنصة الدفع عند الاستلام (COD) والحوالات البنكية (CCP / BaridiMob).</Bullet>
            <Bullet>يتم تحويل المستحقات للتاجر بعد تأكيد استلام الزبون للطلب.</Bullet>
            <Bullet>جميع الأسعار بالدينار الجزائري (DZD) وتشمل الضرائب المعمول بها.</Bullet>
          </ul>
          <p className="mt-4"><strong>الإرجاع والاسترداد:</strong></p>
          <ul className="space-y-2 mt-2">
            <Bullet>يُقبل الإرجاع خلال 7 أيام من استلام المنتج إذا كان معيباً أو لا يطابق الوصف.</Bullet>
            <Bullet>المنتجات المستخدمة أو التالفة بسبب العميل غير قابلة للإرجاع.</Bullet>
            <Bullet>يُعالج طلب الاسترداد خلال 5-10 أيام عمل بعد موافقة التاجر.</Bullet>
          </ul>
        </Section>

        <Section icon={Ban} title="المحتوى المحظور">
          <p>يُحظر تماماً نشر أو بيع ما يلي على المنصة:</p>
          <ul className="space-y-2 mt-3">
            <Rule bad>الأسلحة والمتفجرات والمواد الخطرة.</Rule>
            <Rule bad>المخدرات أو المواد المخدرة بأي شكل.</Rule>
            <Rule bad>المنتجات المزوّرة أو المقلّدة أو المنتهكة لحقوق الملكية الفكرية.</Rule>
            <Rule bad>المحتوى الإباحي أو المحتوى المسيء للأخلاق العامة.</Rule>
            <Rule bad>الخدمات المالية غير المرخصة أو المخططات الهرمية.</Rule>
            <Rule bad>أي منتج أو خدمة محظورة بموجب القانون الجزائري.</Rule>
          </ul>
        </Section>

        <Section icon={Scale} title="الملكية الفكرية">
          <p>
            جميع محتويات المنصة (الشعار، التصميم، الكود البرمجي، النصوص) هي ملكية خالصة لمنصة <strong>سوق</strong>
            ومحمية بموجب قوانين حقوق الملكية الفكرية. يُحظر نسخها أو توزيعها أو استخدامها تجارياً بدون إذن كتابي مسبق.
          </p>
          <p className="mt-3">
            عند نشر محتوى على المنصة (صور المنتجات، الأوصاف، التقييمات)، فأنت تمنحنا ترخيصاً غير حصري لاستخدامه
            لأغراض تشغيل المنصة والترويج لها.
          </p>
        </Section>

        <Section icon={AlertTriangle} title="إخلاء المسؤولية">
          <p>
            تعمل المنصة كوسيط بين البائعين والمشترين. منصة <strong>سوق</strong> غير مسؤولة عن:
          </p>
          <ul className="space-y-2 mt-3">
            <Bullet>جودة المنتجات أو دقة أوصافها المقدمة من التجار.</Bullet>
            <Bullet>التأخر في التوصيل الناجم عن ظروف خارجة عن إرادتنا.</Bullet>
            <Bullet>الأضرار غير المباشرة الناجمة عن استخدام المنصة.</Bullet>
          </ul>
          <p className="mt-3">
            نسعى جاهدين لضمان جودة الخدمة ومعالجة النزاعات بعدل، لكن القرار النهائي في النزاعات بين البائع والمشتري
            يعود لنظامنا الداخلي للشكاوى.
          </p>
        </Section>

        <Section icon={Scale} title="القانون المعمول به وحل النزاعات">
          <p>
            تخضع هذه الشروط لقوانين الجمهورية الجزائرية الديمقراطية الشعبية. في حال نشوء أي نزاع، يُسعى أولاً
            لحله ودياً. وفي حال تعذّر ذلك، يُحال النزاع إلى الجهات القضائية المختصة في الجزائر.
          </p>
        </Section>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
          <p className="text-xs text-gray-400 font-arabic text-center">
            نحتفظ بحق تعديل هذه الشروط في أي وقت. استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ موافقة عليها.
          </p>
          <div className="flex justify-center mt-4">
            <Link to="/privacy-policy" className="text-sm text-primary-600 hover:underline font-arabic">
              اقرأ أيضاً: سياسة الخصوصية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
