import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, ArrowRight, UserPlus, ShieldCheck, MapPin, ExternalLink } from 'lucide-react';
import { ordersApi } from '@shared/services/api';
import { useAuthStore } from '@features/auth/stores/authStore';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const guestData = location.state || {};

  useEffect(() => {
    ordersApi.detail(Number(id))
      .then(res => setOrder(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Success Hero */}
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-3"
        >
          شكراً لك! تم استلام طلبك بنجاح
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400 font-arabic"
        >
          رقم الطلب الخاص بك هو <span className="font-mono font-bold text-primary-600">#{order?.order_number}</span>
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-sm"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            تفاصيل الطلب
          </h3>
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-arabic">الحالة</span>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold font-arabic">قيد المراجعة</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800/50">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-arabic">طريقة الدفع</span>
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 font-arabic">
                {order?.payment_method === 'cod' ? 'الدفع عند الاستلام' : order?.payment_method}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 font-arabic">المبلغ الإجمالي</span>
              <span className="text-lg font-bold text-primary-600 font-mono">
                {Number(order?.total_amount).toLocaleString('ar-DZ')} دج
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
              <div>
                <p className="text-xs text-gray-400 font-arabic mb-1">عنوان التوصيل</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-arabic leading-relaxed">
                  {order?.full_name}<br />
                  {order?.wilaya}، {order?.baladia}<br />
                  {order?.address}
                </p>
              </div>
            </div>
          </div>

          <Link
            to="/track-order"
            className="mt-8 w-full py-3.5 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all font-arabic"
          >
            تتبع الطلب
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Conversion Card */}
        {!isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-primary-50 dark:bg-primary-900/10 rounded-3xl border-2 border-primary-200 dark:border-primary-800/30 p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <UserPlus className="w-24 h-24 text-primary-600" />
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-bold text-primary-900 dark:text-primary-100 font-arabic mb-4">
                احفظ بياناتك للمرات القادمة! 🚀
              </h3>
              <p className="text-primary-700 dark:text-primary-300 font-arabic text-sm leading-relaxed mb-6">
                قم بإنشاء حساب الآن بضغطة زر واحدة لحفظ طلباتك، تتبع الشحنات، والحصول على عروض حصرية. سنقوم بملء بياناتك تلقائياً!
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-sm text-primary-800 dark:text-primary-200 font-arabic">
                  <ShieldCheck className="w-4 h-4" />
                  حماية كاملة لبياناتك
                </div>
                <div className="flex items-center gap-3 text-sm text-primary-800 dark:text-primary-200 font-arabic">
                  <Package className="w-4 h-4" />
                  تاريخ طلبات منظم
                </div>
              </div>

              <button
                onClick={() => navigate('/register', { 
                  state: { 
                    prefill: {
                      email: guestData.guestEmail,
                      full_name: guestData.guestName,
                      phone: guestData.guestPhone
                    }
                  } 
                })}
                className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/30 hover:bg-primary-600 transition-all flex items-center justify-center gap-2 font-arabic"
              >
                إنشاء حساب سريع
                <ExternalLink className="w-4 h-4" />
              </button>

              <p className="mt-4 text-center text-xs text-primary-600/60 dark:text-primary-400/40 font-arabic">
                سيتم نقلك لصفحة التسجيل مع بياناتك جاهزة
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-3">تفقد بريدك الإلكتروني</h3>
            <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm mb-6 max-w-xs">
              لقد أرسلنا لك تفاصيل الطلب وفاتورة الشراء إلى بريدك الإلكتروني.
            </p>
            <Link
              to="/orders"
              className="text-primary-600 font-bold font-arabic hover:underline flex items-center gap-2"
            >
              عرض كافة طلباتي
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </motion.div>
        )}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 font-arabic transition-colors"
        >
          العودة للتسوق
          <ArrowRight className="w-4 h-4 rotate-180" />
        </Link>
      </div>
    </div>
  );
}
