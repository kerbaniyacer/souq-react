import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '@shared/services/api';
import type { Appeal } from '@shared/types';

export default function MyAppeals() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/appeals/list/')
      .then(res => setAppeals(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <span className="w-10 h-10 border-2 border-primary-400 border-t-transparent rounded-full animate-spin inline-block" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">سجل الطعون الخاصة بك</h1>

      {appeals.length === 0 ? (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 font-arabic">ليس لديك أي طعون سابقة.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appeals.map((appeal) => (
            <div key={appeal.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
               <div className="p-6">
                 <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-mono rounded-lg">
                        {appeal.appeal_id}
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic">
                        طعن على {appeal.target_type === 'account' ? 'الحساب' : `المنتج: ${appeal.target_name}`}
                      </h3>
                    </div>
                    
                    <span className={`px-4 py-1.5 rounded-full text-xs font-arabic font-bold flex items-center gap-1.5 ${
                      appeal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      appeal.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {appeal.status === 'pending' && <Clock size={14} />}
                      {appeal.status === 'approved' && <CheckCircle size={14} />}
                      {appeal.status === 'rejected' && <XCircle size={14} />}
                      {appeal.status === 'pending' ? 'قيد المراجعة' : appeal.status === 'approved' ? 'مقبول' : 'مرفوض'}
                    </span>
                 </div>
                 
                 <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic leading-relaxed mb-4">
                   {appeal.reason}
                 </p>

                 {appeal.admin_response && (
                   <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-4 border-r-4 border-primary-400">
                     <p className="text-xs font-bold text-primary-600 dark:text-primary-400 font-arabic mb-1">رد الإدارة:</p>
                     <p className="text-sm text-gray-800 dark:text-gray-200 font-arabic italic">
                       {appeal.admin_response}
                     </p>
                   </div>
                 )}
                 
                 <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>{new Date(appeal.created_at).toLocaleString('ar-DZ')}</span>
                    {appeal.reviewed_at && <span>تمت المراجعة: {new Date(appeal.reviewed_at).toLocaleDateString('ar-DZ')}</span>}
                 </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
