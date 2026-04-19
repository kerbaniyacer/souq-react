import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User, Menu, X, Search, Store, LayoutDashboard, LogOut, ChevronDown, Package, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@souq/stores/authStore';
import { useCartStore } from '@souq/stores/cartStore';
import ThemeToggle from '@souq/components/common/ThemeToggle';

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

  return (
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
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 dark:border-gray-800 mt-2 animate-slide-down">
            <form onSubmit={handleSearch} className="mt-3 mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن منتج..."
                  className="w-full pr-4 pl-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm font-arabic text-gray-900 dark:text-gray-100"
                />
                <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
            {/* Mobile theme toggle */}
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300 font-arabic">المظهر</span>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-1">
              <Link to="/products" onClick={() => setIsOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-arabic hover:text-primary-600 dark:hover:text-primary-400 transition-colors">المنتجات</Link>
              <Link to="/cart" onClick={() => setIsOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-arabic hover:text-primary-600 dark:hover:text-primary-400 transition-colors">السلة ({cartCount})</Link>
              <Link to="/wishlist" onClick={() => setIsOpen(false)} className="px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 font-arabic hover:text-primary-600 dark:hover:text-primary-400 transition-colors">المفضلة</Link>
              {isAuthenticated && profile?.is_seller && (
                <>
                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                  <p className="px-3 py-1 text-xs text-gray-400 dark:text-gray-500 font-arabic">لوحة التاجر</p>
                  <Link to="/merchant/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary-600 dark:text-primary-400 font-arabic hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                    <LayoutDashboard className="w-4 h-4" /> لوحة التحكم
                  </Link>
                  <Link to="/merchant/products" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary-600 dark:text-primary-400 font-arabic hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                    <Package className="w-4 h-4" /> منتجاتي
                  </Link>
                  <Link to="/merchant/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-primary-600 dark:text-primary-400 font-arabic hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors">
                    <ClipboardList className="w-4 h-4" /> إدارة الطلبات
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
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
  );
}
