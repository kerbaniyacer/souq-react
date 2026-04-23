import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Package, ChevronLeft, User, Phone, MapPin, CreditCard, CheckCircle, Eye, XCircle, AlertCircle, Calendar, Hash, DollarSign } from 'lucide-react';
import { useToast } from '@shared/stores/toastStore';
import type { OrderStatus } from '@shared/types';
import { ordersApi, chatApi } from '@shared/services/api';

const statusConfig: Record<string, { label: string; color: string; next?: OrderStatus }> = {
  pending:    { label: 'معلّق',         color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',    next: 'confirmed' },
  confirmed:  { label: 'مؤكّد',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',          next: 'processing' },
  processing: { label: 'جاري التجهيز',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',  next: 'shipped' },
  shipped:    { label: 'تم الشحن',       color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',  next: 'delivered' },
  delivered:  { label: 'تم التسليم',     color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  cancelled:  { label: 'ملغى',           color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  returned:   { label: 'مُرجَع',          color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending:        { label: 'في انتظار الدفع', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  proof_uploaded: { label: 'تم رفع الوصل',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  paid:           { label: 'مدفوع',            color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  rejected:       { label: 'مرفوض',            color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  failed:         { label: 'فشل',              color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
};

const paymentLabels: Record<string, string> = {
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة بنكية',
  ccp: 'بريد الجزائر (CCP)',
  baridimob: 'بريدي موب (BaridiMob)',
  apple_pay: 'Apple Pay',
};

import { useMerchantOrderDetail, useUpdateOrderStatus, useApprovePaymentProof, useRejectPaymentProof } from '../hooks/useMerchantData';

export default function MerchantOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading: loading } = useMerchantOrderDetail(id || '');
  const updateStatus = useUpdateOrderStatus();
  const approveProof = useApprovePaymentProof();
  const rejectProof = useRejectPaymentProof();

  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [rejectProofId, setRejectProofId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const toast = useToast();

  const updating = updateStatus.isPending || approveProof.isPending || rejectProof.isPending;

  const handleNextStatus = async () => {
    if (!order) return;
    const nextStatus = statusConfig[order.status]?.next;
    if (!nextStatus) return;
    
    try {
      await updateStatus.mutateAsync({ id: order.id, status: nextStatus });
      toast.success(`✅ تم تحديث الحالة إلى: ${statusConfig[nextStatus].label}`);
    } catch {
      toast.error('تعذّر تحديث الحالة');
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    try {
      await updateStatus.mutateAsync({ id: order.id, status: 'cancelled' });
      toast.success('تم إلغاء الطلب');
    } catch {
      toast.error('تعذّر إلغاء الطلب');
    }
  };

  const handleApproveProof = async (proofId: number) => {
    try {
      await approveProof.mutateAsync(proofId);
      toast.success('✅ تم تأكيد الدفع بنجاح');
      // Notify customer via chat
      if (order) {
        (async () => {
          try {
            const { data: conversations } = await chatApi.getConversations();
            const buyerUsername = (order as any).buyer_username || (order as any).user?.username;
            const buyerId = (order as any).user?.id || (order as any).buyer?.id;
            
            const conv = conversations.find((c: any) => 
              (buyerUsername && (c.customer_details?.username === buyerUsername || c.seller_details?.username === buyerUsername)) ||
              (buyerId && (c.customer === buyerId || c.seller === buyerId))
            );
            if (conv) {
              await chatApi.sendMessage(conv.id, `✅ تم تأكيد الدفع للطلب رقم #${order.order_number}. يمكنك الآن متابعة حالة طلبك.`);
            }
          } catch (e) {
            console.error('Chat notification failed:', e);
          }
        })();
      }
    } catch {
      toast.error('تعذّر تأكيد الدفع');
    }
  };

  const handleRejectProof = async () => {
    if (!rejectProofId || !rejectionReason.trim()) return;
    try {
      await rejectProof.mutateAsync({ proofId: rejectProofId, reason: rejectionReason });
      toast.success('❌ تم رفض الدفع');
      // Notify customer via chat
      if (order) {
        (async () => {
          try {
            const { data: conversations } = await chatApi.getConversations();
            const buyerUsername = (order as any).buyer_username || (order as any).user?.username;
            const buyerId = (order as any).user?.id || (order as any).buyer?.id;

            const conv = conversations.find((c: any) => 
              (buyerUsername && (c.customer_details?.username === buyerUsername || c.seller_details?.username === buyerUsername)) ||
              (buyerId && (c.customer === buyerId || c.seller === buyerId))
            );
            if (conv) {
              await chatApi.sendMessage(conv.id, `❌ تم رفض وصل الدفع للطلب رقم #${order.order_number}.\nالسبب: ${rejectionReason}\nيرجى إعادة رفع وصل صحيح.`);
            }
          } catch (e) {
            console.error('Chat notification failed:', e);
          }
        })();
      }
      setRejectProofId(null);
      setRejectionReason('');
    } catch {
      toast.error('تعذّر رفض الدفع');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl w-48" />
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 font-arabic">الطلب غير موجود</p>
        <Link to="/merchant/orders" className="mt-4 inline-block text-primary-600 font-arabic">← العودة لإدارة الطلبات</Link>
      </div>
    );
  }

  const cfg = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
  const pCfg = paymentStatusConfig[order.payment_status] ?? { label: order.payment_status, color: 'bg-gray-100 text-gray-700' };
  const nextStatus = statusConfig[order.status]?.next;
  const latestProof = order.proofs?.length > 0 ? order.proofs[0] : null;
  const merchantSubtotal = order.subtotal;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 dark:text-gray-500 mb-8">
        <Link to="/merchant/orders" className="hover:text-primary-600 transition-colors flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" />
          إدارة الطلبات
        </Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-300 font-mono">#{order.order_number}</span>
      </div>

      {/* Header + Status */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
              طلب #{order.order_number}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-arabic mt-1">
              {new Date(order.created_at).toLocaleDateString('ar-DZ', {
                year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium font-arabic ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-arabic tracking-wide uppercase ${pCfg.color}`}>
              {pCfg.label}
            </span>
          </div>
        </div>

        {/* Status Actions */}
        {order.status !== 'cancelled' && order.status !== 'returned' && (
          <div className="flex gap-3 flex-wrap pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
            {nextStatus && (
              <button
                onClick={handleNextStatus}
                disabled={updating}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-arabic font-bold rounded-xl transition-all disabled:opacity-50"
              >
                {updating
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <CheckCircle className="w-4 h-4" />
                }
                تحديث إلى: {statusConfig[nextStatus]?.label}
              </button>
            )}
            {order.status !== 'delivered' && (
              <button
                onClick={handleCancel}
                disabled={updating}
                className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/40 text-sm font-arabic font-bold rounded-xl transition-all hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                إلغاء الطلب
              </button>
            )}
          </div>
        )}
      </div>

      {/* NEW: Payment Proof Management Card */}
      {(order.payment_method === 'ccp' || order.payment_method === 'baridimob') && latestProof && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden mb-5">
           <div className="p-5 border-b border-gray-50 dark:border-[#202020] bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-500" /> إثبات الدفع
              </h3>
              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold font-arabic ${
                 latestProof.status === 'approved' ? 'bg-green-100 text-green-700' :
                 latestProof.status === 'rejected' ? 'bg-red-100 text-red-700' :
                 'bg-amber-100 text-amber-700'
              }`}>
                {latestProof.status === 'approved' ? 'مقبول' : 
                 latestProof.status === 'rejected' ? 'مرفوض' : 
                 'قيد المراجعة'}
              </span>
           </div>
           
           <div className="p-5 flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                 <div className="relative group cursor-zoom-in aspect-[3/4] rounded-xl overflow-hidden border border-gray-100 dark:border-[#2E2E2E] shadow-sm" onClick={() => setZoomImage(latestProof.image)}>
                    <img src={latestProof.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="الوصل" />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute bottom-3 right-3 p-2 bg-white/90 dark:bg-[#1A1A1A]/90 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                       <Eye className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </div>
                 </div>
              </div>
              
              <div className="flex-1 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50/80 dark:bg-[#202020] rounded-xl border border-gray-100 dark:border-[#2E2E2E]">
                       <p className="text-[10px] text-gray-400 font-arabic mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> رقم العملية</p>
                       <p className="font-mono font-bold text-sm text-gray-800 dark:text-gray-200">{latestProof.transaction_id || 'غير متوفر'}</p>
                    </div>
                    <div className="p-3 bg-gray-50/80 dark:bg-[#202020] rounded-xl border border-gray-100 dark:border-[#2E2E2E]">
                       <p className="text-[10px] text-gray-400 font-arabic mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> المبلغ</p>
                       <p className="font-bold text-sm text-primary-600">{latestProof.amount ? `${Number(latestProof.amount).toLocaleString('ar-DZ')} دج` : 'غير محدد'}</p>
                    </div>
                 </div>
                 
                 <div className="p-3 bg-gray-50/80 dark:bg-[#202020] rounded-xl border border-gray-100 dark:border-[#2E2E2E]">
                    <p className="text-[10px] text-gray-400 font-arabic mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> وقت الرفع</p>
                    <p className="text-xs font-arabic font-medium text-gray-700 dark:text-gray-300">
                       {new Date(latestProof.created_at).toLocaleString('ar-DZ')}
                    </p>
                 </div>

                 {latestProof.status === 'rejected' && latestProof.rejection_reason && (
                    <div className="p-3 bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                       <p className="text-[10px] text-red-500 font-arabic mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> سبب الرفض السابق</p>
                       <p className="text-xs font-arabic text-red-700 dark:text-red-400">{latestProof.rejection_reason}</p>
                    </div>
                 )}

                 {latestProof.status === 'pending' && (
                    <div className="flex gap-3 pt-2">
                       <button 
                          onClick={() => handleApproveProof(latestProof.id)}
                          disabled={updating}
                          className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-arabic font-bold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                       >
                          {updating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          تأكيد الدفع
                       </button>
                       <button 
                          onClick={() => setRejectProofId(latestProof.id)}
                          disabled={updating}
                          className="flex-1 py-2.5 bg-white dark:bg-[#1A1A1A] text-red-600 border border-red-200 dark:border-red-900/30 rounded-xl text-sm font-arabic font-bold transition-all hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2"
                       >
                          <XCircle className="w-4 h-4" />
                          رفض الوصل
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Customer Info */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-500" /> معلومات العميل
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { icon: User, label: 'الاسم', value: order.full_name },
            { icon: Phone, label: 'الهاتف', value: order.phone, mono: true },
            { icon: MapPin, label: 'الولاية', value: order.wilaya },
            { icon: MapPin, label: 'البلدية', value: order.baladia },
            { icon: MapPin, label: 'العنوان', value: order.address },
            { icon: CreditCard, label: 'طريقة الدفع', value: paymentLabels[order.payment_method] ?? order.payment_method },
          ].map((f, i) => f.value && (
            <div key={i} className="flex items-start gap-3">
              <f.icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 dark:text-gray-500 font-arabic text-xs">{f.label}</p>
                <p className={`font-medium text-gray-800 dark:text-gray-200 mt-0.5 ${f.mono ? 'font-mono' : 'font-arabic'}`}>{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-primary-500" /> المنتجات
        </h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 dark:border-[#2E2E2E] last:border-0">
              <div className="w-14 h-14 bg-gray-50 dark:bg-[#252525] rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-0.5">الكمية: {item.quantity}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 dark:text-gray-200 font-mono text-sm">
                  {Number(item.subtotal).toLocaleString('ar-DZ')} دج
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 dark:border-[#2E2E2E] pt-4 mt-2 space-y-2">
          <div className="flex justify-between font-bold font-arabic border-t border-gray-100 dark:border-[#2E2E2E] pt-2">
            <span>مجموع حصتي من الطلب</span>
            <span className="text-primary-600 font-mono text-lg">{Number(merchantSubtotal).toLocaleString('ar-DZ')} دج</span>
          </div>
          <p className="text-[10px] text-gray-400 font-arabic text-left">إجمالي الطلب الكلي (بما في ذلك الشحن وباقي البائعين): {Number(order.total_amount).toLocaleString('ar-DZ')} دج</p>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
         <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setZoomImage(null)}
         >
            <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
               <img src={zoomImage} className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300" alt="Zoom" />
               <button className="absolute top-0 right-0 p-2 text-white/50 hover:text-white transition-colors">
                  <XCircle className="w-10 h-10" />
               </button>
            </div>
         </div>
      )}

      {/* Rejection Modal */}
      {rejectProofId && (
         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
               <div className="p-6">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-600 mb-4 mx-auto">
                     <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic text-center mb-2">رفض إثبات الدفع</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic text-center mb-6">يرجى توضيح سبب رفض الوصل لمساعدة المشتري على تصحيح الخطأ.</p>
                  
                  <textarea 
                     value={rejectionReason}
                     onChange={(e) => setRejectionReason(e.target.value)}
                     placeholder="مثال: المبلغ المحول غير مطابق، الصورة غير واضحة، رقم العملية غير صحيح..."
                     className="w-full h-32 bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#2E2E2E] rounded-2xl p-4 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-red-500/20"
                     autoFocus
                  />
               </div>
               
               <div className="p-4 bg-gray-50/50 dark:bg-gray-800/10 border-t border-gray-100 dark:border-[#2E2E2E] flex gap-3">
                  <button 
                     onClick={handleRejectProof}
                     disabled={updating || !rejectionReason.trim()}
                     className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold font-arabic rounded-xl transition-all disabled:opacity-50"
                  >
                     تأكيد الرفض
                  </button>
                  <button 
                     onClick={() => { setRejectProofId(null); setRejectionReason(''); }}
                     disabled={updating}
                     className="flex-1 py-3 bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#2E2E2E] font-bold font-arabic rounded-xl"
                  >
                     إلغاء
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
