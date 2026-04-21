import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, KeyRound, ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // In a real Django setup, we'd call a reset endpoint
      await axios.post('/api/auth/password-reset/', { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('لا يوجد حساب مرتبط بهذا البريد الإلكتروني');
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex flex-col">
      {/* Nav */}
      <nav className="h-16 bg-white dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-[#2E2E2E] flex items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-400 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-lg">سوق</span>
        </Link>
        <Link to="/login" className="mr-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors">
          <ArrowRight className="w-4 h-4" />
          العودة لتسجيل الدخول
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {!sent ? (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm p-8">
              {/* Icon */}
              <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <KeyRound className="w-7 h-7 text-primary-500" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic text-center mb-2">نسيت كلمة المرور؟</h1>
              <p className="text-gray-500 dark:text-gray-400 font-arabic text-center text-sm leading-relaxed mb-8">
                أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl text-red-600 dark:text-red-400 text-sm font-arabic text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="example@email.com"
                      className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Mail className="w-5 h-5" /> إرسال رابط إعادة التعيين</>
                  }
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 dark:border-[#2E2E2E] text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
                  تذكرت كلمة المرور؟{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:hover:text-primary-400 font-medium transition-colors">
                    تسجيل الدخول
                  </Link>
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 font-arabic">
                الرابط صالح لمدة ساعة واحدة فقط 🔒
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-3">تم إرسال البريد!</h2>
              <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm leading-relaxed mb-6">
                تم إرسال رابط إعادة تعيين كلمة المرور إلى<br />
                <strong className="text-gray-700 dark:text-gray-300">{email}</strong><br />
                تحقق من صندوق الوارد أو مجلد الرسائل غير المرغوبة.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="w-full py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 rounded-xl font-arabic text-sm hover:bg-gray-200 dark:hover:bg-[#2E2E2E] transition-colors"
                >
                  إرسال مرة أخرى
                </button>
                <Link to="/login" className="block w-full py-3 bg-primary-400 text-white rounded-xl font-arabic text-sm hover:bg-primary-500 transition-colors">
                  العودة لتسجيل الدخول
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
