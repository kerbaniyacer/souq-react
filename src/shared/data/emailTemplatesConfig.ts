export interface EmailContent {
  subject: string;
  header: string;
  subheader: string;
  bodyTitle?: string;
  bodyText: string;
  buttonLabel?: string;
  buttonLink?: string;
}

export const DEFAULT_EMAIL_CONTENT: Record<string, EmailContent> = {
  welcome: {
    subject: 'مرحباً بك في سوق 🎉',
    header: 'أهلاً وسهلاً بك!',
    subheader: 'يسعدنا انضمامك إلى عائلة سوق. حسابك جاهز الآن للتسوق!',
    bodyTitle: 'ما يمكنك فعله الآن:',
    bodyText: 'تصفح آلاف المنتجات، أضف منتجاتك المفضلة للسلة، وتتبع طلباتك بسهولة.',
    buttonLabel: 'ابدأ التسوق الآن',
    buttonLink: '/products'
  },
  otp: {
    subject: 'رمز التحقق الخاص بك - سوق 🔢',
    header: 'رمز التحقق',
    subheader: 'استخدم الرمز التالي لإكمال عملية تسجيل الدخول.',
    bodyText: 'الرمز صالح لمدة 10 دقائق فقط. لا تشارك هذا الرمز مع أي شخص.',
  },
  'password-reset': {
    subject: 'إعادة تعيين كلمة المرور - سوق 🔑',
    header: 'نسيت كلمة المرور؟',
    subheader: 'استلمنا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.',
    bodyText: 'الرابط صالح لفترة محدودة فقط. إذا لم تطلب ذلك، تجاهل هذا البريد.',
    buttonLabel: 'إعادة تعيين كلمة المرور',
    buttonLink: '/reset-password'
  },
  'password-changed': {
    subject: 'تم تغيير كلمة المرور بنجاح - سوق 🔒',
    header: 'إشعار أمني',
    subheader: 'نحيطك علماً بأنه تم تغيير كلمة المرور الخاصة بحسابك بنجاح.',
    bodyText: 'إذا لم تقم بهذا التغيير، يرجى التواصل مع الدعم الفني فوراً.',
    buttonLabel: 'تأمين الحساب',
    buttonLink: '/support'
  },
  'password-reset-success': {
    subject: 'تمت إعادة تعيين كلمة المرور - سوق ✅',
    header: 'نجاح العملية',
    subheader: 'تهانينا، تم تحديث كلمة مرورك بنجاح ويمكنك الآن الدخول لحسابك.',
    bodyText: 'استمتع بالتسوق الآمن في منصتنا.',
    buttonLabel: 'تسجيل الدخول',
    buttonLink: '/login'
  },
  'merchant-order': {
    subject: 'لديك طلب جديد! 🛒',
    header: 'طلب جديد وارد',
    subheader: 'لديك طلب جديد في متجرك! رقم الطلب متوفر في لوحة التحكم.',
    bodyText: 'يرجى مراجعة تفاصيل الطلب وتجهيز المنتجات للشحن في أقرب وقت.',
    buttonLabel: 'لوحة تحكم التاجر',
    buttonLink: '/merchant/dashboard'
  },
  'security-alert': {
    subject: 'تنبيه أمني: دخول جديد 🚨',
    header: 'دخول من جهاز جديد',
    subheader: 'تم اكتشاف تسجيل دخول لحسابك من عنوان IP جديد.',
    bodyText: 'إذا كنت أنت، يمكنك تجاهل هذا التنبيه. إذا لم تكن أنت، يرجى تغيير كلمة المرور فوراً.',
    buttonLabel: 'تغيير كلمة المرور',
    buttonLink: '/profile'
  },
  newsletter: {
    subject: 'تأكيد الاشتراك في النشرة 📩',
    header: 'شكراً لاشتراكك!',
    subheader: 'تم تفعيل اشتراكك في نشرة سوق البريدية بنجاح.',
    bodyText: 'ستصلك قريباً أحدث العروض والمنتجات الحصرية مباشرة إلى بريدك.',
  },
  support: {
    subject: 'تلقينا طلب الدعم الفني الخاص بك 🛠️',
    header: 'طلب دعم جديد',
    subheader: 'تم استلام طلبك وبدأ فريقنا في مراجعته.',
    bodyText: 'سنتواصل معك في أقرب وقت ممكن لحل المشكلة. شكراً لصبرك.',
  },
  // New templates
  'buyer-order': {
    subject: 'تأكيد طلبك من سوق 🎉',
    header: 'شكراً لطلبك!',
    subheader: 'تم استلام طلبك بنجاح. سنقوم بتجهيزه لك في أقرب وقت.',
    bodyText: 'يمكنك متابعة حالة طلبك وتفاصيله من خلال حسابك الشخصي.',
    buttonLabel: 'تتبع طلبك',
    buttonLink: '/orders'
  },
  'product-deleted': {
    subject: 'تنبيه: حذف منتج من متجرك 📦',
    header: 'إشعار إداري',
    subheader: 'نحيطك علماً بأنه تم حذف أحد منتجاتك بناءً على مراجعة الإدارة.',
    bodyText: 'بسبب مخالفة شروط المنصة أو عدم مطابقة المواصفات. يرجى مراجعة القوانين.',
    buttonLabel: 'تواصل مع الدعم',
    buttonLink: '/support'
  },
  'account-deleted': {
    subject: 'إشعار بإغلاق الحساب 👋',
    header: 'يؤسفنا رحيلك',
    subheader: 'تم إغلاق حسابك في منصة سوق بناءً على طلبك أو بقرار إداري.',
    bodyText: 'نشكرك على استخدام منصتنا ونتمنى لك التوفيق في مستقبلك.',
  },
  'report-notification': {
    subject: 'بلاغ جديد من مستخدم 🚩',
    header: 'بلاغ يحتاج مراجعة',
    subheader: 'قام أحد المستخدمين بتقديم بلاغ جديد يحتاج إلى اتخاذ إجراء.',
    bodyText: 'يرجى مراجعة تفاصيل البلاغ في لوحة التحكم واتخاذ الإجراء اللازم.',
    buttonLabel: 'لوحة الإدارة',
    buttonLink: '/admin-panel'
  },
  'appeal-decision': {
    subject: 'قرار بخصوص طعنك الإداري ⚖️',
    header: 'مراجعة طلب الطعن',
    subheader: 'تمت مراجعة الطعن المقدم من قبلك بشأن الإجراء الإداري الأخير.',
    bodyText: 'يرجى مراجعة تفاصيل القرار في لوحة التحكم الخاصة بك أو تواصل معنا لمزيد من التوضيح.',
    buttonLabel: 'عرض التفاصيل',
    buttonLink: '/merchant/dashboard'
  },
  'visibility-change': {
    subject: 'تحديث بخصوص ظهور منتجك 👁️',
    header: 'تغيير حالة الظهور',
    subheader: 'قام مسؤول النظام بتغيير حالة ظهور أحد منتجاتك في المتجر.',
    bodyText: 'هذا الإجراء يهدف لضمان جودة المحتوى المعروض في المنصة وفقاً للمعايير المعتمدة.',
    buttonLabel: 'لوحة التاجر',
    buttonLink: '/merchant/products'
  },
  'admin-action': {
    subject: 'إشعار بخصوص إجراء إداري 🛠️',
    header: 'تحديث الحالة الإدارية',
    subheader: 'تم اتخاذ إجراء إداري بخصوص العنصر المحدد (استعادة أو حذف نهائي).',
    bodyText: 'نحرص دائماً على تطبيق القوانين بعدالة وشفافية لضمان تجربة آمنة لجميع المستخدمين.',
    buttonLabel: 'التفاصيل',
    buttonLink: '/profile'
  }
};
