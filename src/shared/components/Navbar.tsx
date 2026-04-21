import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search, Store, LayoutDashboard, LogOut, ChevronDown, Package, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useCartStore } from '@shared/stores/cartStore';
import ThemeToggle from '@shared/components/common/ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const { itemsCount } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isMerchantPage = location.pathname.startsWith('/merchant');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const cartCount = itemsCount();

  const MobileNavLink = ({ to, icon: Icon, children, count, color = "text-gray-700 dark:text-gray-300" }: any) => (
    <Link 
      to={to} 
      onClick={() => setIsOpen(false)} 
      className={`flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 ${color} font-arabic font-medium`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 ${color.replace('text-', 'text-opacity-70 text-')}`}>
          <Icon className="w-5 h-5" />
        </div>
        {children}
      </div>
      {count !== undefined && (
        <span className="bg-primary-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
      )}
    </Link>
  );

  return (
    <>
      <nav
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md dark:shadow-gray-950/50'
          : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center shadow-md shadow-primary-400/30">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-400 font-arabic">سوق</span>
          </Link>

          {/* Search bar - desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full pr-4 pl-10 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 text-sm font-arabic text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-400 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-primary-400 transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-400 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
            >
              <Heart className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-rose-500 transition-colors" />
            </Link>

            {/* User menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {profile?.photo ? (
                    <img src={profile.photo} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-arabic text-gray-700 dark:text-gray-300">{user?.first_name || user?.username}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-gray-950/50 border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-slide-down">
                    <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-arabic">{user?.username}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 font-arabic transition-colors"
                      >
                        <User className="w-4 h-4" />
                        الملف الشخصي
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 font-arabic transition-colors"
                      >
                        <Store className="w-4 h-4" />
                        طلباتي
                      </Link>
                      {profile?.is_seller && (
                        <>
                          <div className="mx-2 my-1 border-t border-gray-100 dark:border-gray-800" />
                          <p className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 font-arabic">لوحة التاجر</p>
                          <Link
                            to="/merchant/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-primary-600 dark:text-primary-400 font-arabic transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            لوحة التحكم
                          </Link>
                          <Link
                            to="/merchant/products"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-primary-600 dark:text-primary-400 font-arabic transition-colors"
                          >
                            <Package className="w-4 h-4" />
                            منتجاتي
                          </Link>
                          <Link
                            to="/merchant/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm text-primary-600 dark:text-primary-400 font-arabic transition-colors"
                          >
                            <ClipboardList className="w-4 h-4" />
                            إدارة الطلبات
                          </Link>
                        </>
                      )}
                      {user?.is_staff && (
                        <Link
                          to="/admin-panel"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 font-arabic transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          لوحة الإدارة
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500 font-arabic transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors"
                >
                  دخول
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-400 text-white text-sm rounded-xl hover:bg-primary-500 font-arabic transition-colors"
                >
                  تسجيل
                </Link>
              </div>
            )}

            {/* Mobile menu btn */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-90 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* شريط التاجر */}
      {isAuthenticated && profile?.is_seller && isMerchantPage && (
        <div className="bg-primary-400 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
              <Link
                to="/merchant/dashboard"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap transition-colors ${
                  location.pathname === '/merchant/dashboard' ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                لوحة التحكم
              </Link>
              <Link
                to="/merchant/products"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap transition-colors ${
                  location.pathname.startsWith('/merchant/products') ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                }`}
              >
                <Package className="w-4 h-4" />
                منتجاتي
              </Link>
              <Link
                to="/merchant/orders"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap transition-colors ${
                  location.pathname.startsWith('/merchant/orders') ? 'bg-white/20 font-medium' : 'hover:bg-white/10'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                إدارة الطلبات
              </Link>
              <Link
                to="/merchant/products/add"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-arabic whitespace-nowrap bg-white/15 hover:bg-white/25 transition-colors mr-auto"
              >
                + منتج جديد
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>

    {/* Mobile Drawer (Outside nav) */}
    {isOpen && (
      <div className="fixed inset-0 z-[100] md:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
          onClick={() => setIsOpen(false)}
        />
        
        {/* Drawer Panel */}
        <div className="absolute top-0 right-0 h-full w-[280px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col animate-[slideInRight_0.4s_ease-out] border-l border-gray-100 dark:border-gray-800">
          {/* Drawer Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-400 rounded-xl flex items-center justify-center shadow-md shadow-primary-400/20">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-lg tracking-tight">سوق</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="إغلاق القائمة"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 no-scrollbar flex flex-col gap-8">
            {/* Search */}
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتجات..."
                  className="w-full pr-11 pl-4 py-3.5 rounded-2xl border-2 border-gray-50 dark:border-gray-900 bg-gray-50 dark:bg-gray-900 focus:border-primary-400/50 focus:bg-white dark:focus:bg-gray-800 text-sm font-arabic transition-all"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-400 transition-colors" />
              </div>
            </form>

            {/* Shopping Section */}
            <div className="space-y-2">
              <p className="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-arabic">اكتشف</p>
              <div className="space-y-1">
                <MobileNavLink to="/products" icon={Package}>جميع المنتجات</MobileNavLink>
                <MobileNavLink to="/cart" icon={ShoppingCart} count={cartCount}>سلة المشتريات</MobileNavLink>
                <MobileNavLink to="/wishlist" icon={Heart} color="text-rose-500">المفضلة</MobileNavLink>
              </div>
            </div>

            {/* Account Section */}
            <div className="space-y-2">
              <p className="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest font-arabic">حسابي</p>
              <div className="space-y-1">
                {isAuthenticated ? (
                  <>
                    <MobileNavLink to="/profile" icon={User}>الملف الشخصي</MobileNavLink>
                    <MobileNavLink to="/orders" icon={ClipboardList}>طلباتي</MobileNavLink>
                    
                    {profile?.is_seller && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
                        <p className="px-3 text-[11px] font-bold text-primary-400 uppercase tracking-widest font-arabic mb-2">لوحة التاجر</p>
                        <MobileNavLink to="/merchant/dashboard" icon={LayoutDashboard} color="text-primary-500">لوحة التحكم</MobileNavLink>
                        <MobileNavLink to="/merchant/products" icon={Package} color="text-primary-500">منتجاتي</MobileNavLink>
                        <MobileNavLink to="/merchant/orders" icon={ClipboardList} color="text-primary-500">إدارة الطلبات</MobileNavLink>
                      </div>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-arabic font-medium mt-4 group"
                    >
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/10 group-hover:bg-red-100 dark:group-hover:bg-red-900/20 transition-colors">
                        <LogOut className="w-5 h-5" />
                      </div>
                      تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 pt-2">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="w-full py-4 px-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-sm font-bold text-center text-gray-700 dark:text-gray-200 font-arabic hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">تسجيل الدخول</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="w-full py-4 px-4 bg-primary-400 rounded-2xl text-sm font-bold text-center text-white font-arabic shadow-xl shadow-primary-400/20 hover:bg-primary-500 transition-all active:scale-[0.98]">إنشاء حساب مجاني</Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">الإصدار v1.0</p>
              <p className="text-[10px] text-gray-300 dark:text-gray-600">Souq All Rights Reserved</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    )}
  </>
  );
}
