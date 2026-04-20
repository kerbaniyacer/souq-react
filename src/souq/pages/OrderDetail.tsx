import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Package, Star, Upload, Trash2, Camera, CreditCard, Clock } from 'lucide-react';
import { ordersApi } from '@souq/services/api';
import api from '@souq/services/authService';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import type { Order } from '@souq/types';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:    { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'تم التأكيد',   color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-700' },
  shipped:    { label: 'تم الشحن',      color: 'bg-indigo-100 text-indigo-700' },
  delivered:  { label: 'تم التسليم',    color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'ملغى',          color: 'bg-red-100 text-red-700' },
  returned:   { label: 'مُرجَع',         color: 'bg-gray-100 text-gray-700' },
};

const paymentLabels: Record<string, string> = {
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة بنكية',
  ccp: 'بريد الجزائر (CCP)',
  apple_pay: 'Apple Pay',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { user } = useAuthStore();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingType, setRatingType] = useState<'seller' | 'buyer' | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  
  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>('');
  const [transactionId, setTransactionId] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    if (!id) return;
    ordersApi.detail(Number(id))
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRatingSubmit = async () => {
    if (!ratingType || !order) return;
    setSubmittingRating(true);
    try {
      const endpoint = ratingType === 'seller' ? '/reviews/seller/' : '/reviews/buyer/';
      await api.post(endpoint, {
        order: order.id,
        rating: ratingValue,
        comment: ratingComment
      });
      toast.success('شكرًا لتقييمك!');
      setIsRatingModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'تعذّر إرسال التقييم');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleReceiptUpload = async () => {
    if (!id || (!receiptImage && !transactionId)) return;
    setUploadingReceipt(true);
    const formData = new FormData();
    if (receiptImage) formData.append('receipt_image', receiptImage);
    if (transactionId) formData.append('transaction_id', transactionId);

    try {
      const res = await ordersApi.uploadReceipt(id, formData);
      setOrder(res.data);
      toast.success('تم رفع وصل الدفع بنجاح. سيتم التحقق منه قريباً.');
      setReceiptImage(null);
      setReceiptPreview('');
    } catch {
      toast.error('حدث خطأ أثناء رفع الوصل');
    } finally {
      setUploadingReceipt(false);
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
        <Link to="/orders" className="mt-4 inline-block text-primary-600 font-arabic">← العودة للطلبات</Link>
      </div>
    );
  }

  const status = statusLabels[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 dark:text-gray-500 mb-8">
        <Link to="/orders" className="hover:text-primary-600 transition-colors">طلباتي</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-400">#{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">طلب #{order.order_number}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-arabic mt-1">
              {new Date(order.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium font-arabic ${status.color}`}>
              {status.label}
            </span>
            {order.status === 'delivered' && (
              <>
                {/* Logic to show correct button based on whether user is buyer or seller */}
                {String(order.user) === String(user?.id) && (
                  <button 
                    onClick={() => { setRatingType('seller'); setIsRatingModalOpen(true); }}
                    className="text-xs px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 rounded-lg font-arabic hover:bg-orange-100 transition-colors"
                  >
                    تقييم التاجر
                  </button>
                )}
                {/* For simplicity we assume if they can see /merchant/orders/:id they are a seller for this order */}
                {window.location.pathname.includes('/merchant/') && (
                  <button 
                    onClick={() => { setRatingType('buyer'); setIsRatingModalOpen(true); }}
                    className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 rounded-lg font-arabic hover:bg-blue-100 transition-colors"
                  >
                    تقييم المشتري
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">طريقة الدفع</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic mt-1 flex items-center gap-2">
              {paymentLabels[order.payment_method] ?? order.payment_method}
              {order.payment_method === 'ccp' && !order.receipt_image && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </p>
          </div>
          {order.tracking_number && (
            <div>
              <p className="text-gray-400 dark:text-gray-500 font-arabic">رقم التتبع</p>
              <p className="font-mono font-medium text-gray-800 dark:text-gray-200 mt-1">{order.tracking_number}</p>
            </div>
          )}
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">حالة الدفع</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic mt-1">
              {order.payment_status === 'paid' ? '✅ مدفوع' : '⏳ قيد الانتظار'}
            </p>
          </div>
        </div>
      </div>

      {/* CCP Payment Instruction & Upload */}
      {order.payment_method === 'ccp' && order.payment_status !== 'paid' && (
        <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl p-6 mb-5">
           <h3 className="font-bold text-primary-900 dark:text-primary-100 font-arabic mb-3 flex items-center gap-2">
             <CreditCard className="w-5 h-5" /> تعليمات الدفع (بريد الجزائر)
           </h3>
           <div className="space-y-3 mb-6 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-primary-200/30">
              <div className="flex justify-between items-center text-sm font-arabic">
                 <span className="text-gray-500 dark:text-gray-400">اسم المستفيد</span>
                 <span className="font-bold text-gray-900 dark:text-gray-100">سوق ديزاد (SOUQ DZ)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                 <span className="text-gray-500 dark:text-gray-400 font-arabic">رقم الحساب (CCP)</span>
                 <span className="font-mono font-bold text-primary-600">0024567891 / المفتاح: 45</span>
              </div>
           </div>

           {!order.receipt_image ? (
             <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic">يرجى رفع صورة وصل الدفع أو إدخال رقم العملية لتأكيد طلبك:</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="رقم العملة (Transaction ID)"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800/40 bg-white dark:bg-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-mono"
                    />
                  </div>
                  <div className="shrink-0">
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#1A1A1A] border border-primary-200 dark:border-primary-800/40 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202020] transition-colors">
                       <Camera className="w-4 h-4 text-primary-500" />
                       <span className="text-sm font-arabic text-gray-700 dark:text-gray-300">ارفق الوصل</span>
                       <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setReceiptImage(file);
                              setReceiptPreview(URL.createObjectURL(file));
                            }
                          }}
                       />
                    </label>
                  </div>
                </div>

                {receiptPreview && (
                  <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 mt-2">
                    <img src={receiptPreview} className="w-full h-full object-contain" />
                    <button 
                      onClick={() => { setReceiptImage(null); setReceiptPreview(''); }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleReceiptUpload}
                  disabled={uploadingReceipt || (!receiptImage && !transactionId)}
                  className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl font-arabic hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                   {uploadingReceipt ? (
                     <><Clock className="w-5 h-5 animate-spin" /> جاري الرفع...</>
                   ) : (
                     <><Upload className="w-5 h-5" /> تأكيد الدفع</>
                   )}
                </button>
             </div>
           ) : (
             <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 p-4 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-green-800 dark:text-green-200 font-arabic">تم رفع الطلب بنجاح</p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-arabic mt-0.5">سجلنا بيانات الدفع الخاصة بك. سيقوم فريقنا بمراجعة الوصل خلال 24 ساعة.</p>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Items */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">المنتجات</h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-0.5">الكمية: {item.quantity}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 dark:text-gray-200 font-mono text-sm">{Number(item.subtotal).toLocaleString('ar-DZ')} دج</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{Number(item.product_price).toLocaleString('ar-DZ')} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2 space-y-2">
          <div className="flex justify-between text-sm font-arabic">
            <span className="text-gray-500 dark:text-gray-400">المجموع الفرعي</span>
            <span className="font-mono">{Number(order.subtotal).toLocaleString('ar-DZ')} دج</span>
          </div>
          <div className="flex justify-between text-sm font-arabic">
            <span className="text-gray-500 dark:text-gray-400">الشحن</span>
            <span className={`font-mono ${Number(order.shipping_cost) === 0 ? 'text-green-600' : ''}`}>
              {Number(order.shipping_cost) === 0 ? 'مجاني' : `${Number(order.shipping_cost).toLocaleString('ar-DZ')} دج`}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm font-arabic">
              <span className="text-gray-500 dark:text-gray-400">الخصم</span>
              <span className="text-green-600 font-mono">-{Number(order.discount).toLocaleString('ar-DZ')} دج</span>
            </div>
          )}
          <div className="flex justify-between font-bold font-arabic border-t border-gray-100 dark:border-gray-800 pt-2">
            <span>الإجمالي</span>
            <span className="text-primary-600 font-mono text-lg">{Number(order.total_amount).toLocaleString('ar-DZ')} دج</span>
          </div>
        </div>
      </div>

      {/* Shipping info */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">معلومات التوصيل</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'المستلم', value: order.full_name },
            { label: 'الهاتف', value: order.phone, mono: true },
            { label: 'طريقة الدفع', value: order.payment_method },
            { label: 'الولاية', value: order.wilaya },
            { label: 'البلدية', value: order.baladia },
            { label: 'العنوان', value: order.address },
          ].map((f) => f.value && (
            <div key={f.label}>
              <span className="text-gray-400 dark:text-gray-500 font-arabic block mb-0.5">{f.label}</span>
              <span className={`font-medium text-gray-800 ${f.mono ? 'font-mono' : 'font-arabic'}`}>{f.value}</span>
            </div>
          ))}
          {order.notes && (
            <div className="sm:col-span-2">
              <span className="text-gray-400 dark:text-gray-500 font-arabic block mb-0.5">ملاحظات</span>
              <span className="font-arabic text-gray-700 dark:text-gray-300">{order.notes}</span>
            </div>
          )}
        </div>
      </div>
      {/* Rating Modal */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <div className="p-6">
               <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2 text-center">
                 {ratingType === 'seller' ? 'تقييم التاجر' : 'تقييم المشتري'}
               </h3>
               <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm mb-6 text-center">
                 رأيك يهمنا ويساعد في تحسين جودة مجتمع سوق.
               </p>
               
               <div className="flex justify-center gap-2 mb-8">
                 {[1, 2, 3, 4, 5].map((s) => (
                   <button 
                      key={s} 
                      onClick={() => setRatingValue(s)}
                      className="transition-transform hover:scale-110"
                   >
                     <Star 
                        className={`w-10 h-10 ${s <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-800'}`} 
                     />
                   </button>
                 ))}
               </div>

               <div>
                 <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 font-arabic mb-2 uppercase tracking-wider">تعليقك (اختياري)</label>
                 <textarea 
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="اكتب شيئاً عن تجربتك..."
                    className="w-full h-24 bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-[#2E2E2E] rounded-xl p-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm resize-none"
                 />
               </div>
             </div>
             
             <div className="p-6 bg-gray-50 dark:bg-[#252525] border-t border-gray-100 dark:border-[#2E2E2E] flex gap-3">
               <button 
                  onClick={handleRatingSubmit}
                  disabled={submittingRating}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-arabic font-bold transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50">
                 {submittingRating ? 'جاري الإرسال...' : 'إرسال التقييم'}
               </button>
               <button 
                  onClick={() => setIsRatingModalOpen(false)}
                  className="flex-1 bg-white dark:bg-[#1E1E1E] text-gray-600 dark:text-gray-400 py-3 rounded-xl font-arabic font-bold border border-gray-200 dark:border-[#2E2E2E] hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                 إلغاء
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
