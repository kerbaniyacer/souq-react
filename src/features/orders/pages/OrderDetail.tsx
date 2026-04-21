import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Package, Upload, Trash2, Camera, CreditCard, Clock, Store } from 'lucide-react';
import { ordersApi } from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';
import type { Order } from '@shared/types';

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
  baridimob: 'بريدي موب (BaridiMob)',
  apple_pay: 'Apple Pay',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  
  // Per-seller upload states
  const [sellerFiles, setSellerFiles] = useState<Record<number, { file: File, preview: string }>>({});
  const [sellerTxInfo, setSellerTxInfo] = useState<Record<number, { tid: string, amount: string }>>({});
  const [uploadingSellers, setUploadingSellers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!id) return;
    ordersApi.detail(Number(id))
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReceiptUpload = async (sellerId: number) => {
    if (!id || !sellerFiles[sellerId]) {
      toast.error('يرجى ارفاق صورة الوصل');
      return;
    }

    setUploadingSellers(prev => ({ ...prev, [sellerId]: true }));
    
    const formData = new FormData();
    formData.append('image', sellerFiles[sellerId].file);
    formData.append('seller_id', sellerId.toString());
    
    const txInfo = sellerTxInfo[sellerId];
    if (txInfo?.tid) formData.append('transaction_id', txInfo.tid);
    if (txInfo?.amount) formData.append('amount', txInfo.amount);

    try {
      const res = await ordersApi.uploadProof(id, formData);
      setOrder(res.data);
      toast.success('تم رفع وصل الدفع بنجاح لهذا البائع.');
      
      // Clear specific seller state
      setSellerFiles(prev => {
        const next = { ...prev };
        delete next[sellerId];
        return next;
      });
      setSellerTxInfo(prev => {
        const next = { ...prev };
        delete next[sellerId];
        return next;
      });
    } catch {
      toast.error('حدث خطأ أثناء رفع الوصل');
    } finally {
      setUploadingSellers(prev => ({ ...prev, [sellerId]: false }));
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

  // Group items by seller
  const sellerGroups = order.items.reduce((acc, item) => {
    const sId = item.seller_id;
    if (!acc[sId]) {
      acc[sId] = {
        id: sId,
        name: item.seller_name || 'بائع غير معروف',
        items: [],
        total: 0,
        ccp_number: (item as any).ccp_number,
        ccp_name: (item as any).ccp_name,
        baridimob_id: (item as any).baridimob_id,
      };
    }
    acc[sId].items.push(item);
    acc[sId].total += Number(item.subtotal);
    return acc;
  }, {} as Record<number, any>);

  const status = statusLabels[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 dark:text-gray-500 mb-8">
        <Link to="/orders" className="hover:text-primary-600 transition-colors">طلباتي</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-400">#{order.order_number}</span>
      </div>

      {/* Header Summary */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">طلب #{order.order_number}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-arabic mt-1">
              {new Date(order.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium font-arabic ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">طريقة الدفع</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic mt-1">{paymentLabels[order.payment_method] ?? order.payment_method}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">حالة الدفع العامة</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic mt-1">
              {order.payment_status === 'paid' ? '✅ تم دفع الكل' : 
               order.payment_status === 'proof_uploaded' ? '⏳ في انتظار المراجعة' :
               order.payment_status === 'rejected' ? '❌ مرفوض جزئياً' : '⏳ دفع معلق'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">الإجمالي الكلي</p>
            <p className="font-bold text-primary-600 font-mono mt-1">{Number(order.total_amount).toLocaleString('ar-DZ')} دج</p>
          </div>
        </div>
      </div>

      {/* Seller-Specific Groups */}
      <div className="space-y-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic flex items-center gap-3">
          <Package className="w-6 h-6 text-primary-500" /> تقسيم الطلبية حسب البائعين
        </h2>

        {Object.values(sellerGroups).map((group: any) => {
          const sellerProof = order.proofs?.find(p => p.seller === group.id);
          
          return (
            <div key={group.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              {/* Seller Header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic">{group.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic">منتجات من هذا التاجر</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">مجموع التاجر</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 font-mono">{Number(group.total).toLocaleString('ar-DZ')} دج</p>
                </div>
              </div>

              <div className="p-6">
                {/* Items in this group */}
                <div className="space-y-4 mb-8">
                  {group.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 py-2 opacity-80">
                      <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-300">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 font-arabic">{item.product_name}</p>
                        <p className="text-xs text-gray-500 font-arabic mt-0.5">الكمية: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800 dark:text-gray-200 font-mono text-xs">{Number(item.subtotal).toLocaleString('ar-DZ')} دج</p>
                    </div>
                  ))}
                </div>

                {/* Payment Section for this seller */}
                {(order.payment_method === 'ccp' || order.payment_method === 'baridimob') && (
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                    {sellerProof?.status === 'approved' ? (
                      <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 p-4 rounded-2xl flex items-center gap-4">
                        <ShieldCheck className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="text-sm font-bold text-green-800 dark:text-green-200 font-arabic">تم تأكيد الدفع لهذا البائع</p>
                          <p className="text-xs text-green-600 dark:text-green-400 font-arabic mt-1">التاجر راجع الوصل وأكد استلام المبلغ.</p>
                        </div>
                      </div>
                    ) : sellerProof?.status === 'pending' ? (
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-4 rounded-2xl flex items-center gap-4">
                        <Clock className="w-8 h-8 text-blue-500 animate-pulse" />
                        <div>
                          <p className="text-sm font-bold text-blue-800 dark:text-blue-200 font-arabic">في انتظار المراجعة</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-arabic mt-1">لقد أرسلت الوصل، البائع يقوم حالياً بالتحقق منه.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="w-4 h-4 text-primary-500" />
                          <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic">تعليمات دفع الحساب الشخصي للبائع</h4>
                        </div>
                        
                        {/* Bank Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-arabic uppercase">رقم الحساب (CCP)</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono mt-1">{group.ccp_number || 'غير متوفر'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-arabic uppercase">الاسم الكامل</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic mt-1">{group.ccp_name || 'غير متوفر'}</p>
                          </div>
                          <div className="sm:col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-arabic uppercase">RIP / BaridiMob</p>
                            <p className="text-sm font-bold text-primary-600 font-mono mt-1">{group.baridimob_id || 'غير متوفر'}</p>
                          </div>
                        </div>

                        {sellerProof?.status === 'rejected' && (
                          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">
                            <p className="text-xs font-bold text-red-600 font-arabic mb-1">الوصل مرفوض من البائع:</p>
                            <p className="text-xs text-red-700 dark:text-red-400 font-arabic leading-relaxed">{sellerProof.rejection_reason}</p>
                          </div>
                        )}

                        {/* Upload Form */}
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <input 
                              type="text" 
                              placeholder="رقم العملية"
                              value={sellerTxInfo[group.id]?.tid || ''}
                              onChange={(e) => setSellerTxInfo(p => ({ ...p, [group.id]: { ...p[group.id], tid: e.target.value } }))}
                              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-xs font-mono"
                            />
                            <input 
                              type="number" 
                              placeholder="المبلغ المدفوع"
                              value={sellerTxInfo[group.id]?.amount || ''}
                              onChange={(e) => setSellerTxInfo(p => ({ ...p, [group.id]: { ...p[group.id], amount: e.target.value } }))}
                              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-xs font-mono"
                            />
                          </div>

                          <label className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:border-primary-400 transition-colors">
                            <div className="flex items-center gap-3">
                              <Camera className="w-5 h-5 text-gray-400" />
                              <span className="text-xs font-arabic text-gray-500">
                                {sellerFiles[group.id] ? sellerFiles[group.id].file.name : 'ارفق صورة الوصل (Reçu)'}
                              </span>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSellerFiles(prev => ({ 
                                    ...prev, 
                                    [group.id]: { file, preview: URL.createObjectURL(file) } 
                                  }));
                                }
                              }}
                            />
                            {sellerFiles[group.id] && (
                              <button onClick={(e) => { e.preventDefault(); setSellerFiles(p => { const n = {...p}; delete n[group.id]; return n; }); }} className="text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </label>

                          <button
                            onClick={() => handleReceiptUpload(group.id)}
                            disabled={uploadingSellers[group.id] || !sellerFiles[group.id]}
                            className="w-full py-3 bg-primary-600 text-white rounded-xl font-arabic font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {uploadingSellers[group.id] ? <Clock className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            إرسال إثبات الدفع لهذا التاجر
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shipping General Info */}
      <div className="mt-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6">معلومات التوصيل والعنوان</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
          {[
            { label: 'المستلم', value: order.full_name },
            { label: 'الهاتف', value: order.phone, mono: true },
            { label: 'الولاية', value: order.wilaya },
            { label: 'البلدية', value: order.baladia },
            { label: 'العنوان', value: order.address },
          ].map((f) => f.value && (
            <div key={f.label}>
              <span className="text-gray-400 dark:text-gray-500 font-arabic block mb-1">{f.label}</span>
              <span className={`font-semibold text-gray-800 dark:text-gray-200 ${f.mono ? 'font-mono' : 'font-arabic'}`}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShieldCheck(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
