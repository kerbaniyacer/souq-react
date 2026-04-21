import { AlertTriangle, Send, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

export default function SuspensionModal({ isOpen, onClose, userId }: Props) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500 shadow-inner">
            <AlertTriangle size={48} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-3">
            🚫 حسابك موقوف
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 font-arabic leading-relaxed mb-8">
            تم تعليق حسابك مؤقتًا بسبب مخالفة لسياسات الاستخدام. 
            إذا كنت ترى أن هذا القرار غير صحيح، يمكنك تقديم طلب طعن رسمي أو التواصل مع الدعم.
          </p>

          <div className="space-y-3">
            <button
               onClick={() => {
                 onClose();
                 navigate(`/appeals/new?type=account&id=${userId}`);
               }}
               className="w-full flex items-center justify-center gap-3 bg-primary-400 hover:bg-primary-500 text-white font-bold py-4 rounded-2xl transition-all font-arabic group shadow-lg shadow-primary-400/20"
            >
              <Send size={20} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              تقديم طلب طعن
            </button>

            <a
              href="mailto:support@souq.dz"
              className="w-full flex items-center justify-center gap-3 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#2E2E2E] text-gray-700 dark:text-gray-300 font-bold py-4 rounded-2xl transition-all font-arabic"
            >
              <Mail size={20} />
              تواصل مع الدعم
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-6 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors font-arabic"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
