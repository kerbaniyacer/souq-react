import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/authService';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verificationStarted = useRef(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (verificationStarted.current) return;
    
    const verify = async () => {
      if (!uid || !token) {
        setStatus('error');
        setMessage('بيانات التحقق مفقودة. يرجى التأكد من الرابط المرسل إليك.');
        return;
      }

      verificationStarted.current = true;
      try {
        const response = await api.post('/accounts/verify-email/', { uid, token });
        setStatus('success');
        setMessage(response.data.detail || 'تم تفعيل حسابك بنجاح!');
        
        // Auto redirect after 5 seconds
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'حدث خطأ أثناء تفعيل الحساب. قد يكون الرابط منتهي الصلاحية.');
      }
    };

    void verify();
  }, [uid, token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none p-8 text-center border border-gray-100 dark:border-gray-800">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary-500" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-arabic mb-4">
          تفعيل الحساب
        </h1>

        <div className="space-y-6">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400 font-arabic">جاري التحقق من بريدك الإلكتروني...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-green-700 dark:text-green-400 font-bold font-arabic mb-2">تهانينا!</p>
              <p className="text-gray-600 dark:text-gray-300 font-arabic text-sm">
                {message}
              </p>
              <p className="text-gray-400 dark:text-gray-500 font-arabic text-xs mt-6">
                سيتم تحويلك إلى صفحة تسجيل الدخول تلقائياً خلال 5 ثوانٍ...
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-primary-400 hover:bg-primary-500 text-white font-bold font-arabic rounded-xl transition-all active:scale-95"
              >
                تسجيل الدخول الآن
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-red-700 dark:text-red-400 font-bold font-arabic mb-2">عذراً، فشلت العملية</p>
              <p className="text-gray-600 dark:text-gray-300 font-arabic text-sm">
                {message}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <Link
                  to="/register"
                  className="w-full py-3 bg-primary-400 hover:bg-primary-500 text-white font-bold font-arabic rounded-xl transition-all active:scale-95"
                >
                  حاول التسجيل مرة أخرى
                </Link>
                <Link
                  to="/"
                  className="w-full py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-arabic text-sm flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  العودة للرئيسية
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
