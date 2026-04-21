import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Send, ShoppingBag, CheckCircle, Info } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@souq/stores/toastStore';

export default function AccountSuspended() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const email = searchParams.get('email') || '';
  const reason = searchParams.get('reason') || 'مخالفة شروط الاستخدام';
  
  const [appealReason, setAppealReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) {
      setError('يرجى توضيح سبب الطعن');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post('/api/auth/appeals/public/', {
        email: email,
        reason: appealReason
      });
      setSubmitted(true);
      toast.success('تم تقديم الطعن بنجاح');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'حدث خطأ أثناء تقديم الطعن';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex flex-col rtl">
      {/* Simple Header */}
      <nav className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-[#2E2E2E] flex items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-lg">سوق</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-[#2E2E2E] shadow-xl overflow-hidden">
            
            {/* Warning Banner */}
            <div className="bg-red-500 p-8 text-center text-white relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                  <ShieldAlert className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold font-arabic mb-2">تنبيه: تم تجميد حسابك</h1>
                <p className="text-red-50 font-arabic opacity-90 text-sm">
                  نأسف، ولكن لم يعد بإمكانك الوصول إلى حسابك حالياً
                </p>
              </div>
            </div>

            <div className="p-8">
              {!submitted ? (
                <div className="space-y-8">
                  {/* Reason Section */}
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Info className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-amber-900 dark:text-amber-400 font-arabic mb-1">سبب التجميد:</h3>
                        <p className="text-amber-800 dark:text-amber-300 font-arabic text-sm leading-relaxed">
                          {reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-600 dark:text-gray-400 text-sm font-arabic leading-relaxed">
                    <p className="mb-4 text-gray-900 dark:text-gray-100 font-bold">ماذا يمكنك أن تفعل؟</p>
                    <p>
                      إذا كنت تعتقد أن هذا القرار تم عن طريق الخطأ، يمكنك تقديم "طلب طعن" موضحاً وجهة نظرك. ستقوم الإدارة بمراجعة طلبك والرد عليك عبر البريد الإلكتروني خلال 48 ساعة.
                    </p>
                  </div>

                  {/* Appeal Form */}
                  <form onSubmit={handleAppeal} className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
                    {error && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-600 dark:text-red-400 text-sm font-arabic">
                        {error}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 font-arabic mb-2 px-1">اشرح لنا وجهة نظرك (الطعن):</label>
                      <textarea
                        value={appealReason}
                        onChange={(e) => setAppealReason(e.target.value)}
                        placeholder="اكتب هنا التفاصيل التي تساعدنا على مراجعة قرار التجميد..."
                        rows={5}
                        className="w-full p-4 rounded-2xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/30 font-arabic text-sm transition-all resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-2xl hover:opacity-90 transition-all font-arabic flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          إرسال طلب الطعن للإدارة
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center space-y-6">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-100 dark:border-green-900/30">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">تم استلام طعنك بنجاح</h2>
                  <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm max-w-sm mx-auto leading-relaxed">
                    شكراً لك. سيقوم فريق الإدارة بمراجعة بريدك الإلكتروني <strong>({email})</strong> والرد عليه قريباً بشأن حالة حسابك.
                  </p>
                  <div className="pt-6">
                    <Link to="/" className="text-primary-500 font-bold font-arabic hover:underline">
                      العودة للرئيسية
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-center mt-8 text-gray-400 font-arabic text-xs">
            يحق لكل مستخدم تقديم الطعن بحد أقصى 3 مرات لكل طلب تجميد.
          </p>
        </div>
      </div>
    </div>
  );
}
