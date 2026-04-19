import { Link } from 'react-router-dom';
import { CheckCircle, Home, ShoppingBag, LayoutDashboard, User } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';

export default function RegistrationSuccess() {
  const { user, profile } = useAuthStore();

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          {/* Success animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 font-arabic mb-2">مرحباً بك في سوق!</h1>
          <p className="text-gray-500 font-arabic mb-6">تم إنشاء حسابك بنجاح</p>

          {/* User Info */}
          {user && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-xl">
                    {user.username?.slice(0, 1).toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 font-arabic">
                    {(user as any).first_name || (user as any).last_name
                      ? `${(user as any).first_name} ${(user as any).last_name}`.trim()
                      : user.username}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-arabic font-medium ${
                    profile?.is_seller
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {profile?.is_seller ? 'تاجر' : 'مشتري'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Email notice */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-right">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="font-medium text-gray-800 text-sm font-arabic">تم إرسال بريد الترحيب</p>
                <p className="text-gray-500 text-xs mt-1 font-arabic leading-relaxed">
                  تحقق من بريدك الإلكتروني للاستفادة من جميع مميزات الحساب
                </p>
              </div>
              <span className="text-xl shrink-0">📧</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 mb-6">
            <Link to="/" className="w-full py-3 bg-primary-400 text-white rounded-xl font-arabic font-medium hover:bg-primary-500 transition-colors flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              ابدأ التسوق الآن
            </Link>
            <Link to="/products" className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-arabic font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              تصفح المنتجات
            </Link>
            {profile?.is_seller && (
              <Link to="/merchant/dashboard" className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-arabic font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                لوحة التحكم
              </Link>
            )}
            <Link to="/profile" className="w-full py-3 border border-gray-200 text-gray-700 rounded-xl font-arabic font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
              أكمل ملفك الشخصي
            </Link>
          </div>

          {/* Benefits */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium text-gray-700 font-arabic mb-4">مميزات حسابك الجديد:</p>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-500 font-arabic">
              {['تتبع الطلبات', 'قائمة المفضلة', 'عروض حصرية', 'توصيل سريع'].map((b) => (
                <div key={b} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-500 shrink-0" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
