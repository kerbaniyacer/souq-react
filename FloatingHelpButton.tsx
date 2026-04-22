import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { useErrorCollector } from '@shared/hooks/useErrorCollector';

const ERROR_TYPES = [
  'مشكلة في الموقع',
  'خطأ في الدفع',
  'مشكلة في الطلب',
  'مشكلة في التسجيل',
  'مشكلة في التطبيق',
  'أخرى',
];

export default function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [errorType, setErrorType] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { getErrors } = useErrorCollector();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show if scrolling up, near top, or if chat is open
      if (isOpen || currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        isOpen &&
        formRef.current &&
        !formRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorType || !message.trim()) return;

    setIsSending(true);

    // جمع الأخطاء تلقائياً
    const { js_errors, network_errors } = getErrors();

    try {
      // إرسال البلاغ عبر Django API
      await import('@features/auth/services/authService').then(({ default: api }) =>
        api.post('/support/request/', {
          issue_type: errorType,
          description: message,
          page_url: window.location.href,
          js_errors,
          network_errors,
          browser_info: navigator.userAgent,
        })
      );

      setIsSent(true);
      setErrorType('');
      setMessage('');
      setTimeout(() => {
        setIsSent(false);
        setIsOpen(false);
      }, 3000);
    } catch (error: any) {
      // Fallback: try emailService directly
      try {
        const { sendSupportEmail } = await import('@shared/services/emailService');
        await sendSupportEmail('souqsupport@gmail.com', 'زائر سوق', errorType, message);
        setIsSent(true);
        setErrorType('');
        setMessage('');
        setTimeout(() => { setIsSent(false); setIsOpen(false); }, 3000);
      } catch {
        console.error('Failed to send support request');
        // Show a user-friendly error message in the button
        setIsSending(false);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* زر عائم ثلاثي الأبعاد */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 z-[100] group transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'
        }`}
        aria-label="طلب المساعدة"
      >
        {/* الحلقة الخارجية المتحركة */}
        <span className="absolute inset-0 rounded-full animate-ping bg-primary-400/30 opacity-75" />
        {/* الظل ثلاثي الأبعاد */}
        <span
          className="absolute inset-0 rounded-full blur-md transition-all duration-300 group-hover:blur-lg"
          style={{
            background: 'linear-gradient(135deg, #5C8A6E, #3d6b52)',
          }}
        />
        {/* الزر الرئيسي */}
        <span
          className="relative flex items-center justify-center w-14 h-14 rounded-full text-white transition-all duration-300 group-hover:scale-110 group-active:scale-95"
          style={{
            background: 'linear-gradient(145deg, #7aab8a, #4a7259)',
            boxShadow: '0 6px 20px rgba(92,138,110,0.5), inset 0 2px 4px rgba(255,255,255,0.2), inset 0 -2px 4px rgba(0,0,0,0.2)',
          }}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
          ) : (
            <MessageCircle className="w-6 h-6" />
          )}
        </span>
        {/* نص توضيحي */}
        <span
          className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-arabic rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
        >
          طلب المساعدة
        </span>
      </button>

      {/* نموذج الإبلاغ */}
      {isOpen && (
        <div
          ref={formRef}
          className="fixed bottom-24 left-6 z-[100] w-80 sm:w-96 rounded-2xl overflow-hidden transition-all duration-300 animate-slide-up"
          style={{
            background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {/* رأس النموذج */}
          <div
            className="p-4 text-white"
            style={{
              background: 'linear-gradient(135deg, #5C8A6E, #3d6b52)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3)',
                }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold font-arabic text-sm">الإبلاغ عن مشكلة</h3>
                <p className="text-xs text-white/70 font-arabic">سنحل مشكلتك في أسرع وقت</p>
              </div>
            </div>
          </div>

          {/* محتوى النموذج */}
          <div className="p-4 dark:bg-gray-900 dark:text-gray-100 transition-colors">
            {isSent ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="font-bold font-arabic text-green-700 dark:text-green-400">تم الإرسال بنجاح!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-1">
                  شكراً لتواصلك معنا، سنرد عليك قريباً
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* نوع الخطأ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 font-arabic mb-1.5">
                    نوع المشكلة
                  </label>
                  <select
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all dark:text-gray-100"
                  >
                    <option value="">اختر نوع المشكلة...</option>
                    {ERROR_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* رسالة الخطأ */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 font-arabic mb-1.5">
                    تفاصيل المشكلة
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={3}
                    placeholder="اشرح المشكلة التي واجهتها بالتفصيل..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 resize-none transition-all dark:text-gray-100 dark:placeholder-gray-500"
                  />
                </div>

                {/* زر الإرسال */}
                <button
                  type="submit"
                  disabled={isSending || !errorType || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-400 hover:bg-primary-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold font-arabic text-sm rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 4px 12px rgba(92,138,110,0.3)',
                  }}
                >
                  {isSending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      إرسال البلاغ
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
