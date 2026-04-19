import { useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Store, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import SocialAuthButtons from '@souq/components/common/SocialAuthButtons';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP step
  const [step, setStep] = useState<'creds' | 'otp'>('creds');
  const [pendingUserId, setPendingUserId] = useState('');
  const [maskedEmail, setMaskedEmail]   = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { login, loginWithOtp } = useAuthStore();
  const toast    = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  /* ── Step 1: credentials ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result?.requiresOtp) {
        setPendingUserId(result.pendingUserId);
        setMaskedEmail(result.maskedEmail);
        setStep('otp');
        toast.info(`تم إرسال رمز التحقق إلى ${result.maskedEmail}`);
      } else {
        toast.success('تم تسجيل الدخول بنجاح! 👋');
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: OTP ── */
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('أدخل الرمز كاملاً (6 أرقام)'); return; }
    setLoading(true);
    try {
      await loginWithOtp(pendingUserId, code);
      toast.success('تم التحقق وتسجيل الدخول بنجاح! 👋');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'رمز التحقق غير صحيح');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const Logo = () => (
    <div className="text-center mb-8">
      <Link to="/" className="inline-flex items-center gap-2">
        <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-400/30">
          <Store className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-primary-400 font-arabic">سوق</span>
      </Link>
    </div>
  );

  /* ── OTP screen ── */
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Logo />
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-100 dark:border-[#2E2E2E] p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">التحقق من الهوية</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-2">
                تم اكتشاف تسجيل دخول من موقع جديد
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-arabic mt-1">
                أرسلنا رمز تحقق مكوّن من 6 أرقام إلى
              </p>
              <p className="font-bold text-primary-600 mt-1 font-mono">{maskedEmail}</p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP boxes */}
              <div className="flex justify-center gap-3" onPaste={handleOtpPaste} dir="ltr">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-all font-mono bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 ${
                      digit
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] focus:border-primary-400'
                    }`}
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length < 6}
                className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري التحقق...</>
                  : 'تأكيد الرمز'}
              </button>
            </form>

            <button
              onClick={() => { setStep('creds'); setOtp(['', '', '', '', '', '']); }}
              className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-arabic transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              العودة وإعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Credentials screen ── */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic text-center mb-2">مرحباً بعودتك 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 font-arabic text-center mb-8">سجّل دخولك للمتابعة</p>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-100 dark:border-[#2E2E2E] p-8">
          <SocialAuthButtons mode="login" />

          <form onSubmit={handleSubmit} className="space-y-5 mt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
                اسم المستخدم أو البريد الإلكتروني
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-arabic transition-all"
                autoComplete="username"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic">كلمة المرور</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline font-arabic">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-arabic transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary-400/20"
            >
              {loading
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الدخول...</>
                : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                سجّل الآن مجاناً
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
