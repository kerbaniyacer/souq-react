import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, User, Box } from 'lucide-react';
import api from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';

export default function AdminAppeals() {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [processing, setProcessing] = useState(false);
  const toast = useToast();

  const fetchAppeals = () => {
    setLoading(true);
    api.get('/auth/admin/appeals/')
      .then(res => setAppeals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppeals();
  }, []);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (!selectedAppeal) return;
    setProcessing(true);
    try {
      await api.post(`/auth/admin/appeals/${selectedAppeal.id}/manage/`, {
        status,
        admin_response: response
      });
      toast.success(`تم ${status === 'approved' ? 'قبول' : 'رفض'} الطعن بنجاح`);
      setSelectedAppeal(null);
      setResponse('');
      fetchAppeals();
    } catch (err: any) {
      toast.error('تعذر معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
     return <div className="p-10 text-center"><span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin inline-block" /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">إدارة طعون المستخدمين</h1>
        <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/10 text-primary-600 rounded-xl text-sm font-arabic border border-primary-100">
           {appeals.filter(a => a.status === 'pending').length} طعون قيد الانتظار
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {appeals.length === 0 ? (
            <div className="p-20 text-center bg-gray-50 dark:bg-gray-800/10 rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-arabic">لا يوجد طعون للمراجعة حالياً.</p>
            </div>
          ) : (
            appeals.map((appeal) => (
              <button
                key={appeal.id}
                onClick={() => setSelectedAppeal(appeal)}
                className={`w-full text-right p-6 bg-white dark:bg-[#1A1A1A] rounded-2xl border transition-all ${
                  selectedAppeal?.id === appeal.id 
                    ? 'border-primary-400 ring-4 ring-primary-400/5' 
                    : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {appeal.target_type === 'account' ? (
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-500">
                        <User size={20} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-orange-500">
                        <Box size={20} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic">{appeal.target_name}</h3>
                      <p className="text-[10px] text-gray-400 font-mono">{appeal.appeal_id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-arabic font-bold ${
                    appeal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    appeal.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {appeal.status === 'pending' ? 'قيد الانتظار' : appeal.status === 'approved' ? 'مقبول' : 'مرفوض'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic truncate">
                  {appeal.reason}
                </p>
                <div className="mt-3 text-[10px] text-gray-400 flex items-center gap-2">
                   <Clock size={12} /> {new Date(appeal.created_at).toLocaleString('ar-DZ')}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Panel */}
        <div className="lg:col-span-1">
          {selectedAppeal ? (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6">تفاصيل الطعن</h2>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase font-arabic">مقدم الطلب</label>
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-arabic">{selectedAppeal.user_email}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase font-arabic">سبب الطعن</label>
                  <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800/20 rounded-xl text-sm text-gray-600 dark:text-gray-300 font-arabic leading-relaxed">
                    {selectedAppeal.reason}
                  </div>
                </div>
              </div>

              {selectedAppeal.status === 'pending' ? (
                <div className="space-y-4">
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="رد الإدارة على المشتري..."
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800/40 border-none rounded-2xl text-sm font-arabic outline-none focus:ring-2 focus:ring-primary-400/20 shadow-inner"
                    rows={4}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDecision('approved')}
                      disabled={processing}
                      className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl font-arabic transition-all flex items-center justify-center gap-2"
                    >
                      {processing ? '...' : <CheckCircle size={18} />} قبول
                    </button>
                    <button
                      onClick={() => handleDecision('rejected')}
                      disabled={processing}
                      className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl font-arabic transition-all flex items-center justify-center gap-2"
                    >
                      {processing ? '...' : <XCircle size={18} />} رفض
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl">
                  <p className="text-xs font-bold text-gray-400 font-arabic mb-2">الرد المسجل:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-arabic italic">
                    {selectedAppeal.admin_response || 'لا يوجد رد نصي'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2rem] p-8 text-center bg-gray-50/50 dark:bg-gray-900/10">
              <p className="text-sm text-gray-400 font-arabic">حدد طعناً من القائمة لبدء المراجعة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
