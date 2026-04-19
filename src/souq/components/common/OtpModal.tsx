import { useState } from 'react';
import { useToast } from '@souq/stores/toastStore';

interface Props {
  email: string;
  isOpen: boolean;
  onVerify: (otp: string) => Promise<void>;
  onCancel: () => void;
}

export default function OtpModal({ email, isOpen, onVerify, onCancel }: Props) {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('أدخل رمز التحقق المكون من 6 أرقام بصورة صحيحة');
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(otp);
      setOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.message || 'رمز التحقق غير صحيح');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in flip-in-y">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2 text-center">
          التحقق الأمني
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-arabic text-center mb-6 text-sm">
          لاحظنا محاولة دخول من خادم أو حساب جديد. أرسلنا رمز تحقق إلى
          <br />
          <span className="font-semibold text-gray-800 dark:text-gray-200 mt-1 inline-block" dir="ltr">
            {email}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2 text-center">
              أدخل الرمز المكون من 6 أرقام
            </label>
            <input
              type="text"
              dir="ltr"
              value={otp}
              onChange={(e) => {
                const normalized = e.target.value.replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c).toString());
                setOtp(normalized.replace(/\D/g, '').slice(0, 6));
              }}
              className="w-full text-center tracking-[0.5em] text-2xl px-4 py-4 rounded-xl border bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 border-gray-200 dark:border-[#2E2E2E] focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-mono transition-all"
              placeholder="••••••"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 text-gray-700 dark:bg-[#2A2A2A] dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-[#333] transition-colors font-arabic disabled:opacity-60"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || otp.length !== 6}
              className="flex-1 py-3 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-primary-400/20 flex items-center justify-center"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'تحقق الآن'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
