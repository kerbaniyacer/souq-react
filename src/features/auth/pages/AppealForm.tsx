import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, ClipboardList, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@shared/stores/toastStore';
import api from '@shared/services/api';

export default function AppealForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const targetType = searchParams.get('type') || 'account';
  const targetId = searchParams.get('id');
  
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [appealId, setAppealId] = useState('');
  const [targetInfo, setTargetInfo] = useState<{ name: string; reason: string; type: string } | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      if (!targetId) return;
      try {
        const res = await api.get(`/auth/appeals/target-info/?type=${targetType}&id=${targetId}`);
        setTargetInfo(res.data);
      } catch (err) {
        console.error('Error fetching target info:', err);
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [targetId, targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('يرجى شرح سبب التظلم بالتفصيل');
      return;
    }
    if (!targetId) {
      toast.error('لم يتم تحديد الهدف، يرجى استخدام رابط الطعن من الإشعار أو صفحة المنتج');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/appeals/', {
        target_type: targetType,
        target_id: Number(targetId),
        reason: reason
      });
      setAppealId(res.data.appeal_id);
      setIsSuccess(true);
      toast.success('تم إرسال طلب الطعن بنجاح');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'تعذر إرسال الطلب حالياً');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-green-50 dark:bg-green-900/10 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500">
          <CheckCircle2 size={64} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">تم استلام طلبك بنجاح!</h1>
        <p className="text-gray-500 dark:text-gray-400 font-arabic mb-8 leading-relaxed">
          تم تسجيل طلب الطعن الخاص بك تحت الرقم المرجعي: <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{appealId}</span>. 
          سيقوم فريق الإدارة بمراجعة طلبك والرد عليك في أقرب وقت ممكن.
        </p>
        <button
          onClick={() => navigate('/appeals/list')}
          className="bg-primary-400 hover:bg-primary-500 text-white font-bold py-4 px-8 rounded-2xl transition-all font-arabic shadow-lg shadow-primary-400/20"
        >
          متابعة حالة الطعون
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-arabic mb-8 group transition-colors"
      >
        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        العودة
      </button>

      <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-100 dark:border-[#2E2E2E] shadow-xl overflow-hidden p-8 md:p-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/10 rounded-2xl flex items-center justify-center text-primary-400">
            <ClipboardList size={30} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">تقديم طلب طعن</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">اشرح لنا لماذا تعتقد أن تجميد {targetType === 'account' ? 'حسابك' : 'منتجك'} غير صحيح</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 mb-6 flex gap-4">
          <AlertCircle className="text-amber-500 shrink-0" size={24} />
          <div className="text-sm text-amber-700 dark:text-amber-400 font-arabic leading-relaxed">
            ملاحظة: لديك 14 يوماً فقط من تاريخ التجميد لتقديم هذا الطلب. تأكد من إرفاق كافة التفاصيل الضرورية.
          </div>
        </div>

        {loadingInfo ? (
           <div className="p-8 bg-gray-50 dark:bg-[#252525] rounded-3xl mb-8 flex items-center justify-center">
              <span className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
           </div>
        ) : targetInfo && (
          <div className="p-6 bg-gray-50 dark:bg-[#252525] rounded-3xl mb-8 border border-gray-100 dark:border-[#2E2E2E] animate-in slide-in-from-top-4 duration-500">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <p className="text-[10px] text-gray-400 font-arabic mb-1 uppercase tracking-widest">العنصر المقصود</p>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">{targetInfo.name}</h3>
                </div>
                <div className="md:text-left">
                   <p className="text-[10px] text-gray-400 font-arabic mb-1 uppercase tracking-widest">سبب التجميد الإداري</p>
                   <p className="text-sm text-red-600 font-bold font-arabic">{targetInfo.reason || 'مخالفة سياسات المنصة'}</p>
                </div>
             </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-400 dark:text-gray-500 font-arabic mb-3 uppercase tracking-wider">
              سبب التظلم (بالتفصيل)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب هنا بالتفصيل الأسباب التي تجعلنا نعيد النظر في قرار التجميد..."
              rows={8}
              className="w-full px-6 py-5 bg-gray-50 dark:bg-[#252525] border border-transparent focus:border-primary-400 dark:focus:border-primary-500 rounded-3xl text-gray-900 dark:text-gray-100 font-arabic outline-none transition-all resize-none shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-primary-400 hover:bg-primary-500 disabled:opacity-50 text-white font-bold py-5 rounded-[1.5rem] transition-all font-arabic group shadow-xl shadow-primary-400/20"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                إرسال الطلب للمراجعة
                <Send size={20} className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
